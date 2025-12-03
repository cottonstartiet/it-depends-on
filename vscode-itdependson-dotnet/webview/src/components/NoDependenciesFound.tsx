import React from 'react';

const NoDependenciesFound: React.FC = () => {
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
        No Dependencies Found
      </h2>
      <p style={{ color: 'var(--vscode-descriptionForeground, #ccc)' }}>
        The selected file does not contain any project references, or could not be parsed.
      </p>
      <p style={{ color: 'var(--vscode-descriptionForeground, #999)', fontSize: '12px' }}>
        Check the developer console (Help → Toggle Developer Tools) for more details.
      </p>
    </div>
  );
};

export default NoDependenciesFound;