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

  const load = async (fileName: string, isSample: boolean, read: () => Promise<string>) => {
    setState({ kind: 'loading' });
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

      {state.kind === 'loaded' && (
        <p className="source">
          <strong>{state.fileName}</strong>: {state.issues.length} issues
        </p>
      )}
    </main>
  );
}
