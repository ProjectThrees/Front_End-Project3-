import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = 'authToken';
export const USER_ROLE_KEY = 'userRole';

export type AppUserRole = 'admin' | 'user';

type DecodedJwtPayload = {
  role?: string;
  roles?: string[] | string;
  authorities?: string[] | string;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const payloadJson = decodeBase64Url(parts[1]);
    return JSON.parse(payloadJson) as DecodedJwtPayload;
  } catch {
    return null;
  }
}

function valueIncludesAdmin(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => valueIncludesAdmin(item));
  }

  if (typeof value !== 'string') {
    return false;
  }

  return value.toLowerCase().includes('admin');
}

export function getRoleFromToken(token: string): AppUserRole {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return 'user';
  }

  if (
    valueIncludesAdmin(payload.role) ||
    valueIncludesAdmin(payload.roles) ||
    valueIncludesAdmin(payload.authorities)
  ) {
    return 'admin';
  }

  return 'user';
}

export async function persistAuthSession(token: string): Promise<AppUserRole> {
  const role = getRoleFromToken(token);
  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, token],
    [USER_ROLE_KEY, role],
  ]);
  return role;
}

export async function getStoredUserRole(): Promise<AppUserRole> {
  const value = await AsyncStorage.getItem(USER_ROLE_KEY);
  return value === 'admin' ? 'admin' : 'user';
}

export async function updateStoredRole(backendRole: string): Promise<AppUserRole> {
  const role: AppUserRole = backendRole.toLowerCase().includes('admin') ? 'admin' : 'user';
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
  return role;
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_ROLE_KEY]);
}
