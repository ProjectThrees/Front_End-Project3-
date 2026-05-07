
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { getApiBaseUrl } from '@/services/api';
import { persistAuthSession } from '@/services/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RED = '#C0121A';
const RED_LIGHT = '#FCEBEB';
const RED_BORDER = '#F7C1C1';

const BASE_URL = getApiBaseUrl();

// Ensure WebBrowser sessions complete properly
WebBrowser.maybeCompleteAuthSession();

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
      <View style={styles.providerIconWrap}>
        <Text style={[styles.providerIconText, { color: '#4285F4' }]}>G</Text>
      </View>
  );
}

function GitHubIcon() {
  return (
      <View style={styles.providerIconWrap}>
        <Text style={[styles.providerIconText, { color: '#24292F' }]}>⌥</Text>
      </View>
  );
}

function OAuthButton({ label, icon, onPress, loading }) {
  return (
      <TouchableOpacity
          style={styles.oauthBtn}
          onPress={onPress}
          disabled={loading}
          activeOpacity={0.75}
      >
        {loading ? (
            <ActivityIndicator size="small" color={RED} style={{ marginRight: 12 }} />
        ) : (
            icon
        )}
        <Text style={styles.oauthBtnText}>
          {loading ? 'Connecting…' : label}
        </Text>
      </TouchableOpacity>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
      <View style={styles.errorBanner}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={styles.errorText}>{message}</Text>
      </View>
  );
}

function SuccessBanner({ visible }) {
  if (!visible) return null;
  return (
      <View style={styles.successBanner}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successText}>
          Signed in successfully — redirecting to marketplace…
        </Text>
      </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function LoginScreen() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Listen for the deep link redirect from the backend (myapp://oauth-success?token=...)
  useEffect(() => {
    // Handle deep link if the app was opened via the OAuth redirect
    const handleDeepLink = async (event) => {
      await processRedirectURL(event.url);
    };

    // Check if the app was opened from a deep link while closed
    Linking.getInitialURL().then((url) => {
      if (url) processRedirectURL(url);
    });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      processRedirectURL(window.location.href);
    }

    // Listen for deep links while the app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  async function processRedirectURL(url) {
    if (!url) return;

    const parsed = Linking.parse(url);
    const oauthMessage = parsed.queryParams?.message ?? parsed.queryParams?.error;
    const token = parsed.queryParams?.token;

    if (typeof oauthMessage === 'string' && oauthMessage.length > 0) {
      setError(typeof oauthMessage === 'string' && oauthMessage.length > 0
        ? `Sign in failed: ${oauthMessage}`
        : 'Sign in failed. Please try again.');
      setGoogleLoading(false);
      setGithubLoading(false);
      return;
    }
    if (!token && !url.includes('oauth-success')) return;

    try {
      if (!token) {
        setError('Authentication failed — no token received. Please try again.');
        return;
      }

      // Store token + role so we can route users by permission.
      const userRole = await persistAuthSession(token);

      setSuccess(true);
      setGoogleLoading(false);
      setGithubLoading(false);

      setTimeout(() => {
        router.replace(userRole === 'admin' ? '/admin' : '/(tabs)');
      }, 1200);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/login');
      }
    } catch (_e) {
      setError('Something went wrong during sign in. Please try again.');
      setGoogleLoading(false);
      setGithubLoading(false);
    }
  }

  async function handleOAuth(provider) {
    setError('');
    setSuccess(false);
    if (provider === 'google') setGoogleLoading(true);
    else setGithubLoading(true);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        document.cookie = 'oauth_mode=web; path=/; max-age=600; SameSite=Lax';
        window.location.assign(`${BASE_URL}/oauth2/authorization/${provider}`);
        return;
      }

      // Open the backend OAuth URL in an in-app browser
      // Spring Boot will handle the redirect to Google/GitHub and back
      const result = await WebBrowser.openAuthSessionAsync(
          `${BASE_URL}/oauth2/authorization/${provider}`,
          'myapp://oauth-success'
      );

      // If the user closed the browser without completing login
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setError('Sign in was cancelled. Please try again.');
        setGoogleLoading(false);
        setGithubLoading(false);
        return;
      }

      // If the browser returned a URL directly (iOS), process it
      if (result.type === 'success' && result.url) {
        await processRedirectURL(result.url);
      }
    } catch (_e) {
      setError('Could not connect to authentication server. Please try again.');
      setGoogleLoading(false);
      setGithubLoading(false);
    }
  }

  return (
      <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Stack.Screen options={{ headerShown: false }} />
        {/* Header band */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoMark}>
              <View style={styles.storeIcon}>
                <View style={styles.storeRoof} />
                <View style={styles.storeFront} />
              </View>
            </View>
            <View>
              <Text style={styles.logoText}>Student{'\n'}Marketplace</Text>
              <Text style={styles.logoSub}>Campus Commerce Platform</Text>
            </View>
          </View>
          <Text style={styles.headerTagline}>
            Buy, sell & trade with{'\n'}
            <Text style={styles.headerTaglineBold}>your campus community.</Text>
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Sign in</Text>
          <Text style={styles.welcomeSub}>Choose a provider to continue</Text>

          <OAuthButton
              label="Continue with Google"
              icon={<GoogleIcon />}
              onPress={() => handleOAuth('google')}
              loading={googleLoading}
          />
          <OAuthButton
              label="Continue with GitHub"
              icon={<GitHubIcon />}
              onPress={() => handleOAuth('github')}
              loading={githubLoading}
          />

          <ErrorBanner message={error} />
          <SuccessBanner visible={success} />

          <Text style={styles.footerNote}>
            By signing in you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    backgroundColor: RED,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoMark: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeIcon: { alignItems: 'center' },
  storeRoof: {
    width: 22,
    height: 8,
    backgroundColor: RED,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  storeFront: {
    width: 20,
    height: 12,
    backgroundColor: RED,
    marginTop: 1,
    borderRadius: 1,
  },
  logoText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    color: '#fff',
    lineHeight: 24,
    fontWeight: '600',
  },
  logoSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  headerTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
  },
  headerTaglineBold: {
    color: '#fff',
    fontWeight: '600',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#888',
    marginBottom: 28,
  },

  // OAuth buttons
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  oauthBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  providerIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerIconText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: RED_LIGHT,
    borderWidth: 0.5,
    borderColor: RED_BORDER,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  errorIcon: { fontSize: 14, color: '#A32D2D' },
  errorText: { flex: 1, fontSize: 13, color: '#A32D2D', lineHeight: 18 },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EAF3DE',
    borderWidth: 0.5,
    borderColor: '#C0DD97',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  successIcon: { fontSize: 14, color: '#3B6D11' },
  successText: { flex: 1, fontSize: 13, color: '#3B6D11', lineHeight: 18 },

  // Footer
  footerNote: {
    fontSize: 11,
    color: '#ABABAB',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});