import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AUTH_TOKEN_KEY,
  USER_ROLE_KEY,
  clearAuthSession,
  getRoleFromToken,
  getStoredUserRole,
  persistAuthSession,
  updateStoredRole,
} from '../auth';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

function base64UrlEncodeJson(payload: object): string {
  const json = JSON.stringify(payload);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncodeJson({ alg: 'none', typ: 'JWT' });
  const body = base64UrlEncodeJson(payload);
  return `${header}.${body}.signature`;
}

describe('getRoleFromToken', () => {
  it('returns user when token is malformed', () => {
    expect(getRoleFromToken('not-a-jwt')).toBe('user');
  });

  it('returns user when payload has no admin hints', () => {
    const token = makeJwt({ sub: '123', role: 'ROLE_USER' });
    expect(getRoleFromToken(token)).toBe('user');
  });

  it('detects admin from role string', () => {
    const token = makeJwt({ role: 'ROLE_ADMIN' });
    expect(getRoleFromToken(token)).toBe('admin');
  });

  it('detects admin from roles array', () => {
    const token = makeJwt({ roles: ['ROLE_USER', 'ROLE_ADMIN'] });
    expect(getRoleFromToken(token)).toBe('admin');
  });

  it('detects admin from authorities string', () => {
    const token = makeJwt({ authorities: 'ADMIN' });
    expect(getRoleFromToken(token)).toBe('admin');
  });
});

describe('auth session helpers', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persistAuthSession stores token and derived role', async () => {
    const token = makeJwt({ role: 'ROLE_ADMIN' });
    const role = await persistAuthSession(token);

    expect(role).toBe('admin');
    expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBe(token);
    expect(await AsyncStorage.getItem(USER_ROLE_KEY)).toBe('admin');
  });

  it('getStoredUserRole returns admin only when key is admin', async () => {
    await AsyncStorage.setItem(USER_ROLE_KEY, 'admin');
    await expect(getStoredUserRole()).resolves.toBe('admin');
  });

  it('getStoredUserRole defaults to user for missing or other values', async () => {
    await expect(getStoredUserRole()).resolves.toBe('user');
    await AsyncStorage.setItem(USER_ROLE_KEY, 'guest');
    await expect(getStoredUserRole()).resolves.toBe('user');
  });

  it('updateStoredRole maps backend role string', async () => {
    await expect(updateStoredRole('ADMIN')).resolves.toBe('admin');
    expect(await AsyncStorage.getItem(USER_ROLE_KEY)).toBe('admin');

    await expect(updateStoredRole('user')).resolves.toBe('user');
    expect(await AsyncStorage.getItem(USER_ROLE_KEY)).toBe('user');
  });

  it('clearAuthSession removes token and role', async () => {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, 't'],
      [USER_ROLE_KEY, 'admin'],
    ]);
    await clearAuthSession();
    expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(USER_ROLE_KEY)).toBeNull();
  });
});
