import React from 'react';
import { DependencyNode } from '../types';

export interface ErrorFallbackProps {
  nodes: DependencyNode[];
  edgeCount: number;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  nodes,
  edgeCount
}) => {
  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        height: '100vh'
      }}
    >
      <h2 style={{ color: 'var(--vscode-editor-foreground, #fff)' }}>
        Graph Rendering Error
      </h2>
      <p style={{ color: 'var(--vscode-descriptionForeground, #ccc)' }}>
        Failed to render the dependency graph. WebGL may not be available.
      </p>
      <p style={{ color: 'var(--vscode-descriptionForeground, #999)', fontSize: '12px' }}>
        Found {nodes.length} projects and {edgeCount} dependencies.
      </p>
      <div
        style={{
          marginTop: '20px',
          maxWidth: '600px',
          maxHeight: '300px',
          overflow: 'auto',
          background: '#2d2d2d',
          padding: '10px',
          borderRadius: '4px'
        }}
      >
        <h4 style={{ color: '#fff', marginBottom: '10px' }}>Projects:</h4>
        {nodes.map(n => (
          <div
            key={n.id}
            style={{ color: '#ccc', fontSize: '12px', marginBottom: '4px' }}
          >
            • {n.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorFallback;