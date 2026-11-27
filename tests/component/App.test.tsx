import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../src/ui/App';

// Placeholder until the real UI lands in Phase 4.
describe('App', () => {
  it('renders the page heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Delivery Metrics' })).toBeInTheDocument();
  });
});
