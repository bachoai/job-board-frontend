import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
export { ErrorMessage } from "./ErrorMessage";
export { LoadingSpinner as Loading } from "./LoadingSpinner";
export { FormInput as Field } from "./FormInput";
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">KHÔNG GIAN LÀM VIỆC</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        <Inbox size={26} />
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
