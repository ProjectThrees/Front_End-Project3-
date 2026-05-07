import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { clearAuthSession, getStoredUserRole } from '@/services/auth';

const RED = '#C0121A';
const SIDEBAR_WIDTH = 280;

function MenuButton({ icon, label, onPress, tone = 'default' }) {
  return (
    <TouchableOpacity
      style={[styles.menuButton, tone === 'admin' && styles.menuButtonAdmin]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={styles.menuButtonIcon}>{icon}</Text>
      <Text style={[styles.menuButtonText, tone === 'admin' && styles.menuButtonTextAdmin]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SidebarItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.sidebarItem} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.sidebarIcon}>{icon}</Text>
      <Text style={styles.sidebarLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAccess() {
      const role = await getStoredUserRole();
      if (!isMounted) return;

      if (role !== 'admin') {
        router.replace('/(tabs)');
        return;
      }

      setAccessReady(true);
    }

    verifyAdminAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  function openSidebar() {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(sidebarAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closeSidebar() {
    Animated.parallel([
      Animated.spring(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setSidebarOpen(false));
  }

  async function handleSignOut() {
    await clearAuthSession();
    closeSidebar();
    router.replace('/login');
  }

  if (!accessReady) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} onPress={openSidebar}>
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Landing Page</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Marketplace Actions</Text>
        <MenuButton icon="🧾" label="View Listings" onPress={() => router.replace('/(tabs)')} />
        <MenuButton icon="➕" label="Create Listing" onPress={() => router.push('/create-listing')} />
        <MenuButton icon="❤️" label="Favorites" onPress={() => router.push('/favorites')} />
        <MenuButton icon="👤" label="User Details" onPress={() => router.push('/profile')} />

        <Text style={[styles.sectionTitle, styles.adminSectionTitle]}>Admin Moderation</Text>
        <MenuButton icon="🚩" label="View Reports" tone="admin" onPress={() => router.push('/admin/reports')} />
        <MenuButton icon="🛡️" label="Manage Users" tone="admin" onPress={() => router.push('/admin/manage-users')} />
      </View>

      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSidebar} />
        </Animated.View>
      )}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
        <SafeAreaView>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Admin Menu</Text>
            <TouchableOpacity onPress={closeSidebar}>
              <Text style={styles.sidebarClose}>✕</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <SidebarItem icon="🧾" label="View Listings" onPress={() => { closeSidebar(); router.replace('/(tabs)'); }} />
        <SidebarItem icon="➕" label="Create Listing" onPress={() => { closeSidebar(); router.push('/create-listing'); }} />
        <SidebarItem icon="❤️" label="Favorites" onPress={() => { closeSidebar(); router.push('/favorites'); }} />
        <SidebarItem icon="👤" label="User Details" onPress={() => { closeSidebar(); router.push('/profile'); }} />
        <SidebarItem icon="🚩" label="View Reports" onPress={() => { closeSidebar(); router.push('/admin/reports'); }} />
        <SidebarItem icon="🛡️" label="Manage Users" onPress={() => { closeSidebar(); router.push('/admin/manage-users'); }} />

        <View style={styles.sidebarDivider} />
        <SidebarItem icon="🚪" label="Sign Out" onPress={handleSignOut} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4F0' },
  headerSafe: { backgroundColor: RED },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: { width: 28 },
  menuBtn: { padding: 4 },
  hamburger: { width: 22, gap: 5 },
  hamburgerLine: { height: 2, backgroundColor: '#fff', borderRadius: 2 },
  body: { padding: 16, gap: 10 },
  sectionTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  adminSectionTitle: { marginTop: 16 },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuButtonAdmin: {
    borderColor: '#F7C1C1',
    backgroundColor: '#FCEBEB',
  },
  menuButtonIcon: { fontSize: 18 },
  menuButtonText: { fontSize: 14, fontWeight: '600', color: '#222' },
  menuButtonTextAdmin: { color: '#A32D2D' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    zIndex: 20,
    paddingTop: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sidebarTitle: { fontSize: 17, fontWeight: '700', color: RED },
  sidebarClose: { fontSize: 18, color: '#777' },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sidebarIcon: { width: 24, textAlign: 'center', fontSize: 17 },
  sidebarLabel: { fontSize: 14, fontWeight: '600', color: '#222' },
  sidebarDivider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#EBEBEB',
  },
});
