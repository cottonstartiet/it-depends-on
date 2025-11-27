import { Node, Edge } from '@xyflow/react';

interface LayoutNode extends Node {
  width?: number;
  height?: number;
}

/**
 * Simple hierarchical layout algorithm for the dependency graph
 * Places nodes in layers based on their dependency depth
 */
export function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) {
    return nodes;
  }

  // Build adjacency maps
  const incomingEdges = new Map<string, string[]>(); // node -> nodes that depend on it
  const outgoingEdges = new Map<string, string[]>(); // node -> nodes it depends on

  nodes.forEach((node) => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });

  edges.forEach((edge) => {
    const incoming = incomingEdges.get(edge.target) || [];
    incoming.push(edge.source);
    incomingEdges.set(edge.target, incoming);

    const outgoing = outgoingEdges.get(edge.source) || [];
    outgoing.push(edge.target);
    outgoingEdges.set(edge.source, outgoing);
  });

  // Calculate depth for each node using topological sort
  const nodeDepths = new Map<string, number>();
  const visited = new Set<string>();

  function calculateDepth(nodeId: string): number {
    if (nodeDepths.has(nodeId)) {
      return nodeDepths.get(nodeId)!;
    }

    if (visited.has(nodeId)) {
      // Circular dependency detected, return current depth
      return 0;
    }

    visited.add(nodeId);

    const dependencies = outgoingEdges.get(nodeId) || [];
    let maxDepth = 0;

    for (const depId of dependencies) {
      const depDepth = calculateDepth(depId);
      maxDepth = Math.max(maxDepth, depDepth + 1);
    }

    nodeDepths.set(nodeId, maxDepth);
    return maxDepth;
  }

  // Calculate depths for all nodes
  nodes.forEach((node) => {
    calculateDepth(node.id);
  });

  // Find the maximum depth
  let maxDepth = 0;
  nodeDepths.forEach((depth) => {
    maxDepth = Math.max(maxDepth, depth);
  });

  // Group nodes by depth (inverted so root nodes are at top)
  const layers: Node[][] = Array.from({ length: maxDepth + 1 }, () => []);

  nodes.forEach((node) => {
    const depth = nodeDepths.get(node.id) || 0;
    // Invert depth so nodes with most dependencies (root) are at top
    const invertedDepth = maxDepth - depth;
    layers[invertedDepth].push(node);
  });

  // Layout constants
  const nodeWidth = 180;
  const nodeHeight = 60;
  const horizontalSpacing = 60;
  const verticalSpacing = 100;

  // Position nodes
  const layoutedNodes: LayoutNode[] = [];

  layers.forEach((layer, layerIndex) => {
    const layerWidth = layer.length * nodeWidth + (layer.length - 1) * horizontalSpacing;
    const startX = -layerWidth / 2;

    layer.forEach((node, nodeIndex) => {
      const x = startX + nodeIndex * (nodeWidth + horizontalSpacing);
      const y = layerIndex * (nodeHeight + verticalSpacing);

      layoutedNodes.push({
        ...node,
        position: { x, y },
      });
    });
  });

  return layoutedNodes;
}
