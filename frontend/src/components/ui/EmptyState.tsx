import React from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action
}) => {
    return (
        <div className="empty-state animate-fade-in" role="status" aria-label={title}>
            <span
                className="material-symbols-outlined empty-state-icon"
                aria-hidden="true"
            >
                {icon}
            </span>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-description">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors touch-feedback"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
