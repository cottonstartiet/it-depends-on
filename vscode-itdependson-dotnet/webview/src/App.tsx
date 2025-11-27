import { useCallback, useState, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  MarkerType,
  Connection,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ProjectNode from './components/ProjectNode';
import NodeTooltip from './components/NodeTooltip';
import ProjectList from './components/ProjectList';
import StatsPanel from './components/StatsPanel';
import Legend from './components/Legend';
import { layoutGraph } from './utils/layoutGraph';

// Types matching the extension's types
export interface ProjectData {
  id: string;
  name: string;
  path: string;
  targetFramework: string[];
  outputType: string;
  assemblyName: string;
  rootNamespace: string;
  sdk: string;
  projectReferences: string[];
  packageReferences: Array<{ name: string; version: string }>;
  properties: Record<string, string>;
}

export interface GraphNodeData {
  id: string;
  label: string;
  data: ProjectData;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

const nodeTypes: NodeTypes = {
  project: ProjectNode,
};

function DependencyGraph() {
  const graphData: GraphData = window.graphData || { nodes: [], edges: [] };
  const { fitView } = useReactFlow();

  // State for tracking which projects are displayed on the canvas
  const [displayedProjectIds, setDisplayedProjectIds] = useState<Set<string>>(new Set());
  const [selectedListProject, setSelectedListProject] = useState<string | null>(null);

  // Create lookup maps for quick access
  const { nodeMap, edgesBySource } = useMemo(() => {
    const nodeMap = new Map<string, GraphNodeData>();
    graphData.nodes.forEach((node) => nodeMap.set(node.id, node));

    const edgesBySource = new Map<string, GraphEdgeData[]>();
    graphData.edges.forEach((edge) => {
      const edges = edgesBySource.get(edge.source) || [];
      edges.push(edge);
      edgesBySource.set(edge.source, edges);
    });

    return { nodeMap, edgesBySource };
  }, [graphData]);

  // Get dependencies for a project (nodes it points to)
  const getDependencies = useCallback(
    (projectId: string): string[] => {
      const edges = edgesBySource.get(projectId) || [];
      return edges.map((e) => e.target);
    },
    [edgesBySource]
  );

  // Calculate nodes and edges to display based on displayedProjectIds
  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (displayedProjectIds.size === 0) {
      return { visibleNodes: [], visibleEdges: [] };
    }

    const visibleNodeIds = new Set<string>(displayedProjectIds);
    const visibleEdgeSet = new Set<string>();

    // For each displayed project, also include its direct dependencies
    displayedProjectIds.forEach((projectId) => {
      const deps = getDependencies(projectId);
      deps.forEach((depId) => visibleNodeIds.add(depId));
    });

    // Create flow nodes
    const flowNodes: Node[] = [];
    visibleNodeIds.forEach((nodeId) => {
      const nodeData = nodeMap.get(nodeId);
      if (nodeData) {
        flowNodes.push({
          id: nodeData.id,
          type: 'project',
          position: { x: 0, y: 0 },
          data: {
            label: nodeData.label,
            projectData: nodeData.data,
            isRoot: displayedProjectIds.has(nodeId),
          },
        });
      }
    });

    // Create flow edges (only for visible connections)
    const flowEdges: Edge[] = [];
    graphData.edges.forEach((edge) => {
      if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) {
        const edgeId = edge.id;
        if (!visibleEdgeSet.has(edgeId)) {
          visibleEdgeSet.add(edgeId);
          flowEdges.push({
            id: edgeId,
            source: edge.source,
            target: edge.target,
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
          });
        }
      }
    });

    // Apply layout
    const layoutedNodes = layoutGraph(flowNodes, flowEdges);

    return { visibleNodes: layoutedNodes, visibleEdges: flowEdges };
  }, [displayedProjectIds, nodeMap, graphData.edges, getDependencies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(visibleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(visibleEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    node: Node;
    position: { x: number; y: number };
  } | null>(null);

  // Update nodes and edges when visible data changes
  useEffect(() => {
    setNodes(visibleNodes);
    setEdges(visibleEdges);
    // Fit view after updating
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  }, [visibleNodes, visibleEdges, setNodes, setEdges, fitView]);

  // Handle project selection from the list
  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedListProject(projectId);
    // Reset the canvas to show only this project and its dependencies
    setDisplayedProjectIds(new Set([projectId]));
    setSelectedNode(null);
  }, []);

  // Handle node click in the canvas - expand to show its dependencies
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      const isAlreadySelected = selectedNode === nodeId;
      const newSelectedNode = isAlreadySelected ? null : nodeId;
      setSelectedNode(newSelectedNode);

      // If clicking on a node, add it to displayed projects to show its dependencies
      if (!isAlreadySelected) {
        setDisplayedProjectIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(nodeId);
          return newSet;
        });
      }

      // Update nodes to show selection
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            selected: n.id === newSelectedNode,
          },
        }))
      );

      // Update edges to highlight connected ones
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          animated: newSelectedNode !== null && (e.source === newSelectedNode || e.target === newSelectedNode),
          style: {
            stroke:
              newSelectedNode !== null && (e.source === newSelectedNode || e.target === newSelectedNode)
                ? '#3794ff'
                : undefined,
            strokeWidth:
              newSelectedNode !== null && (e.source === newSelectedNode || e.target === newSelectedNode)
                ? 3
                : 2,
          },
        }))
      );
    },
    [selectedNode, setNodes, setEdges]
  );

  // Handle node mouse enter - show tooltip
  const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    setHoveredNode({
      node,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  // Handle node mouse leave - hide tooltip
  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  // Prevent new connections
  const onConnect = useCallback((_connection: Connection) => {
    // Do nothing - we don't allow manual connections
  }, []);

  // Reset view to show all projects
  const handleResetView = useCallback(() => {
    setDisplayedProjectIds(new Set());
    setSelectedListProject(null);
    setSelectedNode(null);
  }, []);

  return (
    <div className="app-container">
      <ProjectList
        projects={graphData.nodes}
        selectedProjectId={selectedListProject}
        onProjectSelect={handleProjectSelect}
        onResetView={handleResetView}
      />
      <div className="canvas-container">
        {displayedProjectIds.size === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h2>Select a Project</h2>
            <p>Choose a project from the list on the left to visualize its dependencies.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
              },
            }}
          >
            <Background color="#444" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const outputType =
                  (node.data as { projectData?: ProjectData })?.projectData?.outputType?.toLowerCase() || '';
                if (outputType === 'exe' || outputType === 'winexe') {
                  return '#3e8e41';
                }
                if (node.data.label?.toLowerCase().includes('test')) {
                  return '#9c27b0';
                }
                return '#0e639c';
              }}
              maskColor="rgba(0, 0, 0, 0.8)"
            />
          </ReactFlow>
        )}

        {displayedProjectIds.size > 0 && (
          <>
            <StatsPanel nodeCount={nodes.length} edgeCount={edges.length} />
            <Legend />
          </>
        )}

        {hoveredNode && <NodeTooltip node={hoveredNode.node} position={hoveredNode.position} />}
      </div>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <DependencyGraph />
    </ReactFlowProvider>
  );
}

export default App;
