import React from "react";

interface AdminPlaceholderTabProps {
  title: string;
  description: string;
}

export const AdminPlaceholderTab: React.FC<AdminPlaceholderTabProps> = ({ title, description }) => {
  return (
    <div className="bg-surface border border-line rounded-3xl p-8 space-y-4">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <p className="text-sm text-muted">
        {description}
      </p>
      <div className="rounded-2xl border border-line/60 bg-ground p-6 text-muted">
        <p className="text-sm leading-6">
          This admin section is currently using the placeholder view. When the real implementation is ready, the full content will appear here.
        </p>
      </div>
    </div>
  );
};
