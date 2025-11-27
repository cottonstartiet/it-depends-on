import React from 'react';
import { DependencyNode, ProjectInfo } from '../types';

interface NodeDetailsProps {
  node: DependencyNode;
  compact?: boolean;
}

const NodeDetails: React.FC<NodeDetailsProps> = ({ node, compact = false }) => {
  const data: ProjectInfo = node.data;

  if (compact) {
    return (
      <div className="node-details compact">
        <div className="node-name">{node.label}</div>
        {data.targetFramework && (
          <div className="node-framework">{data.targetFramework}</div>
        )}
        {data.outputType && (
          <div className="node-type">{data.outputType}</div>
        )}
      </div>
    );
  }

  return (
    <div className="node-details">
      <div className="detail-section">
        <h4>Project Information</h4>
        <div className="detail-row">
          <span className="detail-label">Name:</span>
          <span className="detail-value">{data.name}</span>
        </div>
        {data.path && (
          <div className="detail-row">
            <span className="detail-label">Path:</span>
            <span className="detail-value path">{data.path}</span>
          </div>
        )}
        {data.outputType && (
          <div className="detail-row">
            <span className="detail-label">Output Type:</span>
            <span className="detail-value">{data.outputType}</span>
          </div>
        )}
      </div>

      {(data.targetFramework || data.sdk) && (
        <div className="detail-section">
          <h4>Framework</h4>
          {data.targetFramework && (
            <div className="detail-row">
              <span className="detail-label">Target Framework:</span>
              <span className="detail-value">{data.targetFramework}</span>
            </div>
          )}
          {data.sdk && (
            <div className="detail-row">
              <span className="detail-label">SDK:</span>
              <span className="detail-value">{data.sdk}</span>
            </div>
          )}
        </div>
      )}

      {(data.assemblyName || data.rootNamespace) && (
        <div className="detail-section">
          <h4>Assembly</h4>
          {data.assemblyName && (
            <div className="detail-row">
              <span className="detail-label">Assembly Name:</span>
              <span className="detail-value">{data.assemblyName}</span>
            </div>
          )}
          {data.rootNamespace && (
            <div className="detail-row">
              <span className="detail-label">Root Namespace:</span>
              <span className="detail-value">{data.rootNamespace}</span>
            </div>
          )}
        </div>
      )}

      {(data.version || data.authors || data.description) && (
        <div className="detail-section">
          <h4>Package Info</h4>
          {data.version && (
            <div className="detail-row">
              <span className="detail-label">Version:</span>
              <span className="detail-value">{data.version}</span>
            </div>
          )}
          {data.authors && (
            <div className="detail-row">
              <span className="detail-label">Authors:</span>
              <span className="detail-value">{data.authors}</span>
            </div>
          )}
          {data.description && (
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{data.description}</span>
            </div>
          )}
        </div>
      )}

      {data.packageReferences && data.packageReferences.length > 0 && (
        <div className="detail-section">
          <h4>NuGet Packages ({data.packageReferences.length})</h4>
          <div className="package-list">
            {data.packageReferences.map((pkg, index) => (
              <div key={index} className="package-item">
                <span className="package-name">{pkg.name}</span>
                <span className="package-version">{pkg.version}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeDetails;