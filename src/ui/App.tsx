import { useState } from 'react';
import { todayLocal } from '../domain/dates';
import type { CalendarDate } from '../domain/types';
import {
  fetchSampleCsv,
  loadCsvText,
  SAMPLE_FILE_NAME,
  type LoadedData,
  type LoadError,
} from './loadData';
import { DashboardView } from './Dashboard';
import { ErrorBanner } from './ErrorBanner';
import { UploadArea } from './UploadArea';

type State = { readonly kind: 'empty' } | { readonly kind: 'loading' } | LoadedData | LoadError;

interface AppProps {
  /** Today's date; tests pass a fixed date. Defaults to the viewer's local date. */
  readonly today?: CalendarDate;
  /** Loads the sample CSV text; tests pass a stub. */
  readonly loadSampleCsv?: () => Promise<string>;
}

export function App({ today = todayLocal(new Date()), loadSampleCsv = fetchSampleCsv }: AppProps) {
  const [state, setState] = useState<State>({ kind: 'empty' });
  // A new number for every load, so the dashboard (and its filter) starts fresh per file.
  const [loadCount, setLoadCount] = useState(0);

  const load = async (fileName: string, isSample: boolean, read: () => Promise<string>) => {
    setState({ kind: 'loading' });
    setLoadCount((n) => n + 1);
    let text: string;
    try {
      text = await read();
    } catch {
      setState({ kind: 'error', fileName, message: 'The file could not be read.' });
      return;
    }
    setState(loadCsvText(text, fileName, isSample, today));
  };

  return (
    <main className="app">
      <header className="app-header">
        <h1>Delivery Metrics</h1>
        <p>Throughput, lead time, cycle time and work in progress from a Jira CSV export.</p>
      </header>

      <UploadArea
        busy={state.kind === 'loading'}
        onFile={(file) => void load(file.name, false, () => file.text())}
        onLoadSample={() => void load(SAMPLE_FILE_NAME, true, loadSampleCsv)}
      />

      {state.kind === 'error' && <ErrorBanner fileName={state.fileName} message={state.message} />}

      {state.kind === 'loaded' && <DashboardView key={loadCount} data={state} today={today} />}

      {state.kind === 'empty' && (
        <div className="empty-state">
          <p>Upload a Jira CSV export, or load the sample data to try the tool. You will see:</p>
          <ul>
            <li>throughput per week and its 12-week average</li>
            <li>lead time and cycle time: median and 85th percentile</li>
            <li>work in progress by status</li>
          </ul>
        </div>
      )}
    </main>
  );
}
