import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyListings, Listing } from '../services/api';



export default function MyListingsScreen() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadListings = async () => {
        try {
            setError(null);
            const data = await fetchMyListings();
            setListings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load listings');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadListings();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadListings();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={styles.muted}>Loading your listings...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>{error}</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={listings}
            keyExtractor={(item) => item.listingId}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Text style={styles.emptyTitle}>No listings yet</Text>
                    <Text style={styles.muted}>Your marketplace listings will appear here.</Text>
                </View>
            }
            renderItem={({ item }) => (
                <View style={styles.card}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    ) : (
                        <View style={[styles.image, styles.placeholder]}>
                            <Text style={styles.muted}>No Image</Text>
                        </View>
                    )}

                    <View style={styles.info}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                        <Text style={styles.details}>
                            {item.category} • {item.condition}
                        </Text>
                        <Text style={item.isSold ? styles.sold : styles.available}>
                            {item.isSold ? 'Sold' : 'Available'}
                        </Text>
                    </View>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        padding: 16,
        flexGrow: 1,
        backgroundColor: '#f6f6f6',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f6f6f6',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 10,
        marginRight: 12,
    },
    placeholder: {
        backgroundColor: '#e5e5e5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    details: {
        color: '#666',
        marginBottom: 8,
    },
    available: {
        color: 'green',
        fontWeight: '700',
    },
    sold: {
        color: 'red',
        fontWeight: '700',
    },
    muted: {
        color: '#666',
        textAlign: 'center',
    },
    error: {
        color: 'red',
        textAlign: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
});