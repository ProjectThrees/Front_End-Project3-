import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar,
    SafeAreaView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
    getCurrentUser,
    getListingById,
    removeFavorite,
    FavoriteResponse,
    Listing,
    User,
} from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RED = '#C0121A';

const CATEGORY_ICONS: Record<string, string> = {
    Textbooks: '📚',
    Electronics: '💻',
    Furniture: '🪑',
    Clothing: '👕',
    Dorm: '🛏',
    Other: '📦',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    Textbooks: { bg: '#EAF3DE', text: '#3B6D11' },
    Electronics: { bg: '#E6F1FB', text: '#185FA5' },
    Furniture: { bg: '#FAEEDA', text: '#854F0B' },
    Clothing: { bg: '#FBEAF0', text: '#993556' },
    Dorm: { bg: '#E1F5EE', text: '#0F6E56' },
    Other: { bg: '#F1EFE8', text: '#5F5E5A' },
};

// ---------------------------------------------------------------------------
// Type for a favorite entry enriched with listing data
// ---------------------------------------------------------------------------
type EnrichedFavorite = FavoriteResponse & { listing: Listing };

// ---------------------------------------------------------------------------
// Fetch all favorites for the current user
// Since GET /favorites returns all, we filter by userId client-side
// ---------------------------------------------------------------------------
async function fetchFavorites(): Promise<FavoriteResponse[]> {
    const token = await AsyncStorage.getItem('authToken');
    const baseUrl = (await import('@/services/api')).getApiBaseUrl();
    const response = await fetch(`${baseUrl}/favorites`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed (${response.status}): ${text}`);
    }
    return response.json();
}

// ---------------------------------------------------------------------------
// FavoriteCard
// ---------------------------------------------------------------------------
function FavoriteCard({
                          item,
                          onRemove,
                          isRemoving,
                      }: {
    item: EnrichedFavorite;
    onRemove: (item: EnrichedFavorite) => void;
    isRemoving: boolean;
}) {
    const { listing } = item;
    const catStyle = CATEGORY_COLORS[listing.category] ?? CATEGORY_COLORS.Other;
    const icon = CATEGORY_ICONS[listing.category] ?? '📦';

    return (
        <TouchableOpacity
            style={[styles.card, isRemoving && styles.cardRemoving]}
            activeOpacity={0.85}
            onPress={() =>
                router.push({ pathname: '/listing', params: { id: listing.listingId } })
            }
        >
            {/* Image */}
            <View style={styles.cardImage}>
                <Text style={styles.cardImageIcon}>{icon}</Text>
            </View>

            {/* Heart button */}
            <TouchableOpacity
                style={styles.heartBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => onRemove(item)}
                disabled={isRemoving}
            >
                {isRemoving
                    ? <ActivityIndicator size="small" color={RED} />
                    : <Text style={styles.heartIcon}>❤️</Text>
                }
            </TouchableOpacity>

            {/* Body */}
            <View style={styles.cardBody}>
                <Text style={styles.cardPrice}>${listing.price}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{listing.title}</Text>
                <View style={styles.cardMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
                        <Text style={[styles.categoryBadgeText, { color: catStyle.text }]}>
                            {listing.category}
                        </Text>
                    </View>
                    <Text style={styles.conditionText}>{listing.condition}</Text>
                </View>
                <Text style={styles.cardLocation}>📍 On Campus</Text>
            </View>
        </TouchableOpacity>
    );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
function Header() {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Favorites</Text>
            <View style={{ width: 32 }} />
        </View>
    );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState<EnrichedFavorite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const loadFavorites = useCallback(async () => {
        try {
            setIsLoading(true);
            setLoadError(null);

            // 1. Get current user
            const user = await getCurrentUser();
            setCurrentUser(user);

            // 2. Get all favorites
            const allFavorites = await fetchFavorites();

            // 3. Filter to only this user's favorites
            const userFavorites = allFavorites.filter(f => f.userId === user.userId);

            // 4. Fetch listing details for each favorite in parallel
            const enriched = await Promise.all(
                userFavorites.map(async fav => {
                    const listing = await getListingById(fav.listingId);
                    return { ...fav, listing };
                })
            );

            setFavorites(enriched);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load favorites';
            setLoadError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    const handleRemove = useCallback(
        (item: EnrichedFavorite) => {
            Alert.alert(
                'Remove Favorite',
                'Remove this listing from your favorites?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                            if (!currentUser) return;
                            setRemovingId(item.favoriteId);
                            try {
                                await removeFavorite(item.listingId, currentUser.userId);
                                setFavorites(prev =>
                                    prev.filter(f => f.favoriteId !== item.favoriteId)
                                );
                            } catch {
                                Alert.alert('Error', 'Could not remove favorite. Please try again.');
                            } finally {
                                setRemovingId(null);
                            }
                        },
                    },
                ]
            );
        },
        [currentUser]
    );

    if (isLoading) {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor={RED} />
                <SafeAreaView style={styles.headerSafe}><Header /></SafeAreaView>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={RED} />
                    <Text style={styles.loadingText}>Loading favorites…</Text>
                </View>
            </View>
        );
    }

    if (loadError) {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor={RED} />
                <SafeAreaView style={styles.headerSafe}><Header /></SafeAreaView>
                <View style={styles.centered}>
                    <Text style={styles.emptyIcon}>⚠️</Text>
                    <Text style={styles.emptyTitle}>Something went wrong</Text>
                    <Text style={styles.emptyText}>{loadError}</Text>
                    <TouchableOpacity style={styles.actionBtn} onPress={loadFavorites}>
                        <Text style={styles.actionBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={RED} />
            <SafeAreaView style={styles.headerSafe}><Header /></SafeAreaView>

            <FlatList
                data={favorites}
                keyExtractor={item => item.favoriteId}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={favorites.length > 0 ? styles.gridRow : null}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    favorites.length > 0 ? (
                        <Text style={styles.countText}>
                            {favorites.length} saved listing{favorites.length !== 1 ? 's' : ''}
                        </Text>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>❤️</Text>
                        <Text style={styles.emptyTitle}>No favorites yet</Text>
                        <Text style={styles.emptyText}>
                            Browse the marketplace and save listings you love
                        </Text>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => router.replace('/(tabs)')}
                        >
                            <Text style={styles.actionBtnText}>Browse Listings</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <FavoriteCard
                            item={item}
                            onRemove={handleRemove}
                            isRemoving={removingId === item.favoriteId}
                        />
                    </View>
                )}
            />
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 8,
        paddingBottom: 14,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    backBtn: { width: 32, alignItems: 'flex-start' },
    backBtnText: { fontSize: 22, color: '#fff', fontWeight: '700' },

    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    loadingText: { marginTop: 12, fontSize: 14, color: '#999' },

    countText: { fontSize: 13, color: '#888', marginBottom: 10, marginLeft: 2 },

    grid: { padding: 12, paddingBottom: 32 },
    gridRow: { gap: 10 },
    cardWrapper: { flex: 1, marginBottom: 10 },

    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: '#E8E8E8',
    },
    cardRemoving: { opacity: 0.5 },
    cardImage: {
        height: 120,
        backgroundColor: '#F5F4F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardImageIcon: { fontSize: 36 },

    heartBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 15,
    },
    heartIcon: { fontSize: 16 },

    cardBody: { padding: 10 },
    cardPrice: { fontSize: 16, fontWeight: '700', color: RED, marginBottom: 2 },
    cardTitle: { fontSize: 13, fontWeight: '500', color: '#111', lineHeight: 18, marginBottom: 6 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    categoryBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
    categoryBadgeText: { fontSize: 10, fontWeight: '600' },
    conditionText: { fontSize: 11, color: '#999' },
    cardLocation: { fontSize: 11, color: '#ABABAB', marginTop: 2 },

    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 32,
    },
    emptyIcon: { fontSize: 48, marginBottom: 14 },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: '#333', marginBottom: 6 },
    emptyText: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 20 },

    actionBtn: {
        backgroundColor: RED,
        paddingHorizontal: 24,
        paddingVertical: 11,
        borderRadius: 10,
    },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});