import React from 'react';
import { DependencyNode, DependencyGraph, ReferencingProject } from '../types';
import NodeDetails from './NodeDetails';

export interface SidePanelProps {
  selectedNode: DependencyNode;
  referencedBy: ReferencingProject[];
  fullGraph: DependencyGraph;
  onClose: () => void;
  onProjectClick: (projectId: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  selectedNode,
  referencedBy,
  fullGraph,
  onClose,
  onProjectClick
}) => {
  const handleProjectClick = (projectId: string) => {
    const node = fullGraph.nodes.find(n => n.id === projectId);
    if (node) {
      onProjectClick(projectId);
    }
  };

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h2>{selectedNode.label}</h2>
        <button
          className="close-button"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <NodeDetails
        node={selectedNode}
        referencedBy={referencedBy}
        onProjectClick={handleProjectClick}
      />
    </div>
  );
};

export default SidePanel;