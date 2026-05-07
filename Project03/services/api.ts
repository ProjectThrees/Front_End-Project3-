import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";

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
    const token = await AsyncStorage.getItem('authToken');

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init?.headers ?? {}),
        },
        ...init,
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Request failed (${response.status}): ${responseText || response.statusText}`);
    }

    return response.json() as Promise<T>;
}

export async function fetchListings(): Promise<Listing[]> {
  return request<Listing[]>('/listings');
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

type TokenPayload = {
    sub?: string;
    userId?: string;
};

export async function getCurrentUser(): Promise<User> {
    const token = await AsyncStorage.getItem("authToken");

    if (!token) {
        throw new Error("No auth token found");
    }

    const decoded = jwtDecode<TokenPayload>(token);

    console.log("JWT decoded:", decoded);

    const userId = decoded.userId ?? decoded.sub;

    if (!userId) {
        throw new Error("Token does not contain userId or sub");
    }

    return getUserById(userId);
}
