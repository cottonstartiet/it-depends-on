import React from 'react';

export interface StatsBarProps {
  nodeCount: number;
  edgeCount: number;
  selectedProjectId: string | null;
  onClearSelection: () => void;
}

const StatsBar: React.FC<StatsBarProps> = ({
  nodeCount,
  edgeCount,
  selectedProjectId,
  onClearSelection
}) => {
  return (
    <div className="stats">
      <span>{nodeCount} projects</span>
      <span>{edgeCount} dependencies</span>
      {selectedProjectId && (
        <button
          className="reset-view-btn"
          onClick={onClearSelection}
        >
          Clear Selection
        </button>
      )}
    </div>
  );
};

export default StatsBar;