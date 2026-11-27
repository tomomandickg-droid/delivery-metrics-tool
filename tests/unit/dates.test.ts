import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayOfWeek,
  formatDate,
  formatIso,
  fromYmd,
  inclusiveDays,
  mondayOf,
  parseDate,
  todayLocal,
  toYmd,
} from '../../src/domain/dates';
import { d } from './helpers';

describe('fromYmd / toYmd', () => {
  it('stores 1970-01-01 as day 0', () => {
    expect(fromYmd(1970, 1, 1)).toBe(0);
  });

  it('round-trips a date', () => {
    expect(toYmd(fromYmd(2026, 11, 27)!)).toEqual({ year: 2026, month: 11, day: 27 });
  });

  it.each([
    [2026, 2, 29, 'not a leap year'],
    [2026, 2, 31, 'February has no 31st'],
    [2026, 4, 31, 'April has 30 days'],
    [2026, 13, 1, 'month 13'],
    [2026, 0, 10, 'month 0'],
    [2026, 11, 0, 'day 0'],
  ])('rejects %i-%i-%i (%s)', (y, m, day) => {
    expect(fromYmd(y, m, day)).toBeNull();
  });

  it('accepts 29 Feb in a leap year', () => {
    expect(fromYmd(2028, 2, 29)).not.toBeNull();
  });
});

describe('parseDate: Jira default export format', () => {
  it.each([
    ['27/Nov/26 10:15 AM', '2026-11-27'],
    ['01/Nov/26 9:15 PM', '2026-11-01'],
    ['1/nov/26 12:00 am', '2026-11-01'],
    ['31/DEC/26 11:59 PM', '2026-12-31'],
    ['27/Nov/26', '2026-11-27'],
    ['27/Nov/26 10:15AM', '2026-11-27'],
  ])('%s → %s', (raw, expected) => {
    expect(formatIso(parseDate(raw)!)).toBe(expected);
  });

  it.each([
    ['30/Feb/26 10:00 AM', 'date does not exist'],
    ['27/Foo/26 10:00 AM', 'unknown month'],
    ['27/Nov/26 13:15 PM', 'hour 13 on a 12-hour clock'],
    ['27/Nov/26 0:15 AM', 'hour 0 on a 12-hour clock'],
    ['27/Nov/26 10:60 AM', 'minute 60'],
    ['27/Nov/26 10:15', 'time without AM/PM'],
    ['27/Nov/2026 10:15 AM', 'four-digit year'],
  ])('rejects %s (%s)', (raw) => {
    expect(parseDate(raw)).toBeNull();
  });
});

describe('parseDate: ISO', () => {
  it.each([
    ['2026-11-27', '2026-11-27'],
    ['2026-11-27T10:15', '2026-11-27'],
    ['2026-11-27 10:15:30', '2026-11-27'],
    ['2026-11-27T10:15:30.123Z', '2026-11-27'],
    // The date part is taken as written: no conversion to the viewer's time zone.
    ['2026-11-27T23:30:00+05:00', '2026-11-27'],
    ['2026-11-27T00:30:00-0800', '2026-11-27'],
    ['2028-02-29', '2028-02-29'],
  ])('%s → %s', (raw, expected) => {
    expect(formatIso(parseDate(raw)!)).toBe(expected);
  });

  it.each([
    ['2026-13-01', 'month 13'],
    ['2026-02-29', 'not a leap year'],
    ['2026-11-27T24:00', 'hour 24'],
    ['2026-11-27T10:61', 'minute 61'],
    ['2026-11-27T10:15:60', 'second 60'],
    ['2026-1-27', 'single-digit month'],
  ])('rejects %s (%s)', (raw) => {
    expect(parseDate(raw)).toBeNull();
  });
});

describe('parseDate: day.month.year', () => {
  it.each([
    ['27.11.2026', '2026-11-27'],
    ['27.11.2026.', '2026-11-27'],
    ['1.2.2026', '2026-02-01'],
    ['27.11.2026. 10:15', '2026-11-27'],
    ['27.11.2026 23:59:59', '2026-11-27'],
  ])('%s → %s', (raw, expected) => {
    expect(formatIso(parseDate(raw)!)).toBe(expected);
  });

  it.each([
    ['31.02.2026', 'date does not exist'],
    ['27.13.2026', 'month 13'],
    ['27.11.2026 25:00', 'hour 25'],
    ['27.11.2026 10:15:61', 'second 61'],
    ['27.11.26', 'two-digit year'],
  ])('rejects %s (%s)', (raw) => {
    expect(parseDate(raw)).toBeNull();
  });
});

