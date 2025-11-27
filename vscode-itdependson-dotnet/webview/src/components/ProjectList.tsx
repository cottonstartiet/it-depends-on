import { useState, useMemo } from 'react';
import { GraphNodeData } from '../App';

interface ProjectListProps {
  projects: GraphNodeData[];
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  onResetView: () => void;
}

export default function ProjectList({
  projects,
  selectedProjectId,
  onProjectSelect,
  onResetView,
}: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort projects alphabetically by name
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.label.localeCompare(b.label));
  }, [projects]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedProjects;
    }
    const query = searchQuery.toLowerCase();
    return sortedProjects.filter(
      (project) =>
        project.label.toLowerCase().includes(query) ||
        project.data.path.toLowerCase().includes(query) ||
        project.data.targetFramework.some((tf) => tf.toLowerCase().includes(query))
    );
  }, [sortedProjects, searchQuery]);

  const getProjectTypeClass = (project: GraphNodeData): string => {
    const outputType = project.data.outputType?.toLowerCase() || '';
    if (outputType === 'exe' || outputType === 'winexe') {
      return 'exe';
    }
    if (project.label.toLowerCase().includes('test')) {
      return 'test';
    }
    return 'library';
  };

  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <h2>Projects</h2>
        <span className="project-count">{projects.length}</span>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {selectedProjectId && (
        <button className="reset-button" onClick={onResetView}>
          Reset View
        </button>
      )}

      <div className="project-list">
        {filteredProjects.length === 0 ? (
          <div className="no-results">
            No projects match "{searchQuery}"
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`project-list-item ${getProjectTypeClass(project)} ${
                selectedProjectId === project.id ? 'selected' : ''
              }`}
              onClick={() => onProjectSelect(project.id)}
              title={project.data.path}
            >
              <div className="project-list-item-name">{project.label}</div>
              <div className="project-list-item-meta">
                {project.data.targetFramework.length > 0 && (
                  <span className="framework-badge">
                    {project.data.targetFramework[0]}
                  </span>
                )}
                {project.data.projectReferences.length > 0 && (
                  <span className="deps-badge">
                    {project.data.projectReferences.length} deps
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="project-list-footer">
        <span>
          {filteredProjects.length !== projects.length
            ? `Showing ${filteredProjects.length} of ${projects.length}`
            : `${projects.length} projects`}
        </span>
      </div>
    </div>
  );
}
