import * as fs from 'fs';
import { parseProjectFile, parseSolutionFile } from './projectParser';
import { ProjectInfo, DependencyGraph, GraphNode, GraphEdge } from '../types';

/**
 * Builds a complete dependency graph from a solution or project file
 */
export async function buildDependencyGraph(filePath: string): Promise<DependencyGraph> {
    const projectMap = new Map<string, ProjectInfo>();
    const visitedPaths = new Set<string>();
    
    // Determine if it's a solution or project file
    const isSolution = filePath.toLowerCase().endsWith('.sln');
    
    let projectPaths: string[];
    
    if (isSolution) {
        projectPaths = await parseSolutionFile(filePath);
    } else {
        projectPaths = [filePath];
    }
    
    // Recursively analyze all projects
    for (const projectPath of projectPaths) {
        await analyzeProjectRecursively(projectPath, projectMap, visitedPaths);
    }
    
    // Build graph nodes and edges
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const edgeSet = new Set<string>();
    
    for (const [, project] of projectMap) {
        // Create node
        nodes.push({
            id: project.id,
            label: project.name,
            data: project,
        });
        
        // Create edges for dependencies
        for (const refPath of project.projectReferences) {
            const edgeId = `${project.id}->${refPath}`;
            
            // Only add edge if target exists and edge hasn't been added
            if (projectMap.has(refPath) && !edgeSet.has(edgeId)) {
                edges.push({
                    id: edgeId,
                    source: project.id,  // Project A depends on...
                    target: refPath,     // ...Project B (A -> B)
                });
                edgeSet.add(edgeId);
            }
        }
    }
    
    return { nodes, edges };
}

/**
 * Recursively analyzes a project and all its dependencies
 */
async function analyzeProjectRecursively(
    projectPath: string,
    projectMap: Map<string, ProjectInfo>,
    visitedPaths: Set<string>
): Promise<void> {
    // Skip if already visited
    if (visitedPaths.has(projectPath)) {
        return;
    }
    
    visitedPaths.add(projectPath);
    
    // Check if file exists
    if (!fs.existsSync(projectPath)) {
        console.warn(`Project file not found: ${projectPath}`);
        return;
    }
    
    try {
        // Parse the project
        const projectInfo = await parseProjectFile(projectPath);
        projectMap.set(projectPath, projectInfo);
        
        // Recursively analyze dependencies
        for (const refPath of projectInfo.projectReferences) {
            await analyzeProjectRecursively(refPath, projectMap, visitedPaths);
        }
    } catch (error) {
        console.error(`Error parsing project ${projectPath}:`, error);
    }
}
