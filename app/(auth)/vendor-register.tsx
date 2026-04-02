import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

const CUISINE_OPTIONS = ['Indian', 'Chinese', 'Italian', 'Fast Food', 'Pizza', 'Biryani', 'South Indian', 'North Indian', 'Continental', 'Mexican', 'Thai', 'Cafe', 'Bakery', 'Desserts', 'Other'];

export default function VendorRegisterScreen() {
  const router = useRouter();
  const { registerVendor } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    cuisine_type: '',
    description: '',
  });
  const [showCuisinePicker, setShowCuisinePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleRegister() {
    setError('');
    if (!form.name.trim()) { setError('Restaurant name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) { setError('Enter a valid email address'); return; }
    if (!form.password) { setError('Password is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      await registerVendor({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        address: form.address.trim() || undefined,
        cuisine_type: form.cuisine_type || undefined,
        description: form.description.trim() || undefined,
      });
      router.replace('/(vendor)/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Register Restaurant</Text>
          <Text style={styles.subtitle}>Start serving on FoodBox today</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Text style={styles.label}>Restaurant Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Spice Garden" placeholderTextColor={Colors.textMuted} value={form.name} onChangeText={v => setField('name', v)} />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput style={styles.input} placeholder="restaurant@example.com" placeholderTextColor={Colors.textMuted} value={form.email} onChangeText={v => setField('email', v)} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor={Colors.textMuted} value={form.phone} onChangeText={v => setField('phone', v)} keyboardType="phone-pad" />

          <Text style={styles.label}>Password *</Text>
          <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor={Colors.textMuted} value={form.password} onChangeText={v => setField('password', v)} secureTextEntry />

          <Text style={styles.label}>Restaurant Address</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="123 Main St, City, Pincode" placeholderTextColor={Colors.textMuted} value={form.address} onChangeText={v => setField('address', v)} multiline numberOfLines={2} />

          <Text style={styles.label}>Cuisine Type</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowCuisinePicker(v => !v)}>
            <Text style={form.cuisine_type ? styles.pickerSelected : styles.pickerPlaceholder}>
              {form.cuisine_type || 'Select cuisine type'}
            </Text>
          </TouchableOpacity>
          {showCuisinePicker && (
            <View style={styles.pickerOptions}>
              {CUISINE_OPTIONS.map(c => (
                <TouchableOpacity key={c} style={styles.pickerOption} onPress={() => { setField('cuisine_type', c); setShowCuisinePicker(false); }}>
                  <Text style={[styles.pickerOptionText, form.cuisine_type === c && styles.pickerOptionActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Tell customers about your restaurant..."
            placeholderTextColor={Colors.textMuted}
            value={form.description}
            onChangeText={v => setField('description', v)}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.registerBtnText}>Register Restaurant</Text>}
          </TouchableOpacity>

          <View style={styles.links}>
            <Text style={styles.linkText}>Already registered? </Text>
            <Link href="/(auth)/vendor-login" asChild>
              <TouchableOpacity><Text style={styles.link}>Login here</Text></TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 24 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.textLight, marginBottom: 24 },
  errorBox: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.error, fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  picker: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pickerSelected: { fontSize: 15, color: Colors.text },
  pickerPlaceholder: { fontSize: 15, color: Colors.textMuted },
  pickerOptions: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerOptionText: { fontSize: 13, color: Colors.text },
  pickerOptionActive: { color: Colors.primary, fontWeight: '700' },
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: { opacity: 0.7 },
  registerBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  links: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, marginBottom: 16 },
  linkText: { fontSize: 14, color: Colors.textLight },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
});
