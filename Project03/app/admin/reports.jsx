import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { getAdminReports } from '@/services/api';

const RED = '#C0121A';

const STATUS_COLOR = {
  PENDING: '#A32D2D',
  REVIEWED: '#B07D00',
  RESOLVED: '#2D6A2D',
};

function shortId(uuid) {
  if (!uuid) return '—';
  return uuid.slice(0, 8) + '…';
}

export default function AdminReportsPage() {
  const [ready, setReady] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminReports();
      setReports(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) loadReports();
  }, [ready, loadReports]);

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
          <Text style={styles.headerTitle}>Reports</Text>
          <TouchableOpacity onPress={loadReports}>
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
          <TouchableOpacity style={styles.retryBtn} onPress={loadReports}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && reports.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No reports found.</Text>
        </View>
      )}

      {!loading && !error && reports.length > 0 && (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.reportId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                router.push({ pathname: '/admin/report/[id]', params: { id: item.reportId } })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Report #{shortId(item.reportId)}</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    { color: STATUS_COLOR[item.status] ?? '#555' },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
              <Text style={styles.cardText}>
                Reporter: {item.reporterId ? shortId(item.reporterId) : '—'}
              </Text>
              {item.reportedUserId && (
                <Text style={styles.cardText}>Reported user: {shortId(item.reportedUserId)}</Text>
              )}
              {item.listingId && (
                <Text style={styles.cardText}>Listing: {shortId(item.listingId)}</Text>
              )}
              <Text style={styles.cardSummary} numberOfLines={2}>
                {item.reason}
              </Text>
            </TouchableOpacity>
          )}
        />
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
  list: { padding: 14, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  statusBadge: { fontSize: 12, fontWeight: '700' },
  cardText: { fontSize: 13, color: '#555' },
  cardSummary: { fontSize: 13, color: '#444', marginTop: 4 },
});
