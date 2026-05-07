import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { addFavorite, createReport, getCurrentUser, getListingById, getUserById, removeFavorite } from '@/services/api';

const RED = '#C0121A';

const CATEGORY_ICONS = {
  Textbooks: '📚',
  Electronics: '💻',
  Furniture: '🪑',
  Clothing: '👕',
  Dorm: '🛏',
  Other: '📦',
};

const CATEGORY_COLORS = {
  Textbooks: { bg: '#EAF3DE', text: '#3B6D11' },
  Electronics: { bg: '#E6F1FB', text: '#185FA5' },
  Furniture: { bg: '#FAEEDA', text: '#854F0B' },
  Clothing: { bg: '#FBEAF0', text: '#993556' },
  Dorm: { bg: '#E1F5EE', text: '#0F6E56' },
  Other: { bg: '#F1EFE8', text: '#5F5E5A' },
};

export default function ListingDetailsPage() {
  const { id } = useLocalSearchParams();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState(null);

  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [listingData, user] = await Promise.all([
          getListingById(id),
          getCurrentUser().catch(() => null),
        ]);

        if (!isMounted) return;
        setListing(listingData);
        setCurrentUser(user);

        if (listingData.userId) {
          const sellerData = await getUserById(listingData.userId).catch(() => null);
          if (isMounted) setSeller(sellerData);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load listing.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [id]);

  async function handleFavorite() {
    if (!currentUser) return showBanner('error', 'Sign in to save favorites.');
    if (!listing) return;

    try {
      if (isFavorited) {
        await removeFavorite(listing.listingId, currentUser.userId);
        setIsFavorited(false);
        showBanner('success', 'Removed from favorites.');
      } else {
        await addFavorite(listing.listingId, currentUser.userId);
        setIsFavorited(true);
        showBanner('success', 'Saved to favorites!');
      }
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : 'Could not update favorites.');
    }
  }

  async function handleSubmitReport() {
    if (!reportReason.trim()) return;
    if (!currentUser || !listing) return;

    setReportSubmitting(true);
    try {
      await createReport({
        reporterId: currentUser.userId,
        reportedUserId: listing.userId ?? null,
        listingId: listing.listingId,
        reason: reportReason.trim(),
      });
      setReportVisible(false);
      setReportReason('');
      showBanner('success', 'Report submitted. Thank you.');
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  }

  function showBanner(type, message) {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 3000);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>⏳ Loading listing…</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error ?? 'Listing not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn}>
          <Text style={styles.backLinkText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catStyle = CATEGORY_COLORS[listing.category] ?? CATEGORY_COLORS.Other;
  const catIcon = CATEGORY_ICONS[listing.category] ?? '📦';
  const isOwnListing = currentUser?.userId === listing.userId;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Listing Details</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {banner && (
          <View style={[styles.banner, banner.type === 'success' ? styles.bannerSuccess : styles.bannerError]}>
            <Text style={[styles.bannerText, banner.type === 'success' ? styles.bannerSuccessText : styles.bannerErrorText]}>
              {banner.type === 'success' ? '✓ ' : '⚠ '}{banner.message}
            </Text>
          </View>
        )}

        {/* Image */}
        <View style={styles.imageBox}>
          {listing.imageUrl ? (
            <Image source={{ uri: listing.imageUrl }} style={styles.imageActual} resizeMode="cover" />
          ) : (
            <Text style={styles.imageIcon}>{catIcon}</Text>
          )}
        </View>

        {/* Price + Title */}
        <View style={styles.titleRow}>
          <Text style={styles.price}>${listing.price}</Text>
          {listing.isSold && <View style={styles.soldBadge}><Text style={styles.soldText}>SOLD</Text></View>}
        </View>
        <Text style={styles.title}>{listing.title}</Text>

        {/* Category + Condition */}
        <View style={styles.metaRow}>
          <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
            <Text style={[styles.categoryText, { color: catStyle.text }]}>{listing.category}</Text>
          </View>
          {listing.condition ? (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{listing.condition}</Text>
            </View>
          ) : null}
        </View>

        {/* Seller */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Seller</Text>
          <Text style={styles.cardValue}>{seller?.name ?? 'Unknown Seller'}</Text>
          {seller?.email ? <Text style={styles.cardSub}>{seller.email}</Text> : null}
        </View>

        {/* Description */}
        {listing.description ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <Text style={styles.cardValue}>{listing.description}</Text>
          </View>
        ) : null}

        {/* Action buttons */}
        {!isOwnListing && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isFavorited && styles.actionBtnActive]}
              onPress={handleFavorite}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>{isFavorited ? '❤️' : '🤍'}</Text>
              <Text style={[styles.actionLabel, isFavorited && styles.actionLabelActive]}>
                {isFavorited ? 'Saved' : 'Favorite'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/messages/compose', params: { receiverId: listing.userId, listingId: listing.listingId } })}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => setReportVisible(true)}
            >
              <Text style={styles.actionIcon}>🚩</Text>
              <Text style={styles.actionLabel}>Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={reportVisible} transparent animationType="slide" onRequestClose={() => setReportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Listing</Text>
            <Text style={styles.modalSub}>Describe the issue with this listing or seller.</Text>
            <TextInput
              style={styles.reportInput}
              placeholder="Enter reason…"
              placeholderTextColor="#ABABAB"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setReportVisible(false); setReportReason(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, (!reportReason.trim() || reportSubmitting) && styles.modalSubmitBtnDisabled]}
                onPress={handleSubmitReport}
                disabled={!reportReason.trim() || reportSubmitting}
              >
                <Text style={styles.modalSubmitText}>{reportSubmitting ? 'Sending…' : 'Send Report'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  backBtn: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 22 },

  body: { padding: 16, paddingBottom: 40, gap: 12 },

  banner: { borderRadius: 10, padding: 12, borderWidth: 0.5 },
  bannerSuccess: { backgroundColor: '#EAF3DE', borderColor: '#C0DD97' },
  bannerError: { backgroundColor: '#FCEBEB', borderColor: '#F7C1C1' },
  bannerText: { fontSize: 13 },
  bannerSuccessText: { color: '#3B6D11' },
  bannerErrorText: { color: '#A32D2D' },

  imageBox: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  imageActual: { width: '100%', height: '100%' },
  imageIcon: { fontSize: 72 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontSize: 26, fontWeight: '800', color: RED },
  soldBadge: { backgroundColor: '#555', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  soldText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: '#111', lineHeight: 24 },

  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  conditionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F0F0F0' },
  conditionText: { fontSize: 12, fontWeight: '600', color: '#666' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
    padding: 14,
    gap: 4,
  },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 14, color: '#111', lineHeight: 20 },
  cardSub: { fontSize: 12, color: '#999' },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  actionBtnActive: { backgroundColor: '#FCEBEB', borderColor: '#F7C1C1' },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#444' },
  actionLabelActive: { color: RED },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  loadingText: { fontSize: 15, color: '#666' },
  errorText: { fontSize: 15, color: '#A32D2D', textAlign: 'center' },
  backLinkBtn: { marginTop: 8 },
  backLinkText: { fontSize: 14, color: RED, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  modalSub: { fontSize: 13, color: '#777' },
  reportInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111',
    minHeight: 100,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#555' },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: RED,
  },
  modalSubmitBtnDisabled: { opacity: 0.5 },
  modalSubmitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
