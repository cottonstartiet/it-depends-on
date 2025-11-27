export default function Legend() {
  return (
    <div className="legend-panel">
      <h4>Legend</h4>
      <div className="legend-item">
        <div className="legend-color library"></div>
        <span>Library</span>
      </div>
      <div className="legend-item">
        <div className="legend-color exe"></div>
        <span>Executable</span>
      </div>
      <div className="legend-item">
        <div className="legend-color test"></div>
        <span>Test Project</span>
      </div>
    </div>
  );
}
