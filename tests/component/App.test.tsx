import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { manualCsv, renderApp, uploadCsv } from './render';

describe('App: upload (task 17)', () => {
  it('shows the heading and the upload area before any file is loaded', () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: 'Delivery Metrics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose CSV file' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Load sample data' })).toBeEnabled();
  });

  it('loads an uploaded CSV file', async () => {
    const { user } = renderApp();
    await uploadCsv(user, manualCsv, 'manual-small.csv');
    expect(await screen.findByText('manual-small.csv')).toBeInTheDocument();
    expect(screen.getByText(/13 issues/)).toBeInTheDocument();
  });

  it('loads the sample with "Load sample data"', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Load sample data' }));
    expect(await screen.findByText('jira-sample.csv')).toBeInTheDocument();
    expect(screen.getByText(/300 issues/)).toBeInTheDocument();
  });
});
