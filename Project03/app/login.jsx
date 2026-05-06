import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import styles, { RED } from './LoginScreen.styles';

// ---------------------------------------------------------------------------
// OAuth endpoints — replace with your real backend URLs
// ---------------------------------------------------------------------------
const OAUTH_ENDPOINTS = {
  google: 'https://your-api.example.com/auth/google',
  github: 'https://your-api.example.com/auth/github',
};

// Simulated email login — replace with your real fetch call
async function loginWithEmail(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (password.length >= 6) {
        resolve({ token: 'mock-jwt-token', user: { email } });
      } else {
        reject(new Error('Invalid email or password. Please try again.'));
      }
    }, 1400);
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LogoMark() {
  return (
    <View style={styles.logoMark}>
      <View style={styles.storeIcon}>
        <View style={styles.storeRoof} />
        <View style={styles.storeFront} />
      </View>
    </View>
  );
}

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

function Divider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or sign in with email</Text>
      <View style={styles.dividerLine} />
    </View>
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
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passRef = useRef(null);

  async function handleOAuth(provider) {
    setError('');
    if (provider === 'google') setGoogleLoading(true);
    else setGithubLoading(true);

    try {
      // In a real app: use expo-auth-session or react-native-app-auth
      await Linking.openURL(OAUTH_ENDPOINTS[provider]);
      setSuccess(true);
      setTimeout(() => {
        // navigation.replace('Marketplace');
      }, 1200);
    } catch (e) {
      setError('Could not open authentication page. Please try again.');
    } finally {
      setGoogleLoading(false);
      setGithubLoading(false);
    }
  }

  async function handleEmailLogin() {
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your university email address.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setEmailLoading(true);
    try {
      const { token } = await loginWithEmail(email, password);
      // Uncomment to persist: await AsyncStorage.setItem('authToken', token);
      setSuccess(true);
      setTimeout(() => {
        // navigation.replace('Marketplace');
      }, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header band */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LogoMark />
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
          <Text style={styles.welcomeSub}>Access your Student Marketplace account</Text>

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

          <Divider />

          <Text style={styles.label}>University email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@university.edu"
            placeholderTextColor="#ABABAB"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <View style={styles.passWrap}>
            <TextInput
              ref={passRef}
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#ABABAB"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleEmailLogin}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <ErrorBanner message={error} />
          <SuccessBanner visible={success} />

          <TouchableOpacity
            style={[styles.loginBtn, emailLoading && styles.loginBtnDisabled]}
            onPress={handleEmailLogin}
            disabled={emailLoading}
            activeOpacity={0.85}
          >
            {emailLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.signupLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
