import type { ReactNode } from "react";
export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-page-header">
      <div className="min-w-0">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
