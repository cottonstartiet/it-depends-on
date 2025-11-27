import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import {
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  ProjectInfo,
  PackageReference
} from '../types';

export class ProjectParser {
  private parser: XMLParser;
  private visitedProjects: Map<string, DependencyNode> = new Map();
  private edges: DependencyEdge[] = [];
  private edgeIdCounter = 0;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
  }

  async parseFile(filePath: string): Promise<DependencyGraph> {
    this.visitedProjects.clear();
    this.edges = [];
    this.edgeIdCounter = 0;

    const ext = path.extname(filePath).toLowerCase();
    let rootNodeId: string;

    if (ext === '.sln') {
      rootNodeId = await this.parseSolutionFile(filePath);
    } else if (ext === '.csproj') {
      rootNodeId = await this.parseProjectFile(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    return {
      nodes: Array.from(this.visitedProjects.values()),
      edges: this.edges,
      rootNodeId
    };
  }

  private async parseSolutionFile(slnPath: string): Promise<string> {
    const content = fs.readFileSync(slnPath, 'utf-8');
    const slnDir = path.dirname(slnPath);
    const slnName = path.basename(slnPath, '.sln');

    // Create a virtual node for the solution
    const slnNodeId = this.normalizeId(slnPath);
    const slnNode: DependencyNode = {
      id: slnNodeId,
      label: slnName,
      data: {
        name: slnName,
        path: slnPath,
        outputType: 'Solution'
      }
    };
    this.visitedProjects.set(slnNodeId, slnNode);

    // Parse project references from .sln file
    // Format: Project("{GUID}") = "ProjectName", "RelativePath\Project.csproj", "{ProjectGUID}"
    const projectRegex = /Project\("[^"]*"\)\s*=\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/g;
    let match;

    while ((match = projectRegex.exec(content)) !== null) {
      const projectRelativePath = match[2];

      // Skip solution folders and non-csproj files
      if (!projectRelativePath.endsWith('.csproj')) {
        continue;
      }

      const projectFullPath = path.resolve(slnDir, projectRelativePath);

      if (fs.existsSync(projectFullPath)) {
        const projectNodeId = await this.parseProjectFile(projectFullPath);

        // Add edge from solution to project
        this.addEdge(slnNodeId, projectNodeId);
      }
    }

    return slnNodeId;
  }

  private async parseProjectFile(csprojPath: string): Promise<string> {
    const normalizedPath = path.normalize(csprojPath);
    const nodeId = this.normalizeId(normalizedPath);

    // Check if already visited to avoid circular dependencies
    if (this.visitedProjects.has(nodeId)) {
      return nodeId;
    }

    // Add a placeholder to prevent infinite recursion
    const projectName = path.basename(csprojPath, '.csproj');
    const placeholderNode: DependencyNode = {
      id: nodeId,
      label: projectName,
      data: {
        name: projectName,
        path: normalizedPath
      }
    };
    this.visitedProjects.set(nodeId, placeholderNode);

    try {
      const content = fs.readFileSync(normalizedPath, 'utf-8');
      const parsed = this.parser.parse(content);
      const project = parsed.Project;

      if (!project) {
        return nodeId;
      }

      // Extract project information
      const projectInfo = this.extractProjectInfo(project, projectName, normalizedPath);

      // Update the node with full information
      const fullNode: DependencyNode = {
        id: nodeId,
        label: projectName,
        data: projectInfo
      };
      this.visitedProjects.set(nodeId, fullNode);

      // Parse project references recursively
      const projectDir = path.dirname(normalizedPath);
      const projectRefs = this.getProjectReferences(project);

      for (const refPath of projectRefs) {
        const fullRefPath = path.resolve(projectDir, refPath);

        if (fs.existsSync(fullRefPath)) {
          const refNodeId = await this.parseProjectFile(fullRefPath);
          this.addEdge(nodeId, refNodeId);
        }
      }

      return nodeId;
    } catch (error) {
      console.error(`Error parsing project file ${normalizedPath}:`, error);
      return nodeId;
    }
  }

  private extractProjectInfo(project: any, name: string, filePath: string): ProjectInfo {
    const propertyGroups = this.ensureArray(project.PropertyGroup);
    const itemGroups = this.ensureArray(project.ItemGroup);

    const info: ProjectInfo = {
      name,
      path: filePath,
      sdk: project['@_Sdk']
    };

    // Extract properties from PropertyGroup elements
    for (const pg of propertyGroups) {
      if (pg.TargetFramework) {
        info.targetFramework = pg.TargetFramework;
      }
      if (pg.TargetFrameworks) {
        info.targetFramework = pg.TargetFrameworks;
      }
      if (pg.OutputType) {
        info.outputType = pg.OutputType;
      }
      if (pg.AssemblyName) {
        info.assemblyName = pg.AssemblyName;
      }
      if (pg.RootNamespace) {
        info.rootNamespace = pg.RootNamespace;
      }
      if (pg.Version) {
        info.version = pg.Version;
      }
      if (pg.Authors) {
        info.authors = pg.Authors;
      }
      if (pg.Description) {
        info.description = pg.Description;
      }
    }

    // Extract package references
    const packageRefs: PackageReference[] = [];
    for (const ig of itemGroups) {
      const refs = this.ensureArray(ig.PackageReference);
      for (const ref of refs) {
        if (ref && ref['@_Include']) {
          packageRefs.push({
            name: ref['@_Include'],
            version: ref['@_Version'] || ref.Version || 'unknown'
          });
        }
      }
    }

    if (packageRefs.length > 0) {
      info.packageReferences = packageRefs;
    }

    return info;
  }

  private getProjectReferences(project: any): string[] {
    const itemGroups = this.ensureArray(project.ItemGroup);
    const references: string[] = [];

    for (const ig of itemGroups) {
      const projectRefs = this.ensureArray(ig.ProjectReference);
      for (const ref of projectRefs) {
        if (ref && ref['@_Include']) {
          references.push(ref['@_Include']);
        }
      }
    }

    return references;
  }

  private ensureArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined || value === null) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private normalizeId(filePath: string): string {
    // Create a consistent ID from the file path
    return filePath.replace(/\\/g, '/').toLowerCase();
  }

  private addEdge(sourceId: string, targetId: string): void {
    const edgeId = `edge-${this.edgeIdCounter++}`;
    this.edges.push({
      id: edgeId,
      source: sourceId,
      target: targetId
    });
  }
}