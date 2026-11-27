import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/ui/App';
import { fromYmd } from '../../src/domain/dates';
import type { CalendarDate } from '../../src/domain/types';

/** The day the sample was generated for: Fri 27 Nov 2026 (so no sample shift). */
export const SAMPLE_DAY = fromYmd(2026, 11, 27) as CalendarDate;

export const sampleCsv = readFileSync(resolve('public/sample-data/jira-sample.csv'), 'utf8');
export const manualCsv = readFileSync(resolve('tests/fixtures/manual-small.csv'), 'utf8');

export function renderApp(today: CalendarDate = SAMPLE_DAY, sample = sampleCsv) {
  const user = userEvent.setup();
  const loadSampleCsv = () => Promise.resolve(sample);
  const view = render(<App today={today} loadSampleCsv={loadSampleCsv} />);
  return { user, ...view };
}

/** Uploads CSV text through the hidden file input. */
export async function uploadCsv(
  user: ReturnType<typeof userEvent.setup>,
  text: string,
  name = 'export.csv',
) {
  const file = new File([text], name, { type: 'text/csv' });
  await user.upload(screen.getByLabelText('CSV file'), file);
}
