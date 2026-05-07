import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getStoredUserRole } from '@/services/auth';

const RED = '#C0121A';

export default function ReportInfoPage() {
  const { id } = useLocalSearchParams();
  const [ready, setReady] = useState(false);
  const [reportStatus, setReportStatus] = useState('Open');

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
          <Text style={styles.headerTitle}>Report Info Page</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        <Text style={styles.title}>Report #{id ?? 'Unknown'}</Text>
        <Text style={styles.label}>Full Report Description</Text>
        <Text style={styles.value}>
          This report indicates suspicious behavior and possible policy violations. Admin should review chat and listing
          history before final action.
        </Text>

        <Text style={styles.label}>Reported User or Listing</Text>
        <Text style={styles.value}>User: user123@university.edu (Listing #101)</Text>

        <Text style={styles.label}>Reporter Information</Text>
        <Text style={styles.value}>alex@university.edu</Text>

        <Text style={styles.label}>Report Status</Text>
        <Text style={styles.statusValue}>{reportStatus}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.resolveBtn]} onPress={() => setReportStatus('Resolved')}>
            <Text style={styles.actionText}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.warnBtn]} onPress={() => setReportStatus('Warned')}>
            <Text style={styles.actionText}>Warn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.banBtn]} onPress={() => setReportStatus('Banned')}>
            <Text style={styles.actionText}>Ban</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  container: {
    margin: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '700', color: '#333' },
  value: { fontSize: 13, color: '#555', lineHeight: 19 },
  statusValue: { fontSize: 13, color: '#A32D2D', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resolveBtn: { backgroundColor: '#EAF3DE' },
  warnBtn: { backgroundColor: '#FAEEDA' },
  banBtn: { backgroundColor: '#FCEBEB' },
  actionText: { fontSize: 13, fontWeight: '700', color: '#333' },
});
