import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { getStoredUserRole } from '@/services/auth';

const RED = '#C0121A';

const SAMPLE_REPORTS = [
  {
    id: '1',
    reporter: 'alex@university.edu',
    target: 'Listing #101',
    summary: 'Spam listing with repeated fake discounts',
    status: 'Open',
  },
  {
    id: '2',
    reporter: 'maria@university.edu',
    target: 'User john@university.edu',
    summary: 'Inappropriate language in direct messages',
    status: 'Open',
  },
  {
    id: '3',
    reporter: 'nina@university.edu',
    target: 'Listing #77',
    summary: 'Item already sold but still marked active',
    status: 'Under Review',
  },
];

export default function AdminReportsPage() {
  const [ready, setReady] = useState(false);

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
          <Text style={styles.headerTitle}>Admin Report Page</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <FlatList
        data={SAMPLE_REPORTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/admin/report/[id]', params: { id: item.id } })}
          >
            <Text style={styles.cardTitle}>Report #{item.id}</Text>
            <Text style={styles.cardText}>Reporter: {item.reporter}</Text>
            <Text style={styles.cardText}>Reported Target: {item.target}</Text>
            <Text style={styles.cardSummary}>{item.summary}</Text>
            <Text style={styles.cardStatus}>Status: {item.status}</Text>
          </TouchableOpacity>
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
  list: { padding: 14, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
    gap: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  cardText: { fontSize: 13, color: '#555' },
  cardSummary: { fontSize: 13, color: '#444', marginTop: 4 },
  cardStatus: { fontSize: 12, fontWeight: '600', color: '#A32D2D', marginTop: 4 },
});
