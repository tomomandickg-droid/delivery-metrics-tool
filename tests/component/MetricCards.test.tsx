import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { fromYmd } from '../../src/domain/dates';
import type { CalendarDate } from '../../src/domain/types';
import { card, cardRow, cardValue } from './cards';
import { manualCsv, renderApp, uploadCsv } from './render';

const at = (y: number, m: number, d: number) => fromYmd(y, m, d) as CalendarDate;

describe('metric cards: manual fixture (acceptance criterion 3, task 19)', () => {
  // Expected values: tests/fixtures/manual-small.expected.md §5, today = 27 Nov 2026.
  it('shows the hand-calculated values', async () => {
    const { user } = renderApp();
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    await screen.findByText('manual-small.csv');

    expect(cardValue('Throughput')).toBe('0.6 per week');
    expect(cardRow('Throughput', 'Resolved')).toBe('7 issues');

    expect(cardValue('Lead time')).toBe('6 days');
    expect(cardRow('Lead time', '85th percentile')).toBe('18.2 days');
    expect(cardRow('Lead time', 'Issues')).toBe('7');

    expect(cardValue('Cycle time')).toBe('5 days');
    expect(cardRow('Cycle time', '85th percentile')).toBe('9.8 days');
    expect(cardRow('Cycle time', 'Issues')).toBe('6');
    expect(card('Cycle time')).toHaveTextContent(
      '1 issue resolved without a Started date is not included.',
    );

    expect(cardValue('Work in progress')).toBe('3 issues');
    expect(cardRow('Work in progress', 'In Progress')).toBe('2');
    expect(cardRow('Work in progress', 'In Review')).toBe('1');
  });

  it('shows the reporting window', async () => {
    const { user } = renderApp();
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    expect(await screen.findByText(/12 weeks, 31 Aug – 22 Nov 2026/)).toBeInTheDocument();
  });
});

describe('metric cards: sample data', () => {
  const expectSampleValues = () => {
    expect(cardValue('Throughput')).toBe('12.6 per week');
    expect(cardRow('Throughput', 'Resolved')).toBe('151 issues');
    expect(cardValue('Lead time')).toBe('8 days');
    expect(cardRow('Lead time', '85th percentile')).toBe('16.5 days');
    expect(cardValue('Cycle time')).toBe('5 days');
    expect(cardRow('Cycle time', '85th percentile')).toBe('10 days');
    expect(card('Cycle time')).toHaveTextContent(
      '4 issues resolved without a Started date are not included.',
    );
    expect(cardValue('Work in progress')).toBe('7 issues');
  };

  it('shows the four metrics on the export date', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Load sample data' }));
    await screen.findByText('jira-sample.csv');
    expectSampleValues();
    expect(screen.queryByText(/Sample dates are moved forward/)).not.toBeInTheDocument();
  });

  it('shows the same metrics months later, thanks to the week shift', async () => {
    const { user } = renderApp(at(2027, 3, 3));
    await user.click(screen.getByRole('button', { name: 'Load sample data' }));
    await screen.findByText('jira-sample.csv');
    expectSampleValues();
    expect(screen.getByText(/Sample dates are moved forward 14 weeks/)).toBeInTheDocument();
  });

  it('lists the 5 skipped sample rows and the 3 adjusted issues', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Load sample data' }));
    expect(await screen.findByText(/^5 rows skipped:/)).toBeInTheDocument();
    expect(
      screen.getByText(/^Started before Created: 3 issues, cycle time adjusted/),
    ).toBeInTheDocument();
  });
});

describe('metric cards: empty states', () => {
  it('explains an empty window for an old export (plan.md §5)', async () => {
    const { user } = renderApp(at(2027, 6, 1));
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    expect(await screen.findByRole('status')).toHaveTextContent(
      'No issues resolved between 8 Mar 2027 and 30 May 2027. The latest Resolved date in this file is 24 Nov 2026.',
    );
    expect(cardValue('Throughput')).toBe('0 per week');
    expect(cardValue('Lead time')).toBe('No data');
    expect(cardValue('Cycle time')).toBe('No data');
    // WIP is not limited to the window.
    expect(cardValue('Work in progress')).toBe('3 issues');
  });

  it('says so when no issue has a Resolved date', async () => {
    const { user } = renderApp();
    await uploadCsv(
      user,
      'Issue key,Issue Type,Status,Created,Resolved,Started\nA-1,Story,In Progress,2026-11-02,,2026-11-03\n',
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'No issue in this file has a Resolved date.',
    );
    expect(cardValue('Work in progress')).toBe('1 issue');
  });

  it('shows the empty start page before a file is loaded', () => {
    renderApp();
    expect(
      screen.getByText(/Upload a Jira CSV export, or load the sample data/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Throughput' })).not.toBeInTheDocument();
  });

  it('uses the singular for a 1-day median', async () => {
    const { user } = renderApp();
    await uploadCsv(
      user,
      'Issue key,Issue Type,Status,Created,Resolved,Started\nA-1,Story,Done,2026-11-02,2026-11-02,2026-11-02\n',
    );
    await screen.findByText('export.csv');
    expect(cardValue('Lead time')).toBe('1 day');
    expect(cardRow('Lead time', '85th percentile')).toBe('1 day');
  });
});
