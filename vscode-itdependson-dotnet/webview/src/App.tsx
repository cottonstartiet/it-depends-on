import React, { useState, useCallback, useMemo, useRef } from 'react';
import { GraphCanvasRef } from 'reagraph';
import { DependencyGraph, DependencyNode } from './types';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import GraphComponent from './components/GraphComponent';
import ProjectSidebar from './components/ProjectSidebar';
import SidePanel from './components/SidePanel';
import ZoomControls from './components/ZoomControls';
import StatsBar from './components/StatsBar';
import EmptyState from './components/EmptyState';
import ErrorFallback from './components/ErrorFallback';
import NoDependenciesFound from './components/NoDependenciesFound';

// Utils
import {
  filterGraphByProject,
  computeReferencedBy,
  transformNodesToGraphNodes,
  transformEdgesToGraphEdges
} from './utils/graphUtils';

const App: React.FC = () => {
  const fullGraph: DependencyGraph = window.initialGraph || { nodes: [], edges: [], rootNodeId: '' };
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
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

  // Filter graph based on selected project
  const graph = useMemo(
    () => filterGraphByProject(fullGraph, selectedProjectId),
    [fullGraph, selectedProjectId]
  );

  // Compute reverse dependencies
  const referencedBy = useMemo(
    () => computeReferencedBy(fullGraph, selectedNode),
    [fullGraph, selectedNode]
  );

  const handleProjectSelect = useCallback((node: DependencyNode) => {
    setSelectedProjectId(node.id);
    setSelectedNode(null);
  }, []);

  const handleProjectClick = useCallback((projectId: string) => {
    const node = fullGraph.nodes.find(n => n.id === projectId);
    if (node) {
      setSelectedProjectId(projectId);
      setSelectedNode(node);
    }
  }, [fullGraph.nodes]);

  const handleClearSelection = useCallback(() => {
    setSelectedProjectId(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Debug log
  console.log('App rendering with graph data:', graph);
  console.log('Nodes count:', graph.nodes?.length || 0);
  console.log('Edges count:', graph.edges?.length || 0);
  console.log('Selected project:', selectedProjectId);

  // Transform nodes and edges for reagraph format
  const nodes = useMemo(
    () => transformNodesToGraphNodes(graph.nodes),
    [graph.nodes]
  );

  const edges = useMemo(
    () => transformEdgesToGraphEdges(graph.edges),
    [graph.edges]
  );

  // Show error if no data
  if (!fullGraph.nodes || fullGraph.nodes.length === 0) {
    return <NoDependenciesFound />;
  }

  const errorFallback = (
    <ErrorFallback nodes={graph.nodes} edgeCount={graph.edges.length} />
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
                graphRef={graphRef}
              />
            </ErrorBoundary>
          ) : (
            <EmptyState
              title="Select a Project"
              description="Choose a project from the sidebar to view its dependency graph"
            />
          )}
        </div>

        {/* Zoom Controls */}
        {selectedProjectId && (
          <ZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
          />
        )}

        {/* Side panel for selected node */}
        {selectedNode && (
          <SidePanel
            selectedNode={selectedNode}
            referencedBy={referencedBy}
            fullGraph={fullGraph}
            onClose={handleClosePanel}
            onProjectClick={handleProjectClick}
          />
        )}

        {/* Stats */}
        <StatsBar
          nodeCount={graph.nodes.length}
          edgeCount={graph.edges.length}
          selectedProjectId={selectedProjectId}
          onClearSelection={handleClearSelection}
        />
      </div>
    </div>
  );
};

export default App;