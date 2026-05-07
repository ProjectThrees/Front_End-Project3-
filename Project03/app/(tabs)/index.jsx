import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { fetchListings, getCurrentUser } from '@/services/api';
import { clearAuthSession, getStoredUserRole } from '@/services/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RED = '#C0121A';
const SIDEBAR_WIDTH = 280;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const CATEGORIES = ['All', 'Textbooks', 'Electronics', 'Furniture', 'Clothing', 'Dorm', 'Other'];

const CATEGORY_ICONS = {
  All: '🛒',
  Textbooks: '📚',
  Electronics: '💻',
  Furniture: '🪑',
  Clothing: '👕',
  Dorm: '🛏',
  Other: '📦',
};

const CATEGORY_COLORS = {
  Textbooks: { bg: '#EAF3DE', text: '#3B6D11' },
  Electronics: { bg: '#E6F1FB', text: '#185FA5' },
  Furniture: { bg: '#FAEEDA', text: '#854F0B' },
  Clothing: { bg: '#FBEAF0', text: '#993556' },
  Dorm: { bg: '#E1F5EE', text: '#0F6E56' },
  Other: { bg: '#F1EFE8', text: '#5F5E5A' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ListingCard({ item, index }) {
  const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;

  return (
      <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } })}
      >
        <View style={[styles.cardImage, { backgroundColor: '#F5F4F0' }]}>
          <Text style={styles.cardImageIcon}>{CATEGORY_ICONS[item.category] || '📦'}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardPrice}>${item.price}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: catStyle.text }]}>{item.category}</Text>
            </View>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
          <Text style={styles.cardLocation}>📍 {item.location}</Text>
        </View>
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

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function MarketplaceScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const backendListings = await fetchListings();
        if (!isMounted) return;

        const mappedListings = backendListings.map((listing) => ({
          id: listing.listingId,
          title: listing.title,
          price: listing.price,
          category: listing.category,
          condition: listing.condition,
          location: 'On Campus',
        }));

        setListings(mappedListings);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Failed to load listings';
        setLoadError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser();
        if (!isMounted) return;
        setCurrentUser(user);
        setIsAdmin(user.role?.toLowerCase().includes('admin') ?? false);
      } catch {
        // Backend unreachable — fall back to stored role
        const role = await getStoredUserRole();
        if (isMounted) setIsAdmin(role === 'admin');
      }
    }

    loadCurrentUser();

    return () => { isMounted = false; };
  }, []);

  async function handleSignOut() {
    await clearAuthSession();
    closeSidebar();
    router.replace('/login');
  }

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

  const filteredListings = listings.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={RED} />

        {/* ── Header ── */}
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.menuBtn} onPress={openSidebar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={styles.hamburger}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </View>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Student Marketplace</Text>

            <TouchableOpacity style={styles.headerAvatarBtn}>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>{currentUser?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                  style={styles.searchInput}
                  placeholder="Search listings…"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </SafeAreaView>

        {/* ── Category pills ── */}
        <View style={styles.categoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map(cat => (
                <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.8}
                >
                  <Text style={styles.categoryPillIcon}>{CATEGORY_ICONS[cat]}</Text>
                  <Text style={[styles.categoryPillText, selectedCategory === cat && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Listings grid ── */}
        <FlatList
            data={filteredListings}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={filteredListings.length > 0 ? styles.gridRow : null}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {isLoading ? (
                  <>
                    <Text style={styles.emptyIcon}>⏳</Text>
                    <Text style={styles.emptyTitle}>Loading listings...</Text>
                    <Text style={styles.emptyText}>Fetching marketplace data from the backend</Text>
                  </>
                ) : loadError ? (
                  <>
                    <Text style={styles.emptyIcon}>⚠️</Text>
                    <Text style={styles.emptyTitle}>Could not load listings</Text>
                    <Text style={styles.emptyText}>{loadError}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyIcon}>🛒</Text>
                    <Text style={styles.emptyTitle}>No listings yet</Text>
                    <Text style={styles.emptyText}>Be the first to post something on campus</Text>
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => { closeSidebar(); router.push('/create-listing'); }}
                    >
                      <Text style={styles.emptyBtnText}>Create a listing</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            }
            renderItem={({ item, index }) => <ListingCard item={item} index={index} />}
        />

        {/* ── Sidebar overlay ── */}
        {sidebarOpen && (
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents="auto">
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSidebar} activeOpacity={1} />
            </Animated.View>
        )}

        {/* ── Sidebar ── */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
          <SafeAreaView>
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarLogoRow}>
                <View style={styles.sidebarLogoMark}>
                  <Text style={styles.sidebarLogoIcon}>🛒</Text>
                </View>
                <Text style={styles.sidebarLogoText}>Student{'\n'}Marketplace</Text>
              </View>
              <TouchableOpacity onPress={closeSidebar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.sidebarClose}>✕</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.sidebarUserRow}>
            <View style={styles.sidebarAvatar}>
              <Text style={styles.sidebarAvatarText}>{currentUser?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
            </View>
            <View>
              <Text style={styles.sidebarUserName}>{currentUser?.name ?? (isAdmin ? 'Campus Admin' : 'Campus User')}</Text>
              <Text style={styles.sidebarUserEmail}>{currentUser?.email ?? ''}</Text>
            </View>
          </View>

          <View style={styles.sidebarDivider} />

          <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
            <SidebarItem icon="➕" label="Create Listing"   onPress={() => { closeSidebar(); router.push('/create-listing'); }} />
            <SidebarItem icon="❤️" label="Favorites"        onPress={() => { closeSidebar(); router.push('/favorites'); }} />
            <SidebarItem icon="👤" label="Profile"     onPress={() => { closeSidebar(); router.push('/profile'); }} />
            <SidebarItem icon="📋" label="View My Listings" onPress={() => { closeSidebar(); router.push('/my-listings'); }} />
            {isAdmin && (
              <>
                <SidebarItem icon="🚩" label="View Reports" onPress={() => { closeSidebar(); router.push('/admin/reports'); }} />
                <SidebarItem icon="🛡️" label="Manage Users" onPress={() => { closeSidebar(); router.push('/admin/manage-users'); }} />
              </>
            )}

            <View style={styles.sidebarDivider} />


            <SidebarItem icon="🚪" label="Sign Out"   onPress={handleSignOut} />

          </ScrollView>
        </Animated.View>
      </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4F0' },

  headerSafe: { backgroundColor: RED },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  menuBtn: { padding: 4 },
  hamburger: { gap: 5, width: 22 },
  hamburgerLine: { height: 2, backgroundColor: '#fff', borderRadius: 2 },
  headerAvatarBtn: {},
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  searchRow: { paddingHorizontal: 16, paddingBottom: 14 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },

  categoryBar: { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  categoryScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#D0D0D0',
    backgroundColor: '#fff',
  },
  categoryPillActive: { backgroundColor: RED, borderColor: RED },
  categoryPillIcon: { fontSize: 13 },
  categoryPillText: { fontSize: 13, fontWeight: '500', color: '#555' },
  categoryPillTextActive: { color: '#fff' },

  grid: { padding: 12, paddingBottom: 32 },
  gridRow: { gap: 10 },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
  },
  cardImage: { height: 120, alignItems: 'center', justifyContent: 'center' },
  cardImageIcon: { fontSize: 36 },
  cardBody: { padding: 10 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: RED, marginBottom: 2 },
  cardTitle: { fontSize: 13, fontWeight: '500', color: '#111', lineHeight: 18, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  categoryBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' },
  conditionText: { fontSize: 11, color: '#999' },
  cardLocation: { fontSize: 11, color: '#ABABAB', marginTop: 2 },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    backgroundColor: RED,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

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
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: RED,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
    paddingBottom: 16,
  },
  sidebarLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sidebarLogoMark: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarLogoIcon: { fontSize: 18 },
  sidebarLogoText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 18,
  },
  sidebarClose: { fontSize: 18, color: 'rgba(255,255,255,0.8)' },

  sidebarUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sidebarAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FCEBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarAvatarText: { fontSize: 16, fontWeight: '700', color: RED },
  sidebarUserName: { fontSize: 14, fontWeight: '600', color: '#111' },
  sidebarUserEmail: { fontSize: 12, color: '#999', marginTop: 1 },

  sidebarDivider: { height: 0.5, backgroundColor: '#EBEBEB', marginHorizontal: 16, marginVertical: 8 },
  sidebarNav: { flex: 1, paddingHorizontal: 8 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 2,
  },
  sidebarIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  sidebarLabel: { fontSize: 14, fontWeight: '500', color: '#222' },

});