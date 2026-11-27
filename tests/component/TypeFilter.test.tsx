import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { fromYmd } from '../../src/domain/dates';
import type { CalendarDate } from '../../src/domain/types';
import { cardRow, cardValue } from './cards';
import { manualCsv, renderApp, uploadCsv } from './render';

async function loadManual() {
  const view = renderApp();
  await uploadCsv(view.user, manualCsv, 'manual-small.csv');
  await screen.findByText('manual-small.csv');
  return view;
}

const filter = () => screen.getByRole('group', { name: 'Issue type' });
const checkbox = (name: RegExp) => within(filter()).getByRole('checkbox', { name });

/** Rows of the throughput chart's data table. */
const weekCounts = () =>
  within(screen.getByRole('table', { name: 'Issues resolved per week' }))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[1]!.textContent);

describe('Issue Type filter (acceptance criterion 4, task 21)', () => {
  it('lists every type with its count, all selected after upload', async () => {
    await loadManual();
    expect(checkbox(/^Bug/)).toBeChecked();
    expect(checkbox(/^Story/)).toBeChecked();
    expect(checkbox(/^Task/)).toBeChecked();
    // Kept issues: 7 Story, 4 Bug, 2 Task
    expect(checkbox(/^Story/).closest('label')).toHaveTextContent('Story7');
    expect(checkbox(/^Bug/).closest('label')).toHaveTextContent('Bug4');
    expect(checkbox(/^Task/).closest('label')).toHaveTextContent('Task2');
  });

  it('Bug only: every card and both charts update (manual-small.expected.md §6)', async () => {
    const { user } = await loadManual();
    await user.click(checkbox(/^Story/));
    await user.click(checkbox(/^Task/));

    expect(cardValue('Throughput')).toBe('0.2 per week');
    expect(cardValue('Lead time')).toBe('3 days');
    expect(cardRow('Lead time', '85th percentile')).toBe('4.4 days');
    expect(cardValue('Cycle time')).toBe('1 day');
    expect(cardValue('Work in progress')).toBe('1 issue');
    expect(cardRow('Work in progress', 'In Review')).toBe('1');

    expect(weekCounts()).toEqual(['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '1', '1']);
    expect(screen.getByRole('figure', { name: /Lead time distribution/ })).toHaveTextContent(
      'Median 3 days',
    );
  });

  it('Story and Task together (several types at once)', async () => {
    const { user } = await loadManual();
    await user.click(checkbox(/^Bug/));

    expect(cardValue('Throughput')).toBe('0.4 per week');
    expect(cardValue('Lead time')).toBe('12 days');
    expect(cardRow('Lead time', '85th percentile')).toBe('18.8 days');
    expect(cardValue('Cycle time')).toBe('5 days');
    expect(cardRow('Cycle time', '85th percentile')).toBe('10.2 days');
    expect(cardValue('Work in progress')).toBe('2 issues');
    expect(weekCounts()).toEqual(['1', '0', '0', '0', '2', '0', '0', '1', '0', '1', '0', '0']);
  });

  it('Clear shows "No data" everywhere and a hint; Select all brings the values back', async () => {
    const { user } = await loadManual();
    await user.click(within(filter()).getByRole('button', { name: 'Clear' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Select at least one issue type to see the metrics.',
    );
    for (const title of ['Throughput', 'Lead time', 'Cycle time', 'Work in progress']) {
      expect(cardValue(title)).toBe('No data');
    }
    expect(screen.getByRole('figure', { name: /Throughput per week/ })).toHaveTextContent(
      'No data',
    );
    expect(screen.getByRole('figure', { name: /Lead time distribution/ })).toHaveTextContent(
      'No data',
    );
    expect(within(filter()).getByRole('button', { name: 'Clear' })).toBeDisabled();

    await user.click(within(filter()).getByRole('button', { name: 'Select all' }));
    expect(cardValue('Throughput')).toBe('0.6 per week');
    expect(cardValue('Lead time')).toBe('6 days');
    expect(within(filter()).getByRole('button', { name: 'Select all' })).toBeDisabled();
  });

  it('does not change the skipped-rows list or the reporting window', async () => {
    const { user } = await loadManual();
    await user.click(checkbox(/^Bug/));
    expect(screen.getByText(/^6 rows skipped:/)).toBeInTheDocument();
    expect(screen.getByText(/31 Aug – 22 Nov 2026/)).toBeInTheDocument();
  });

  it('starts with all types again when a new file is loaded', async () => {
    const { user } = await loadManual();
    await user.click(checkbox(/^Bug/));
    await uploadCsv(user, manualCsv, 'again.csv');
    await screen.findByText('again.csv');
    expect(checkbox(/^Bug/)).toBeChecked();
  });

  it('says "moved back" if the computer clock is before the sample week', async () => {
    const { user } = renderApp(fromYmd(2026, 11, 10) as CalendarDate);
    await user.click(screen.getByRole('button', { name: 'Load sample data' }));
    expect(await screen.findByText(/Sample dates are moved back 2 weeks/)).toBeInTheDocument();
  });
});
