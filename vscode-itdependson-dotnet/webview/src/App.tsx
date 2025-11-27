import React, { useState, useCallback, useMemo, useRef, Component, ErrorInfo, ReactNode } from 'react';
import {
  GraphCanvas,
  GraphNode,
  GraphEdge,
  GraphCanvasRef,
  useSelection,
  darkTheme
} from 'reagraph';
import { DependencyGraph, DependencyNode, DependencyEdge, ProjectInfo } from './types';
import NodeDetails from './components/NodeDetails';
import ProjectSidebar from './components/ProjectSidebar';

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
  graphRef: React.RefObject<GraphCanvasRef | null>;
}> = ({ nodes, edges, graph, onNodeSelect, onNodeHover, graphRef }) => {
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
      theme={darkTheme}
    />
  );
};

const App: React.FC = () => {
  const fullGraph: DependencyGraph = window.initialGraph || { nodes: [], edges: [], rootNodeId: '' };
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<DependencyNode | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const graphRef = useRef<GraphCanvasRef | null>(null);

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomOut();
    }
  }, []);

  const handleFitView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.fitNodesInView();
    }
  }, []);

  // Filter graph based on selected project - show only the selected project and its dependencies
  // By default, show empty graph until a project is selected
  const graph = useMemo((): DependencyGraph => {
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
  }, [fullGraph, selectedProjectId]);

  const handleProjectSelect = useCallback((node: DependencyNode) => {
    setSelectedProjectId(node.id);
    setSelectedNode(null);
  }, []);

  // Debug log
  console.log('App rendering with graph data:', graph);
  console.log('Nodes count:', graph.nodes?.length || 0);
  console.log('Edges count:', graph.edges?.length || 0);
  console.log('Selected project:', selectedProjectId);

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
  if (!fullGraph.nodes || fullGraph.nodes.length === 0) {
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
      {/* Left Sidebar */}
      <ProjectSidebar
        nodes={fullGraph.nodes}
        selectedProjectId={selectedProjectId}
        onProjectSelect={handleProjectSelect}
      />

      <div className="main-content">
        <div className="graph-container">
          {selectedProjectId ? (
            <ErrorBoundary fallback={errorFallback}>
              <GraphComponent
                nodes={nodes}
                edges={edges}
                graph={graph}
                onNodeSelect={setSelectedNode}
                onNodeHover={setHoveredNode}
                graphRef={graphRef}
              />
            </ErrorBoundary>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>Select a Project</h3>
              <p>Choose a project from the sidebar to view its dependency graph</p>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        {selectedProjectId && (
          <div className="zoom-controls">
            <button
              className="zoom-btn"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
            <button
              className="zoom-btn"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
            <button
              className="zoom-btn"
              onClick={handleFitView}
              title="Fit to View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h4v2H4v2H2V2zM10 2h4v4h-2V4h-2V2zM2 10h2v2h2v2H2v-4zM12 12v2h-2v-2h-2v-2h4v2z" fill="currentColor" />
              </svg>
            </button>
          </div>
        )}

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

        {/* Stats */}
        <div className="stats">
          <span>{graph.nodes.length} projects</span>
          <span>{graph.edges.length} dependencies</span>
          {selectedProjectId && (
            <button
              className="reset-view-btn"
              onClick={() => setSelectedProjectId(null)}
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;