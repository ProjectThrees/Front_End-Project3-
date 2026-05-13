jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/** api.ts only needs `Platform.OS`; avoid `requireActual('react-native')` (pulls native DevMenu, etc.). */
function mockPlatform(os: 'ios' | 'android') {
  jest.doMock('react-native', () => ({
    Platform: { OS: os },
  }));
}

describe('getApiBaseUrl', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
    }
  });

  it('uses EXPO_PUBLIC_API_BASE_URL and strips trailing slash', () => {
    jest.isolateModules(() => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com/';
      jest.doMock('expo-constants', () => ({
        __esModule: true,
        default: { expoConfig: undefined },
      }));

      const { getApiBaseUrl } = require('../api') as typeof import('../api');
      expect(getApiBaseUrl()).toBe('https://api.example.com');
    });
  });

  it('uses Expo dev host when env is unset', () => {
    jest.isolateModules(() => {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      jest.doMock('expo-constants', () => ({
        __esModule: true,
        default: { expoConfig: { hostUri: '192.168.1.10:8081' } },
      }));

      const { getApiBaseUrl } = require('../api') as typeof import('../api');
      expect(getApiBaseUrl()).toBe('http://192.168.1.10:8080');
    });
  });

  it('uses Android emulator loopback when no env or Expo host', () => {
    jest.isolateModules(() => {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      jest.doMock('expo-constants', () => ({
        __esModule: true,
        default: { expoConfig: undefined },
      }));
      mockPlatform('android');

      const { getApiBaseUrl } = require('../api') as typeof import('../api');
      expect(getApiBaseUrl()).toBe('http://10.0.2.2:8080');
    });
  });

  it('falls back to localhost when no env, host, or Android', () => {
    jest.isolateModules(() => {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      jest.doMock('expo-constants', () => ({
        __esModule: true,
        default: { expoConfig: undefined },
      }));
      mockPlatform('ios');

      const { getApiBaseUrl } = require('../api') as typeof import('../api');
      expect(getApiBaseUrl()).toBe('http://localhost:8080');
    });
  });
});

describe('fetchListings', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    mockPlatform('ios');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed JSON on success', async () => {
    const payload = [{ listingId: 'a', userId: 'u', title: 'T', description: '', price: 1, category: 'c', condition: 'new', imageUrl: null, isSold: false, createdAt: 'now' }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const { fetchListings } = require('../api') as typeof import('../api');
    await expect(fetchListings()).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/listings'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('throws with status and body on non-OK response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      text: async () => 'upstream error',
    });

    const { fetchListings } = require('../api') as typeof import('../api');
    await expect(fetchListings()).rejects.toThrow('Request failed (502): upstream error');
  });
});
