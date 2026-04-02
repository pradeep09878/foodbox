import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  TextInput, Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  function getInitials(n?: string) {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/user/profile', { name: name.trim(), phone: phone.trim() });
      await refreshUser();
      setEditModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Info cards */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.name || '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || '—'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => { setName(user?.name || ''); setPhone(user?.phone || ''); setEditModal(true); }}>
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>FoodBox v1.0.0</Text>
          <Text style={styles.appCopy}>Made with ❤️ for great food</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.white} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  scroll: { padding: 20, gap: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 30, fontWeight: '800', color: Colors.white },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.text },
  userEmail: { fontSize: 14, color: Colors.textLight },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, color: Colors.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, paddingVertical: 14 },
  editBtnText: { fontSize: 16, color: Colors.primary, fontWeight: '700' },
  appInfo: { alignItems: 'center', paddingVertical: 8 },
  appVersion: { fontSize: 13, color: Colors.textMuted },
  appCopy: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.error, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  logoutBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
