import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { ProjectInfo, PackageReference } from '../types';

/**
 * Parses a .csproj file and extracts project information
 */
export async function parseProjectFile(projectPath: string): Promise<ProjectInfo> {
    const absolutePath = path.resolve(projectPath);
    const content = await fs.promises.readFile(absolutePath, 'utf-8');
    
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        allowBooleanAttributes: true,
    });
    
    const parsed = parser.parse(content);
    const project = parsed.Project || {};
    
    // Get SDK from Project element
    const sdk = project['@_Sdk'] || '';
    
    // Handle PropertyGroup - can be single object or array
    const propertyGroups = normalizeToArray(project.PropertyGroup);
    const properties: Record<string, string> = {};
    
    for (const pg of propertyGroups) {
        if (pg && typeof pg === 'object') {
            for (const [key, value] of Object.entries(pg)) {
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    properties[key] = String(value);
                }
            }
        }
    }
    
    // Extract target framework(s)
    const targetFramework: string[] = [];
    if (properties.TargetFramework) {
        targetFramework.push(properties.TargetFramework);
    }
    if (properties.TargetFrameworks) {
        targetFramework.push(...properties.TargetFrameworks.split(';').filter(Boolean));
    }
    
    // Handle ItemGroup - can be single object or array
    const itemGroups = normalizeToArray(project.ItemGroup);
    
    // Extract project references
    const projectReferences: string[] = [];
    const packageReferences: PackageReference[] = [];
    
    for (const ig of itemGroups) {
        if (!ig) { continue; }
        
        // Project references
        const projRefs = normalizeToArray(ig.ProjectReference);
        for (const ref of projRefs) {
            if (ref && ref['@_Include']) {
                const refPath = ref['@_Include'];
                // Resolve relative path to absolute
                const absoluteRefPath = path.resolve(path.dirname(absolutePath), refPath);
                projectReferences.push(absoluteRefPath);
            }
        }
        
        // Package references
        const pkgRefs = normalizeToArray(ig.PackageReference);
        for (const ref of pkgRefs) {
            if (ref && ref['@_Include']) {
                packageReferences.push({
                    name: ref['@_Include'],
                    version: ref['@_Version'] || ref.Version || 'Unknown',
                });
            }
        }
    }
    
    const projectName = path.basename(absolutePath, '.csproj');
    
    return {
        id: absolutePath,
        name: projectName,
        path: absolutePath,
        targetFramework,
        outputType: properties.OutputType || 'Library',
        assemblyName: properties.AssemblyName || projectName,
        rootNamespace: properties.RootNamespace || projectName,
        sdk,
        projectReferences,
        packageReferences,
        properties,
    };
}

/**
 * Parses a .sln file and extracts all project paths
 */
export async function parseSolutionFile(solutionPath: string): Promise<string[]> {
    const absolutePath = path.resolve(solutionPath);
    const content = await fs.promises.readFile(absolutePath, 'utf-8');
    const solutionDir = path.dirname(absolutePath);
    
    const projectPaths: string[] = [];
    
    // Match Project lines in solution file
    // Format: Project("{GUID}") = "ProjectName", "RelativePath\Project.csproj", "{GUID}"
    const projectRegex = /Project\("[^"]*"\)\s*=\s*"[^"]*",\s*"([^"]+\.csproj)"/gi;
    
    let match;
    while ((match = projectRegex.exec(content)) !== null) {
        const relativePath = match[1].replace(/\\/g, path.sep);
        const absoluteProjectPath = path.resolve(solutionDir, relativePath);
        
        // Check if file exists before adding
        if (fs.existsSync(absoluteProjectPath)) {
            projectPaths.push(absoluteProjectPath);
        }
    }
    
    return projectPaths;
}

/**
 * Normalizes a value to an array
 */
function normalizeToArray<T>(value: T | T[] | undefined | null): T[] {
    if (value === undefined || value === null) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}
