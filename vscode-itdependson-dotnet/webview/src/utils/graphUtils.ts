import { GraphNode, GraphEdge } from 'reagraph';
import { DependencyGraph, DependencyNode, DependencyEdge, ReferencingProject } from '../types';

/**
 * Filters the graph to show only the selected project and its dependencies
 * Returns an empty graph if no project is selected
 */
export function filterGraphByProject(
  fullGraph: DependencyGraph,
  selectedProjectId: string | null
): DependencyGraph {
  if (!selectedProjectId) {
    // Return empty graph by default - user must select a project to view
    return { nodes: [], edges: [], rootNodeId: '' };
  }

  // Find all nodes that are reachable from the selected project (dependencies)
  const reachableNodes = new Set<string>();
  const queue = [selectedProjectId];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (reachableNodes.has(nodeId)) continue;
    reachableNodes.add(nodeId);

    // Find all edges where this node is the source
    fullGraph.edges.forEach(edge => {
      if (edge.source === nodeId && !reachableNodes.has(edge.target)) {
        queue.push(edge.target);
      }
    });
  }

  const filteredNodes = fullGraph.nodes.filter(node => reachableNodes.has(node.id));
  const filteredEdges = fullGraph.edges.filter(
    edge => reachableNodes.has(edge.source) && reachableNodes.has(edge.target)
  );

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    rootNodeId: selectedProjectId
  };
}

/**
 * Computes reverse dependencies (projects that reference the selected node)
 */
export function computeReferencedBy(
  fullGraph: DependencyGraph,
  selectedNode: DependencyNode | null
): ReferencingProject[] {
  if (!selectedNode) {
    return [];
  }

  // Find all edges where the selected node is the target (meaning the source references it)
  const referencingNodeIds = fullGraph.edges
    .filter(edge => edge.target === selectedNode.id)
    .map(edge => edge.source);

  // Get the node details for each referencing project
  const projects: ReferencingProject[] = [];
  for (const nodeId of referencingNodeIds) {
    const node = fullGraph.nodes.find(n => n.id === nodeId);
    if (node) {
      projects.push({
        id: node.id,
        name: node.label,
        path: node.data.path
      });
    }
  }
  return projects;
}

/**
 * Transforms DependencyNode array to GraphNode array for reagraph
 */
export function transformNodesToGraphNodes(nodes: DependencyNode[]): GraphNode[] {
  try {
    return nodes.map((node) => ({
      id: node.id,
      label: node.label,
      data: node.data
    }));
  } catch (e) {
    console.error('Error transforming nodes:', e);
    return [];
  }
}

/**
 * Transforms DependencyEdge array to GraphEdge array for reagraph
 */
export function transformEdgesToGraphEdges(edges: DependencyEdge[]): GraphEdge[] {
  try {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label
    }));
  } catch (e) {
    console.error('Error transforming edges:', e);
    return [];
  }
}