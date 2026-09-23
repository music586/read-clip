import { expect, it } from 'vitest';
import { groupByMonth } from '../../src/lib/archive';

it('groups by Shanghai publication month, newest first, including the year boundary', () => {
  const clips = [
    { id: 'old', data: { createdAt: '2025-12-31T15:59:59Z' } },
    { id: 'boundary', data: { createdAt: '2025-12-31T16:00:00Z' } },
    { id: 'new', data: { createdAt: '2026-01-20T00:00:00Z' } },
  ] as never;
  expect(groupByMonth(clips).map(({ key, clips }) => [key, clips.map(c => c.id)]))
    .toEqual([['2026-01', ['new', 'boundary']], ['2025-12', ['old']]]);
  expect(groupByMonth([])).toEqual([]);
});
