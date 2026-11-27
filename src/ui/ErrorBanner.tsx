import { REQUIRED_COLUMNS } from '../domain/columns';

interface ErrorBannerProps {
  readonly fileName: string;
  readonly message: string;
}

/** Shown instead of the dashboard when a file cannot be used (spec: missing column named). */
export function ErrorBanner({ fileName, message }: ErrorBannerProps) {
  return (
    <div className="message message-error" role="alert">
      <h2>{fileName} can’t be used</h2>
      <p>{message}</p>
      <p className="detail">
        The file needs these columns: {REQUIRED_COLUMNS.join(', ')}. Jira’s “Custom field (Started)”
        also works for Started.
      </p>
    </div>
  );
}
