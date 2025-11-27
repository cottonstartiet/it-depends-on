import React, { useState, useCallback, useMemo, useRef, Component, ErrorInfo, ReactNode } from 'react';
import {
  GraphCanvas,
  GraphNode,
  GraphEdge,
  GraphCanvasRef,
  useSelection
} from 'reagraph';
import { DependencyGraph, DependencyNode, ProjectInfo } from './types';
import NodeDetails from './components/NodeDetails';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Graph rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const GraphComponent: React.FC<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  graph: DependencyGraph;
  onNodeSelect: (node: DependencyNode | null) => void;
  onNodeHover: (node: DependencyNode | null) => void;
}> = ({ nodes, edges, graph, onNodeSelect, onNodeHover }) => {
  const graphRef = useRef<GraphCanvasRef | null>(null);

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

  const handleNodePointerOver = useCallback((node: GraphNode) => {
    const dependencyNode = graph.nodes.find(n => n.id === node.id);
    onNodeHover(dependencyNode || null);
  }, [graph.nodes, onNodeHover]);

  const handleNodePointerOut = useCallback(() => {
    onNodeHover(null);
  }, [onNodeHover]);

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
      onNodePointerOver={handleNodePointerOver}
      onNodePointerOut={handleNodePointerOut}
      labelType="all"
      layoutType="forceDirected2d"
      layoutOverrides={{
        nodeStrength: -500,
        linkDistance: 150
      }}
      edgeArrowPosition="end"
      draggable
      animated
    />
  );
};

const App: React.FC = () => {
  const graph: DependencyGraph = window.initialGraph || { nodes: [], edges: [], rootNodeId: '' };
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<DependencyNode | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Debug log
  console.log('App rendering with graph data:', graph);
  console.log('Nodes count:', graph.nodes?.length || 0);
  console.log('Edges count:', graph.edges?.length || 0);

  // Transform nodes for reagraph format
  const nodes: GraphNode[] = useMemo(() => {
    try {
      return graph.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        data: node.data
      }));
    } catch (e) {
      console.error('Error transforming nodes:', e);
      return [];
    }
  }, [graph.nodes]);

  // Transform edges for reagraph format
  const edges: GraphEdge[] = useMemo(() => {
    try {
      return graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label
      }));
    } catch (e) {
      console.error('Error transforming edges:', e);
      return [];
    }
  }, [graph.edges]);

  // Show error if no data
  if (!graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', height: '100vh' }}>
        <h2 style={{ color: 'var(--vscode-editor-foreground, #fff)' }}>No Dependencies Found</h2>
        <p style={{ color: 'var(--vscode-descriptionForeground, #ccc)' }}>
          The selected file does not contain any project references, or could not be parsed.
        </p>
        <p style={{ color: 'var(--vscode-descriptionForeground, #999)', fontSize: '12px' }}>
          Check the developer console (Help → Toggle Developer Tools) for more details.
        </p>
      </div>
    );
  }

  const errorFallback = (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', height: '100vh' }}>
      <h2 style={{ color: 'var(--vscode-editor-foreground, #fff)' }}>Graph Rendering Error</h2>
      <p style={{ color: 'var(--vscode-descriptionForeground, #ccc)' }}>
        Failed to render the dependency graph. WebGL may not be available.
      </p>
      <p style={{ color: 'var(--vscode-descriptionForeground, #999)', fontSize: '12px' }}>
        Found {graph.nodes.length} projects and {graph.edges.length} dependencies.
      </p>
      <div style={{ marginTop: '20px', maxWidth: '600px', maxHeight: '300px', overflow: 'auto', background: '#2d2d2d', padding: '10px', borderRadius: '4px' }}>
        <h4 style={{ color: '#fff', marginBottom: '10px' }}>Projects:</h4>
        {graph.nodes.map(n => (
          <div key={n.id} style={{ color: '#ccc', fontSize: '12px', marginBottom: '4px' }}>
            • {n.label}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="graph-container">
        <ErrorBoundary fallback={errorFallback}>
          <GraphComponent
            nodes={nodes}
            edges={edges}
            graph={graph}
            onNodeSelect={setSelectedNode}
            onNodeHover={setHoveredNode}
          />
        </ErrorBoundary>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="hover-tooltip">
          <NodeDetails node={hoveredNode} compact />
        </div>
      )}

      {/* Side panel for selected node */}
      {selectedNode && (
        <div className="side-panel">
          <div className="side-panel-header">
            <h2>{selectedNode.label}</h2>
            <button
              className="close-button"
              onClick={() => setSelectedNode(null)}
            >
              ×
            </button>
          </div>
          <NodeDetails node={selectedNode} />
        </div>
      )}

      {/* Legend */}
      <div className="legend">
        <h3>Legend</h3>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#6366f1' }}></span>
          <span>Solution</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
          <span>Project</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
          <span>Library</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
          <span>Executable</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <span>{graph.nodes.length} projects</span>
        <span>{graph.edges.length} dependencies</span>
      </div>
    </div>
  );
};

export default App;