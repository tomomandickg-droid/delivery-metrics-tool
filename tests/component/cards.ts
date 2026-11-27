import { screen, within } from '@testing-library/react';

/** The card section with the given heading. */
export function card(title: string): HTMLElement {
  return screen.getByRole('region', { name: title });
}

/** The big number of a card, e.g. "12.6per week" → "12.6 per week". */
export function cardValue(title: string): string {
  const value = card(title).querySelector('.value');
  if (!value) throw new Error(`No value in card ${title}`);
  const unit = value.querySelector('.unit')?.textContent ?? '';
  const number = (value.textContent ?? '').slice(0, (value.textContent ?? '').length - unit.length);
  return unit === '' ? number : `${number} ${unit}`;
}

/** The value next to a label in a card's detail list. */
export function cardRow(title: string, label: string): string {
  const dt = within(card(title)).getByText(label, { selector: 'dt' });
  return dt.nextElementSibling?.textContent ?? '';
}
