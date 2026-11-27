import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { LeadTimeChart } from '../../src/ui/LeadTimeChart';
import { manualCsv, renderApp, uploadCsv } from './render';

/** Rows of the accessible data table behind a chart, as [label, value] pairs. */
function tableRows(caption: string): string[][] {
  const table = screen.getByRole('table', { name: caption });
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((c) => c.textContent ?? ''),
    );
}

describe('charts: manual fixture (task 20)', () => {
  it('throughput chart has 12 weeks with the hand-calculated counts', async () => {
    const { user } = renderApp();
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    await screen.findByText('manual-small.csv');
    expect(screen.getByRole('figure', { name: /Throughput per week/ })).toBeInTheDocument();
    expect(tableRows('Issues resolved per week')).toEqual([
      ['31 Aug', '1'],
      ['7 Sep', '0'],
      ['14 Sep', '0'],
      ['21 Sep', '0'],
      ['28 Sep', '2'],
      ['5 Oct', '0'],
      ['12 Oct', '0'],
      ['19 Oct', '1'],
      ['26 Oct', '0'],
      ['2 Nov', '1'],
      ['9 Nov', '1'],
      ['16 Nov', '1'],
    ]);
  });

  it('lead time chart has one bar per day and marks median and 85th percentile', async () => {
    const { user } = renderApp();
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    await screen.findByText('manual-small.csv');
    const figure = screen.getByRole('figure', { name: /Lead time distribution/ });
    expect(figure).toHaveTextContent('one bar per day');
    expect(figure).toHaveTextContent('Median 6 days');
    expect(figure).toHaveTextContent('85th percentile 18.2 days');
    const rows = tableRows('Issues by lead time');
    expect(rows).toHaveLength(20); // 1 … 20 days
    // Lead times 1, 5, 5, 6, 12, 18, 20
    expect(rows.filter(([, count]) => count !== '0')).toEqual([
      ['1', '1'],
      ['5', '2'],
      ['6', '1'],
      ['12', '1'],
      ['18', '1'],
      ['20', '1'],
    ]);
  });
});

describe('charts: grouping and empty states', () => {
  it('groups days when lead times are longer than 30 days', () => {
    render(
      <LeadTimeChart
        leadTime={{ n: 3, values: [2, 9, 45], median: 9, p85: 37.8 }}
        noData={false}
      />,
    );
    expect(screen.getByRole('figure')).toHaveTextContent('grouped by 2 days');
    expect(tableRows('Issues by lead time')[0]).toEqual(['1–2', '1']);
  });

  it('shows "No data" when nothing was resolved in the window', () => {
    render(
      <LeadTimeChart leadTime={{ n: 0, values: [], median: null, p85: null }} noData={false} />,
    );
    expect(screen.getByRole('figure')).toHaveTextContent('No data');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
