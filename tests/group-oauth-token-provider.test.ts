import { resolveOAuthGroupKey } from '../src/infrastructure/auth/group-oauth-token-provider';

describe('resolveOAuthGroupKey', () => {
  test('matches exact group prefix from project path', () => {
    const key = resolveOAuthGroupKey('konoha7/my-repo', ['konoha7', 'othergroup']);
    expect(key).toBe('konoha7');
  });

  test('prefers longest matching namespace', () => {
    const key = resolveOAuthGroupKey('konoha7/subgroup/repo', ['konoha7', 'konoha7/subgroup']);
    expect(key).toBe('konoha7/subgroup');
  });

  test('returns undefined when no groups matched', () => {
    const key = resolveOAuthGroupKey('unknown/repo', ['konoha7']);
    expect(key).toBeUndefined();
  });
});
