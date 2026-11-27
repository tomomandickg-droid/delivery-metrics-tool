import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { REQUIRED_COLUMNS } from '../../src/domain/columns';
import { DataNotes } from '../../src/ui/DataNotes';
import { manualCsv, renderApp, uploadCsv } from './render';

describe('missing columns (acceptance criterion 2, task 18)', () => {
  it.each(REQUIRED_COLUMNS)(
    'names "%s" when it is missing from the uploaded file',
    async (column) => {
      const { user } = renderApp();
      const header = REQUIRED_COLUMNS.filter((c) => c !== column).join(',');
      await uploadCsv(user, `${header}\na,b,c,d,e\n`, 'broken.csv');
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('broken.csv can’t be used');
      expect(alert).toHaveTextContent(`Missing required column: "${column}"`);
    },
  );

  it('names every missing column at once', async () => {
    const { user } = renderApp();
    await uploadCsv(user, 'Issue key,Issue Type,Status,Created\nA,Story,Done,2026-11-01\n');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Missing required columns: "Resolved", "Started"',
    );
  });

  it('shows no metrics for a broken file', async () => {
    const { user } = renderApp();
    await uploadCsv(user, 'Issue key\nA\n');
    await screen.findByRole('alert');
    expect(screen.queryByRole('region', { name: 'Data notes' })).not.toBeInTheDocument();
    expect(screen.queryByText(/issues$/)).not.toBeInTheDocument();
  });

  it('reports an empty file', async () => {
    const { user } = renderApp();
    await uploadCsv(user, '', 'empty.csv');
    expect(await screen.findByRole('alert')).toHaveTextContent('The file is empty.');
  });

  it('reports a file that cannot be read', async () => {
    const { user } = renderApp(undefined, undefined);
    const file = new File(['x'], 'locked.csv');
    file.text = () => Promise.reject(new Error('locked'));
    await user.upload(screen.getByLabelText('CSV file'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent('The file could not be read.');
  });

  it('replaces the error when a good file is loaded next', async () => {
    const { user } = renderApp();
    await uploadCsv(user, 'Issue key\nA\n');
    await screen.findByRole('alert');
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    expect(await screen.findByText('manual-small.csv')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('skipped rows and adjusted issues (task 18)', () => {
  it('lists the 6 skipped rows of the manual fixture with keys and reasons', async () => {
    const { user } = renderApp();
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    const notes = await screen.findByRole('region', { name: 'Data notes' });
    expect(
      within(notes).getByText(/^6 rows skipped: MS-14, MS-15, MS-16, MS-1, MS-17, MS-18$/),
    ).toBeInTheDocument();
    expect(notes).toHaveTextContent('MS-14 (row 15): Created is empty or not a valid date');
    expect(notes).toHaveTextContent('MS-1 (row 18): Duplicate issue key; the first row was kept');
  });

  it('lists Started-before-Created issues as adjusted', async () => {
    const { user } = renderApp();
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    expect(
      await screen.findByText('Started before Created: 1 issue, cycle time adjusted (MS-7)'),
    ).toBeInTheDocument();
  });

  it('shows nothing when there is nothing to report', () => {
    const { container } = render(<DataNotes skipped={[]} startedBeforeCreated={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('uses the singular and keeps long lists collapsed', () => {
    const many = Array.from({ length: 11 }, (_, i) => ({
      rowNumber: i + 2,
      key: `K-${i}`,
      reason: 'invalid-created' as const,
    }));
    const { rerender } = render(<DataNotes skipped={[many[0]!]} startedBeforeCreated={[]} />);
    expect(screen.getByText(/^1 row skipped: K-0$/)).toBeInTheDocument();
    rerender(<DataNotes skipped={many} startedBeforeCreated={many} />);
    for (const details of document.querySelectorAll('details')) {
      expect(details).not.toHaveAttribute('open');
    }
  });
});
