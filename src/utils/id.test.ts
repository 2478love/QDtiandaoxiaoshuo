import { describe, expect, it } from 'vitest';
import {
  createId,
  createPrefixedId,
  createIds,
  createInviteCode,
  getIdPrefix,
  isValidId,
} from './id';

describe('utils/id', () => {
  it('createId should return non-empty unique ids', () => {
    const id1 = createId();
    const id2 = createId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toEqual(id2);
  });

  it('createPrefixedId should include prefix and be valid', () => {
    const id = createPrefixedId('novel');
    expect(id.startsWith('novel_')).toBe(true);
    expect(isValidId(id)).toBe(true);
    expect(getIdPrefix(id)).toBe('novel');
  });

  it('createIds should create expected amount with prefix', () => {
    const ids = createIds(3, 'chapter');
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    ids.forEach((id) => {
      expect(id.startsWith('chapter_')).toBe(true);
      expect(isValidId(id)).toBe(true);
    });
  });

  it('createInviteCode should follow TD + 6 uppercase alnum format', () => {
    const code = createInviteCode();
    expect(code).toMatch(/^TD[A-Z0-9]{6}$/);
  });
});
