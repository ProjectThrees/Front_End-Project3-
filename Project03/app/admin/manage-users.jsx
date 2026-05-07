import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { getStoredUserRole } from '@/services/auth';
import { getAllUsers, updateUserById, deleteUserById } from '@/services/api';

const RED = '#C0121A';

export default function ManageUsersPage() {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const counts = useMemo(
    () => ({
      admins: users.filter((u) => u.role === 'ADMIN').length,
      users: users.filter((u) => u.role === 'USER').length,
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
    return () => { isMounted = false; };
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) loadUsers();
  }, [ready, loadUsers]);

  async function toggleUserRole(user) {
    if (busyId) return;
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setBusyId(user.userId);
    try {
      const updated = await updateUserById(user.userId, {
        name: user.name,
        email: user.email,
        role: newRole,
        status: user.status,
      });
      setUsers((prev) => prev.map((u) => (u.userId === updated.userId ? updated : u)));
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Failed to update role.');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleUserStatus(user) {
    if (busyId) return;
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const label = newStatus === 'SUSPENDED' ? 'Suspend' : 'Unsuspend';

    Alert.alert(
      `${label} User`,
      `${label} ${user.name} (${user.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          style: newStatus === 'SUSPENDED' ? 'destructive' : 'default',
          onPress: async () => {
            setBusyId(user.userId);
            try {
              const updated = await updateUserById(user.userId, {
                name: user.name,
                email: user.email,
                role: user.role,
                status: newStatus,
              });
              setUsers((prev) => prev.map((u) => (u.userId === updated.userId ? updated : u)));
            } catch (err) {
              Alert.alert('Error', err.message ?? 'Failed to update status.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  }

  function confirmDelete(user) {
    if (busyId) return;
    Alert.alert(
      'Delete User',
      `Permanently delete ${user.name} (${user.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusyId(user.userId);
            try {
              await deleteUserById(user.userId);
              setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
            } catch (err) {
              Alert.alert('Error', err.message ?? 'Failed to delete user.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  }

  if (!ready) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Users</Text>
          <TouchableOpacity onPress={loadUsers} disabled={loading}>
            <Text style={styles.refreshBtn}>↻</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RED} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadUsers}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Admins: {counts.admins}</Text>
            <Text style={styles.summaryText}>Users: {counts.users}</Text>
            <Text style={styles.summaryText}>Total: {users.length}</Text>
          </View>

          <FlatList
            data={users}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No users found.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isBusy = busyId === item.userId;
              const isSuspended = item.status === 'SUSPENDED';
              const isBanned = item.status === 'BANNED';
              return (
                <View style={styles.card}>
                  <View style={styles.userInfo}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <View style={styles.badgeRow}>
                      <Text style={styles.roleBadge}>{item.role}</Text>
                      {(isSuspended || isBanned) && (
                        <Text style={styles.statusBadge}>
                          {isBanned ? 'BANNED' : 'SUSPENDED'}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.actions}>
                    {/* Role toggle */}
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.roleBtn, isBusy && styles.disabledBtn]}
                      onPress={() => toggleUserRole(item)}
                      disabled={isBusy}
                    >
                      <Text style={styles.actionText}>
                        {item.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                      </Text>
                    </TouchableOpacity>

                    {/* Suspend / Unsuspend (only if not banned) */}
                    {!isBanned && (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          isSuspended ? styles.unsuspendBtn : styles.suspendBtn,
                          isBusy && styles.disabledBtn,
                        ]}
                        onPress={() => toggleUserStatus(item)}
                        disabled={isBusy}
                      >
                        <Text style={styles.actionText}>
                          {isSuspended ? 'Unsuspend' : 'Suspend'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Delete */}
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn, isBusy && styles.disabledBtn]}
                      onPress={() => confirmDelete(item)}
                      disabled={isBusy}
                    >
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
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
  refreshBtn: { color: '#fff', fontSize: 22, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#A32D2D', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: RED,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyText: { color: '#888', fontSize: 14 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  summaryText: { fontSize: 13, fontWeight: '700', color: '#444' },
  list: { paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  userInfo: { gap: 3 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  name: { fontSize: 14, fontWeight: '700', color: '#222' },
  email: { fontSize: 12, color: '#666' },
  roleBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A32D2D',
    backgroundColor: '#FCEBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A4A00',
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleBtn: { backgroundColor: '#FAEEDA' },
  suspendBtn: { backgroundColor: '#FFF3CD' },
  unsuspendBtn: { backgroundColor: '#EAF3DE' },
  deleteBtn: { backgroundColor: '#FCEBEB' },
  disabledBtn: { opacity: 0.4 },
  actionText: { fontSize: 12, fontWeight: '700', color: '#333' },
});
