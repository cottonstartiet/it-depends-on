interface StatsPanelProps {
  nodeCount: number;
  edgeCount: number;
}

export default function StatsPanel({ nodeCount, edgeCount }: StatsPanelProps) {
  return (
    <div className="stats-panel">
      <h3>Graph Statistics</h3>
      <div className="stat-item">
        <span className="stat-label">Projects</span>
        <span className="stat-value">{nodeCount}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Dependencies</span>
        <span className="stat-value">{edgeCount}</span>
      </div>
    </div>
  );
}