describe('parseDate: other input', () => {
  it('ignores surrounding spaces', () => {
    expect(formatIso(parseDate('  2026-11-27  ')!)).toBe('2026-11-27');
  });

  it.each(['', '   ', 'soon', '2026/11/27', '27-11-2026', 'Nov 27, 2026', '11/27/2026'])(
    'rejects %j',
    (raw) => {
      expect(parseDate(raw)).toBeNull();
    },
  );
});

describe('inclusiveDays (plan.md §4.1)', () => {
  it('same day = 1 day', () => {
    expect(inclusiveDays(d('2026-11-01'), d('2026-11-01'))).toBe(1);
  });

  it('1 Nov → 6 Nov = 6 days', () => {
    expect(inclusiveDays(d('2026-11-01'), d('2026-11-06'))).toBe(6);
  });

  it('31 Oct 23:59 → 1 Nov 00:01 = 2 days (time of day ignored)', () => {
    const start = parseDate('2026-10-31T23:59')!;
    const end = parseDate('2026-11-01T00:01')!;
    expect(inclusiveDays(start, end)).toBe(2);
  });

  it('28 Feb 2028 → 1 Mar 2028 = 3 days (leap year)', () => {
    expect(inclusiveDays(d('2028-02-28'), d('2028-03-01'))).toBe(3);
  });

  it('24 Oct → 26 Oct 2026 across the end of daylight saving = 3 days', () => {
    expect(inclusiveDays(d('2026-10-24'), d('2026-10-26'))).toBe(3);
  });

  it('31 Dec 2026 → 1 Jan 2027 = 2 days (year boundary)', () => {
    expect(inclusiveDays(d('2026-12-31'), d('2027-01-01'))).toBe(2);
  });

  it('gives the same result for all three formats of the same dates', () => {
    const start = [parseDate('01/Nov/26 9:00 AM')!, parseDate('2026-11-01')!, parseDate('1.11.2026.')!];
    const end = [parseDate('06/Nov/26 5:00 PM')!, parseDate('2026-11-06')!, parseDate('6.11.2026.')!];
    for (let i = 0; i < 3; i++) {
      expect(inclusiveDays(start[i]!, end[i]!)).toBe(6);
    }
  });
});

describe('week helpers', () => {
  it.each([
    ['1970-01-01', 4],
    ['2026-11-23', 1],
    ['2026-11-27', 5],
    ['2026-11-29', 7],
    ['1969-12-29', 1],
  ])('dayOfWeek(%s) = %i', (iso, expected) => {
    expect(dayOfWeek(d(iso))).toBe(expected);
  });

  it.each([
    ['2026-11-23', '2026-11-23'],
    ['2026-11-27', '2026-11-23'],
    ['2026-11-29', '2026-11-23'],
    ['2026-11-30', '2026-11-30'],
  ])('mondayOf(%s) = %s', (iso, expected) => {
    expect(formatIso(mondayOf(d(iso)))).toBe(expected);
  });

  it('addDays moves across a month end', () => {
    expect(formatIso(addDays(d('2026-11-27'), 5))).toBe('2026-12-02');
  });
});

describe('formatting and today', () => {
  it('formatDate', () => {
    expect(formatDate(d('2026-11-27'))).toBe('27 Nov 2026');
    expect(formatDate(d('2026-01-05'))).toBe('5 Jan 2026');
  });

  it('formatIso pads month and day', () => {
    expect(formatIso(d('2026-01-05'))).toBe('2026-01-05');
  });

  it('todayLocal uses the local calendar date, even late in the evening', () => {
    expect(formatIso(todayLocal(new Date(2026, 10, 27, 23, 59)))).toBe('2026-11-27');
    expect(formatIso(todayLocal(new Date(2026, 10, 27, 0, 1)))).toBe('2026-11-27');
  });
});
