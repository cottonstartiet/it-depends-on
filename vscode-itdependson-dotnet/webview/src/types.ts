export interface ProjectInfo {
  name: string;
  path: string;
  targetFramework?: string;
  sdk?: string;
  outputType?: string;
  assemblyName?: string;
  rootNamespace?: string;
  version?: string;
  authors?: string;
  description?: string;
  packageReferences?: PackageReference[];
}

export interface PackageReference {
  name: string;
  version: string;
}

export interface DependencyNode {
  id: string;
  label: string;
  data: ProjectInfo;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  rootNodeId: string;
}

// VS Code API type
export interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare global {
  interface Window {
    initialGraph: DependencyGraph;
    vscodeApi: VsCodeApi;
  }
}