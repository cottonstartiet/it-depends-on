import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

declare global {
  interface Window {
    graphData: {
      nodes: Array<{
        id: string;
        label: string;
        data: {
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
        };
      }>;
      edges: Array<{
        id: string;
        source: string;
        target: string;
      }>;
    };
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
