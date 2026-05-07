import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getStoredUserRole } from '@/services/auth';
import {
  deleteReport,
  getReportById,
  getUserById,
  updateReportStatus,
  updateUserById,
} from '@/services/api';

const RED = '#C0121A';

const STATUS_COLOR = {
  PENDING: '#A32D2D',
  REVIEWED: '#B07D00',
  RESOLVED: '#2D6A2D',
};

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ReportInfoPage() {
  const { id } = useLocalSearchParams();
  const [ready, setReady] = useState(false);
  const [report, setReport] = useState(null);
  const [reporter, setReporter] = useState(null);
  const [reportedUser, setReportedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!ready || !id) return;

    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const data = await getReportById(id);
        setReport(data);

        const [rep, repUser] = await Promise.allSettled([
          data.reporterId ? getUserById(data.reporterId) : Promise.resolve(null),
          data.reportedUserId ? getUserById(data.reportedUserId) : Promise.resolve(null),
        ]);

        if (rep.status === 'fulfilled') setReporter(rep.value);
        if (repUser.status === 'fulfilled') setReportedUser(repUser.value);
      } catch (err) {
        setError(err.message ?? 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [ready, id]);

  async function handleSetStatus(newStatus) {
    if (!report || saving) return;
    setSaving(true);
    try {
      const updated = await updateReportStatus(report.reportId, newStatus);
      setReport(updated);
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  }

  async function handleBanUser() {
    if (!reportedUser || saving) return;
    Alert.alert(
      'Ban User',
      `Are you sure you want to ban ${reportedUser.name} (${reportedUser.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await updateUserById(reportedUser.userId, {
                name: reportedUser.name,
                email: reportedUser.email,
                role: reportedUser.role,
                status: 'BANNED',
              });
              setReportedUser((prev) => ({ ...prev, status: 'BANNED' }));
              Alert.alert('Done', `${reportedUser.name} has been banned.`);
            } catch (err) {
              Alert.alert('Error', err.message ?? 'Failed to ban user.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  async function handleDeleteReport() {
    if (!report || saving) return;
    Alert.alert(
      'Delete Report',
      'Are you sure you want to permanently delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteReport(report.reportId);
              router.back();
            } catch (err) {
              Alert.alert('Error', err.message ?? 'Failed to delete report.');
              setSaving(false);
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
          <Text style={styles.headerTitle}>Report Detail</Text>
          <View style={styles.headerSpacer} />
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
        </View>
      )}

      {!loading && !error && report && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <Text style={styles.title}>Report Detail</Text>
              <Text style={[styles.statusBadge, { color: STATUS_COLOR[report.status] ?? '#555' }]}>
                {report.status}
              </Text>
            </View>

            <InfoRow label="Report ID" value={report.reportId} />
            <InfoRow label="Submitted" value={formatDate(report.createdAt)} />

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>Reason</Text>
            <Text style={styles.reasonText}>{report.reason}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>Reporter</Text>
            {reporter ? (
              <>
                <InfoRow label="Name" value={reporter.name} />
                <InfoRow label="Email" value={reporter.email} />
              </>
            ) : (
              <Text style={styles.mutedText}>{report.reporterId ?? '—'}</Text>
            )}

            {report.reportedUserId && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionHeader}>Reported User</Text>
                {reportedUser ? (
                  <>
                    <InfoRow label="Name" value={reportedUser.name} />
                    <InfoRow label="Email" value={reportedUser.email} />
                    <InfoRow label="Role" value={reportedUser.role} />
                    <InfoRow label="Status" value={reportedUser.status} />
                  </>
                ) : (
                  <Text style={styles.mutedText}>{report.reportedUserId}</Text>
                )}
              </>
            )}

            {report.listingId && (
              <>
                <View style={styles.divider} />
                <InfoRow label="Listing ID" value={report.listingId} />
              </>
            )}
          </View>

          {/* Status actions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Update Status</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.reviewedBtn,
                  report.status === 'REVIEWED' && styles.activeBtn,
                ]}
                onPress={() => handleSetStatus('REVIEWED')}
                disabled={saving || report.status === 'REVIEWED'}
              >
                <Text style={styles.actionText}>Mark Reviewed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.resolvedBtn,
                  report.status === 'RESOLVED' && styles.activeBtn,
                ]}
                onPress={() => handleSetStatus('RESOLVED')}
                disabled={saving || report.status === 'RESOLVED'}
              >
                <Text style={styles.actionText}>Mark Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User actions */}
          {reportedUser && reportedUser.status !== 'BANNED' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>User Actions</Text>
              <TouchableOpacity
                style={[styles.actionBtn, styles.banBtn]}
                onPress={handleBanUser}
                disabled={saving}
              >
                <Text style={styles.actionText}>Ban Reported User</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Delete report */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={handleDeleteReport}
              disabled={saving}
            >
              <Text style={styles.actionText}>Delete Report</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue} selectable>{value ?? '—'}</Text>
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
  headerSpacer: { width: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#A32D2D', fontSize: 14, textAlign: 'center' },
  scroll: { padding: 14, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#222' },
  statusBadge: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#EAEAEA', marginVertical: 8 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 2 },
  reasonText: { fontSize: 13, color: '#444', lineHeight: 19 },
  mutedText: { fontSize: 12, color: '#888' },
  infoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  infoLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  infoValue: { fontSize: 13, color: '#333', flex: 1 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#333' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  reviewedBtn: { backgroundColor: '#FAEEDA' },
  resolvedBtn: { backgroundColor: '#EAF3DE' },
  banBtn: { backgroundColor: '#FCEBEB' },
  deleteBtn: { backgroundColor: '#F0E0E0' },
  activeBtn: { opacity: 0.45 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#333' },
});
