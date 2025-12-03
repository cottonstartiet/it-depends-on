import React, { useCallback } from 'react';
import {
  GraphCanvas,
  GraphNode,
  GraphEdge,
  GraphCanvasRef,
  useSelection,
  darkTheme
} from 'reagraph';
import { DependencyGraph, DependencyNode } from '../types';

export interface GraphComponentProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  graph: DependencyGraph;
  onNodeSelect: (node: DependencyNode | null) => void;
  graphRef: React.RefObject<GraphCanvasRef | null>;
}

const GraphComponent: React.FC<GraphComponentProps> = ({
  nodes,
  edges,
  graph,
  onNodeSelect,
  graphRef
}) => {
  const {
    selections,
    actives,
    onNodeClick,
    onCanvasClick
  } = useSelection({
    ref: graphRef,
    nodes,
    edges,
    type: 'single',
    pathSelectionType: 'out'
  });

  const handleNodeClick = useCallback((node: GraphNode) => {
    const dependencyNode = graph.nodes.find(n => n.id === node.id);
    onNodeSelect(dependencyNode || null);
    if (onNodeClick) {
      onNodeClick(node);
    }

    // Send message to VS Code
    if (window.vscodeApi) {
      window.vscodeApi.postMessage({
        type: 'nodeClick',
        nodeId: node.id
      });
    }
  }, [graph.nodes, onNodeClick, onNodeSelect]);

  const handleCanvasClick = useCallback((event?: MouseEvent) => {
    onNodeSelect(null);
    if (onCanvasClick) {
      onCanvasClick(event as any);
    }
  }, [onCanvasClick, onNodeSelect]);

  console.log('Rendering GraphCanvas with nodes:', nodes.length, 'edges:', edges.length);

  return (
    <GraphCanvas
      ref={graphRef}
      nodes={nodes}
      edges={edges}
      selections={selections}
      actives={actives}
      onNodeClick={handleNodeClick}
      onCanvasClick={handleCanvasClick}
      labelType="all"
      layoutType="forceDirected2d"
      layoutOverrides={{
        nodeStrength: -500,
        linkDistance: 150
      }}
      edgeArrowPosition="end"
      draggable
      animated
      theme={darkTheme}
    />
  );
};

export default GraphComponent;