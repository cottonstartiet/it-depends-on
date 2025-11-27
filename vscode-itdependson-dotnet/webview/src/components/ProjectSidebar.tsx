import React, { useState, useMemo } from 'react';
import { DependencyNode } from '../types';

interface ProjectSidebarProps {
  nodes: DependencyNode[];
  selectedProjectId: string | null;
  onProjectSelect: (node: DependencyNode) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  nodes,
  selectedProjectId,
  onProjectSelect
}) => {
  const [filter, setFilter] = useState('');

  const filteredNodes = useMemo(() => {
    if (!filter.trim()) {
      return nodes;
    }
    const lowerFilter = filter.toLowerCase();
    return nodes.filter(node =>
      node.label.toLowerCase().includes(lowerFilter) ||
      node.data.name.toLowerCase().includes(lowerFilter)
    );
  }, [nodes, filter]);

  const sortedNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredNodes]);

  return (
    <div className="project-sidebar">
      <div className="sidebar-header">
        <h3>Projects</h3>
        <span className="project-count">{nodes.length}</span>
      </div>

      <div className="filter-container">
        <input
          type="text"
          className="filter-input"
          placeholder="Filter projects..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <button
            className="clear-filter"
            onClick={() => setFilter('')}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>

      <div className="project-list">
        {sortedNodes.length === 0 ? (
          <div className="no-results">
            No projects match "{filter}"
          </div>
        ) : (
          sortedNodes.map(node => (
            <div
              key={node.id}
              className={`project-item ${selectedProjectId === node.id ? 'selected' : ''}`}
              onClick={() => onProjectSelect(node)}
              title={node.data.path}
            >
              <span className="project-name">{node.label}</span>
              {node.data.targetFramework && (
                <span className="project-framework">{node.data.targetFramework}</span>
              )}
            </div>
          ))
        )}
      </div>

      {filter && filteredNodes.length < nodes.length && (
        <div className="filter-info">
          Showing {filteredNodes.length} of {nodes.length} projects
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;