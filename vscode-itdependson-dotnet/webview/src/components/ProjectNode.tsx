import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface ProjectNodeData {
  label: string;
  selected?: boolean;
  projectData: {
    outputType: string;
    name: string;
  };
}

function ProjectNode({ data }: NodeProps) {
  const nodeData = data as unknown as ProjectNodeData;
  const outputType = nodeData.projectData?.outputType?.toLowerCase() || 'library';
  const isExe = outputType === 'exe' || outputType === 'winexe';
  const isTest = nodeData.label?.toLowerCase().includes('test');

  let nodeClass = 'project-node';
  if (isExe) {
    nodeClass += ' exe';
  } else if (isTest) {
    nodeClass += ' test';
  }
  if (nodeData.selected) {
    nodeClass += ' selected';
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', border: 'none' }}
      />
      <div className={nodeClass}>
        <div className="node-title">{nodeData.label}</div>
        <div className="node-type">
          {isExe ? 'Executable' : isTest ? 'Test Project' : 'Library'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', border: 'none' }}
      />
    </>
  );
}

export default memo(ProjectNode);
