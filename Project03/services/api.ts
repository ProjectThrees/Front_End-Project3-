import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Listing = {
    listingId: string;
    userId: string;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    imageUrl: string | null;
    isSold: boolean;
    createdAt: string;
};

const API_PORT = '8080';

function getDevHostFromExpo(): string | null {
    const hostUri = Constants.expoConfig?.hostUri;
    if (!hostUri) {
        return null;
    }

    return hostUri.split(':')[0] ?? null;
}

export function getApiBaseUrl(): string {
    const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (envUrl) {
        return envUrl.replace(/\/$/, '');
    }

    const expoHost = getDevHostFromExpo();
    if (expoHost) {
        return `http://${expoHost}:${API_PORT}`;
    }

    if (Platform.OS === 'android') {
        return `http://10.0.2.2:${API_PORT}`;
    }

    return `http://localhost:${API_PORT}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const { headers: initHeaders, ...restInit } = init ?? {};
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...restInit,
        headers: {
            'Content-Type': 'application/json',
            ...(initHeaders ?? {}),
        },
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Request failed (${response.status}): ${responseText || response.statusText}`);
    }

    return response.json() as Promise<T>;
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await AsyncStorage.getItem('authToken');
    return request<T>(path, {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

export async function fetchListings(): Promise<Listing[]> {
    return request<Listing[]>('/listings');
}

export async function getListingById(listingId: string): Promise<Listing> {
    return request<Listing>(`/listings/${listingId}`);
}

export type CreateListingPayload = {
    userId: string;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    imageUrl: string | null;
    isSold: boolean;
};

export async function createListing(payload: CreateListingPayload): Promise<Listing> {
    return authRequest<Listing>('/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export type FavoriteResponse = {
    favoriteId: string;
    userId: string;
    listingId: string;
    createdAt: string;
};

export async function addFavorite(listingId: string, userId: string): Promise<FavoriteResponse> {
    return authRequest<FavoriteResponse>(`/favorites/${listingId}`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });
}

export async function removeFavorite(listingId: string, userId: string): Promise<void> {
    await authRequest<void>(`/favorites/${listingId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
    });
}

export type CreateReportPayload = {
    reporterId: string;
    reportedUserId: string | null;
    listingId: string | null;
    reason: string;
};

export async function createReport(payload: CreateReportPayload): Promise<void> {
    await authRequest<void>('/report', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export type User = {
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
};

export async function getUserById(userId: string): Promise<User> {
    return request<User>(`/users/${userId}`);
}

export async function getCurrentUser(): Promise<User> {
    const token = await AsyncStorage.getItem("authToken");

    if (!token) {
        throw new Error("No auth token found");
    }

    return request<User>('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
}
