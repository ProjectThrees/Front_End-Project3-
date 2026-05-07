import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { getStoredUserRole } from '@/services/auth';

const RED = '#C0121A';

const INITIAL_USERS = [
  { id: 'u1', name: 'Alex Kim', email: 'alex@university.edu', role: 'USER' },
  { id: 'u2', name: 'Jordan Lee', email: 'jordan@university.edu', role: 'USER' },
  { id: 'u3', name: 'Morgan Shah', email: 'morgan@university.edu', role: 'ADMIN' },
];

export default function ManageUsersPage() {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState(INITIAL_USERS);
  const counts = useMemo(
    () => ({
      admins: users.filter((user) => user.role === 'ADMIN').length,
      users: users.filter((user) => user.role === 'USER').length,
    }),
    [users]
  );

  useEffect(() => {
    let isMounted = true;

    async function verifyAdmin() {
      const role = await getStoredUserRole();
      if (!isMounted) return;
      if (role !== 'admin') {
        router.replace('/(tabs)');
        return;
      }
      setReady(true);
    }

    verifyAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  function toggleUserRole(userId) {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' }
          : user
      )
    );
  }

  function deleteUser(userId) {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  }

  if (!ready) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Management Page</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Admins: {counts.admins}</Text>
        <Text style={styles.summaryText}>Users: {counts.users}</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.role}>Role: {item.role}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.roleBtn} onPress={() => toggleUserRole(item.id)}>
                <Text style={styles.actionText}>Role</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteUser(item.id)}>
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
    paddingVertical: 12,
  },
  backBtn: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 18 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: { fontSize: 13, fontWeight: '700', color: '#444' },
  list: { paddingHorizontal: 14, paddingBottom: 18, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  userInfo: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '700', color: '#222' },
  email: { fontSize: 12, color: '#666' },
  role: { fontSize: 12, fontWeight: '700', color: '#A32D2D' },
  actions: { justifyContent: 'center', gap: 8 },
  roleBtn: {
    minWidth: 78,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FAEEDA',
  },
  deleteBtn: {
    minWidth: 78,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FCEBEB',
  },
  actionText: { fontSize: 12, fontWeight: '700', color: '#333' },
});
