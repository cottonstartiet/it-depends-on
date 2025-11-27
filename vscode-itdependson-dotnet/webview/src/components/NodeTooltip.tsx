import { Node } from '@xyflow/react';

interface ProjectData {
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

interface NodeTooltipProps {
  node: Node;
  position: { x: number; y: number };
}

export default function NodeTooltip({ node, position }: NodeTooltipProps) {
  const data = node.data as { projectData?: ProjectData };
  const projectData = data.projectData;

  if (!projectData) {
    return null;
  }

  // Position tooltip near mouse but ensure it stays in viewport
  const tooltipStyle: React.CSSProperties = {
    left: Math.min(position.x + 15, window.innerWidth - 420),
    top: Math.min(position.y + 15, window.innerHeight - 300),
  };

  return (
    <div className="node-tooltip" style={tooltipStyle}>
      <h3>{projectData.name}</h3>

      <div className="tooltip-section">
        <div className="tooltip-label">Path</div>
        <div className="tooltip-value">{projectData.path}</div>
      </div>

      {projectData.sdk && (
        <div className="tooltip-section">
          <div className="tooltip-label">SDK</div>
          <div className="tooltip-value">{projectData.sdk}</div>
        </div>
      )}

      {projectData.targetFramework.length > 0 && (
        <div className="tooltip-section">
          <div className="tooltip-label">Target Framework</div>
          <div className="tooltip-value">{projectData.targetFramework.join(', ')}</div>
        </div>
      )}

      <div className="tooltip-section">
        <div className="tooltip-label">Output Type</div>
        <div className="tooltip-value">{projectData.outputType || 'Library'}</div>
      </div>

      {projectData.assemblyName && projectData.assemblyName !== projectData.name && (
        <div className="tooltip-section">
          <div className="tooltip-label">Assembly Name</div>
          <div className="tooltip-value">{projectData.assemblyName}</div>
        </div>
      )}

      {projectData.projectReferences.length > 0 && (
        <div className="tooltip-section">
          <div className="tooltip-label">Project References ({projectData.projectReferences.length})</div>
          <ul className="tooltip-list">
            {projectData.projectReferences.slice(0, 5).map((ref, index) => {
              const refName = ref.split(/[/\\]/).pop()?.replace('.csproj', '') || ref;
              return <li key={index}>{refName}</li>;
            })}
            {projectData.projectReferences.length > 5 && (
              <li>... and {projectData.projectReferences.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {projectData.packageReferences.length > 0 && (
        <div className="tooltip-section">
          <div className="tooltip-label">NuGet Packages ({projectData.packageReferences.length})</div>
          <ul className="tooltip-list">
            {projectData.packageReferences.slice(0, 5).map((pkg, index) => (
              <li key={index}>
                {pkg.name} {pkg.version !== 'Unknown' ? `(${pkg.version})` : ''}
              </li>
            ))}
            {projectData.packageReferences.length > 5 && (
              <li>... and {projectData.packageReferences.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
