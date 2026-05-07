import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { createListing, getCurrentUser } from '@/services/api';

const RED = '#C0121A';

const CATEGORIES = ['Textbooks', 'Electronics', 'Furniture', 'Clothing', 'Dorm', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

function OptionPicker({ label, options, selected, onSelect }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.pill, selected === opt && styles.pillActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, selected === opt && styles.pillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function CreateListingPage() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showBanner('error', 'Permission to access photos is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri);
    }
  }

  async function handlePost() {
    if (!title.trim()) return showBanner('error', 'Please enter an item name.');
    if (!price.trim() || isNaN(parseFloat(price))) return showBanner('error', 'Please enter a valid price.');
    if (!category) return showBanner('error', 'Please select a category.');
    if (!condition) return showBanner('error', 'Please select a condition.');
    if (!currentUser) return showBanner('error', 'Could not identify your account. Please sign in again.');

    setSubmitting(true);
    setBanner(null);

    try {
      await createListing({
        userId: currentUser.userId,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        condition,
        imageUrl: imageUri ?? null,
        isSold: false,
      });

      showBanner('success', 'Listing posted successfully!');
      setTimeout(() => router.replace('/(tabs)'), 1400);
    } catch (err) {
      showBanner('error', err instanceof Error ? err.message : 'Failed to post listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function showBanner(type, message) {
    setBanner({ type, message });
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Listing</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

        {banner && (
          <View style={[styles.banner, banner.type === 'success' ? styles.bannerSuccess : styles.bannerError]}>
            <Text style={[styles.bannerText, banner.type === 'success' ? styles.bannerSuccessText : styles.bannerErrorText]}>
              {banner.type === 'success' ? '✓ ' : '⚠ '}{banner.message}
            </Text>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Item Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Calculus Textbook 8th Edition"
            placeholderTextColor="#ABABAB"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Price ($) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 25.00"
            placeholderTextColor="#ABABAB"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Describe your item — condition, details, etc."
            placeholderTextColor="#ABABAB"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Photo (optional)</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                <Text style={styles.imagePlaceholderText}>Tap to upload a photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
              <Text style={styles.removeImageText}>✕ Remove photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <OptionPicker label="Category *" options={CATEGORIES} selected={category} onSelect={setCategory} />
        <OptionPicker label="Condition *" options={CONDITIONS} selected={condition} onSelect={setCondition} />

        <TouchableOpacity
          style={[styles.postBtn, submitting && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.postBtnText}>{submitting ? 'Posting…' : 'Post Listing'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
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

  form: { padding: 16, paddingBottom: 40, gap: 6 },

  banner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
  },
  bannerSuccess: { backgroundColor: '#EAF3DE', borderColor: '#C0DD97' },
  bannerError: { backgroundColor: '#FCEBEB', borderColor: '#F7C1C1' },
  bannerText: { fontSize: 13, lineHeight: 18 },
  bannerSuccessText: { color: '#3B6D11' },
  bannerErrorText: { color: '#A32D2D' },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111',
  },
  inputMultiline: { minHeight: 100, paddingTop: 11 },

  pillRow: { gap: 8, paddingVertical: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: RED, borderColor: RED },
  pillText: { fontSize: 13, fontWeight: '500', color: '#555' },
  pillTextActive: { color: '#fff' },

  postBtn: {
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelBtnText: { fontSize: 14, color: '#999' },

  imagePicker: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    height: 160,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  imagePlaceholderIcon: { fontSize: 32 },
  imagePlaceholderText: { fontSize: 13, color: '#ABABAB' },
  removeImageBtn: { marginTop: 6, alignSelf: 'flex-start' },
  removeImageText: { fontSize: 12, color: '#A32D2D', fontWeight: '600' },
});
