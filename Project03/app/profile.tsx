import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { getCurrentUser } from "@/services/api";

type User = {
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
};

export default function ProfileScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadUser() {
            try {
                const data = await getCurrentUser();
                setUser(data);
            } catch (err) {
                console.error("Profile fetch error:", err);
                setError(err instanceof Error ? err.message : "Failed to load profile");
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorTitle}>Could not load profile.</Text>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const createdDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : "Unknown";

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.card}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user.name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                </View>

                <Text style={styles.username}>{user.name}</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user.email}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Role</Text>
                    <Text style={styles.value}>{user.role}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Status</Text>
                    <Text style={styles.value}>{user.status}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Account Created</Text>
                    <Text style={styles.value}>{createdDate}</Text>
                </View>
            </View>
        </View>
    );
}

const RED = "#C0121A";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#fff",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        color: "#666",
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        marginBottom: 24,
        color: "#111",
    },
    card: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: "#f7f7f7",
        alignItems: "center",
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    avatarText: {
        color: "#fff",
        fontSize: 36,
        fontWeight: "700",
    },
    username: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 24,
        color: "#111",
    },
    infoRow: {
        width: "100%",
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    label: {
        fontSize: 13,
        color: "#777",
        marginBottom: 4,
    },
    value: {
        fontSize: 17,
        fontWeight: "600",
        color: "#111",
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: RED,
        marginBottom: 8,
    },
    errorText: {
        textAlign: "center",
        color: "#666",
    },
});