import React from 'react';

export interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView
}) => {
  return (
    <div className="zoom-controls">
      <button
        className="zoom-btn"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
      <button
        className="zoom-btn"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
      <button
        className="zoom-btn"
        onClick={onFitView}
        title="Fit to View"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2h4v2H4v2H2V2zM10 2h4v4h-2V4h-2V2zM2 10h2v2h2v2H2v-4zM12 12v2h-2v-2h-2v-2h4v2z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
};

export default ZoomControls;