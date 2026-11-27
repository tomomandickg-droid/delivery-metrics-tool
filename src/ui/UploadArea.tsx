import { useRef, useState, type DragEvent } from 'react';

interface UploadAreaProps {
  readonly onFile: (file: File) => void;
  readonly onLoadSample: () => void;
  readonly busy: boolean;
}

/** Drop zone plus file picker plus "Load sample data" (plan.md §3, task 17). */
export function UploadArea({ onFile, onLoadSample, busy }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <section
      className={`panel upload${dragging ? ' is-dragging' : ''}`}
      aria-label="Upload a Jira CSV export"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="upload-text">
        <strong>Drop a Jira CSV export here</strong>
        <span>
          Needs the columns Issue key, Issue Type, Status, Created, Resolved and Started. The file
          stays on your computer.
        </span>
      </div>
      <div className="upload-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          Choose CSV file
        </button>
        <button type="button" className="button" onClick={onLoadSample} disabled={busy}>
          Load sample data
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="visually-hidden"
          aria-label="CSV file"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = '';
          }}
        />
      </div>
    </section>
  );
}
