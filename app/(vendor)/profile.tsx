import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Colors } from '@/constants/Colors';

export default function VendorProfileScreen() {
  const { vendor, logout, refreshVendor } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: vendor?.name || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    cuisine_type: vendor?.cuisine_type || '',
    description: vendor?.description || '',
  });
  const [saving, setSaving] = useState(false);

  function setField(key: string, value: string) { setForm(f => ({ ...f, [key]: value })); }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  function startEdit() {
    setForm({
      name: vendor?.name || '',
      phone: vendor?.phone || '',
      address: vendor?.address || '',
      cuisine_type: vendor?.cuisine_type || '',
      description: vendor?.description || '',
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/vendor/profile', form);
      await refreshVendor();
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function getInitials(n?: string) {
    if (!n) return '?';
    return n.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurant Profile</Text>
        {!editing && (
          <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(vendor?.name)}</Text>
            </View>
            <Text style={styles.vendorName}>{vendor?.name || 'Restaurant'}</Text>
            <Text style={styles.vendorEmail}>{vendor?.email}</Text>
            <View style={[styles.openBadge, { backgroundColor: vendor?.is_open ? Colors.success : Colors.error }]}>
              <Text style={styles.openBadgeText}>{vendor?.is_open ? 'Currently Open' : 'Currently Closed'}</Text>
            </View>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <Text style={styles.label}>Restaurant Name</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={v => setField('name', v)} placeholder="Restaurant name" placeholderTextColor={Colors.textMuted} />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} value={form.phone} onChangeText={v => setField('phone', v)} placeholder="+91 98765 43210" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

              <Text style={styles.label}>Cuisine Type</Text>
              <TextInput style={styles.input} value={form.cuisine_type} onChangeText={v => setField('cuisine_type', v)} placeholder="e.g. Indian, Chinese..." placeholderTextColor={Colors.textMuted} />

              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, styles.multiline]} value={form.address} onChangeText={v => setField('address', v)} placeholder="Restaurant address" placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.multiline]} value={form.description} onChangeText={v => setField('description', v)} placeholder="Tell customers about your restaurant..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />

              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <InfoRow icon="restaurant-outline" label="Cuisine" value={vendor?.cuisine_type || '—'} />
              <View style={styles.divider} />
              <InfoRow icon="call-outline" label="Phone" value={vendor?.phone || '—'} />
              <View style={styles.divider} />
              <InfoRow icon="location-outline" label="Address" value={vendor?.address || '—'} />
              <View style={styles.divider} />
              <InfoRow icon="star-outline" label="Rating" value={vendor?.rating && vendor.rating > 0 ? vendor.rating.toFixed(1) + ' / 5' : 'No ratings yet'} />
              <View style={styles.divider} />
              <InfoRow icon="document-text-outline" label="Description" value={vendor?.description || '—'} />
            </View>
          )}

          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>FoodBox Vendor v1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.white} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: Colors.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  scroll: { padding: 20, gap: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 30, fontWeight: '800', color: Colors.white },
  vendorName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  vendorEmail: { fontSize: 14, color: Colors.textLight },
  openBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  openBadgeText: { fontSize: 13, color: Colors.white, fontWeight: '700' },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, color: Colors.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border },
  editForm: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  saveBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  appInfo: { alignItems: 'center' },
  appVersion: { fontSize: 13, color: Colors.textMuted },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.error, borderRadius: 14, paddingVertical: 15 },
  logoutBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
