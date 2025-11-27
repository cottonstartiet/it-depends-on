/**
 * Represents a .NET project with its metadata and dependencies
 */
export interface ProjectInfo {
    /** Unique identifier for the project (usually the full path) */
    id: string;
    /** Project name (file name without extension) */
    name: string;
    /** Full path to the .csproj file */
    path: string;
    /** Target framework(s) */
    targetFramework: string[];
    /** Output type (Library, Exe, etc.) */
    outputType: string;
    /** Assembly name */
    assemblyName: string;
    /** Root namespace */
    rootNamespace: string;
    /** Project SDK (e.g., Microsoft.NET.Sdk) */
    sdk: string;
    /** List of project reference paths (dependencies) */
    projectReferences: string[];
    /** List of NuGet package references */
    packageReferences: PackageReference[];
    /** Additional properties from the project file */
    properties: Record<string, string>;
}

/**
 * Represents a NuGet package reference
 */
export interface PackageReference {
    name: string;
    version: string;
}

/**
 * Represents a node in the dependency graph
 */
export interface GraphNode {
    id: string;
    label: string;
    data: ProjectInfo;
}

/**
 * Represents an edge (dependency) in the graph
 */
export interface GraphEdge {
    id: string;
    source: string;  // Project that depends on target
    target: string;  // Project being depended on
}

/**
 * Complete dependency graph data
 */
export interface DependencyGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
