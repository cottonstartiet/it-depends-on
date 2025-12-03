import React from 'react';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📊',
  title,
  description
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default EmptyState;