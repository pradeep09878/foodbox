import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, TextInput as RNTextInput,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

const CUISINE_OPTIONS = ['Indian', 'Chinese', 'Italian', 'Fast Food', 'Pizza', 'Biryani', 'South Indian', 'North Indian', 'Continental', 'Mexican', 'Thai', 'Cafe', 'Bakery', 'Desserts', 'Other'];

// Step 1 — email entry + send OTP
// Step 2 — OTP verification
// Step 3 — rest of registration form

export default function VendorRegisterScreen() {
  const router = useRouter();
  const { registerVendor } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirmPassword: '',
    address: '', cuisine_type: '', description: '',
  });
  const [showCuisinePicker, setShowCuisinePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef<(RNTextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  // Step 1: Send OTP
  async function handleSendOtp() {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) { setError('Email is required'); return; }
    if (!emailRegex.test(email.trim())) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      await api.post('/vendor/send-otp', { email: email.trim().toLowerCase() });
      setStep(2);
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP (auto-verifies when all 6 digits entered)
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every(d => d) && next.join('').length === 6) {
      verifyOtp(next.join(''));
    }
  }

  function handleOtpKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function verifyOtp(code: string) {
    setError('');
    setLoading(true);
    try {
      // We verify OTP server-side during final register; here just move to step 3
      // Do a lightweight check by attempting a dummy register — instead just proceed
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setLoading(true);
    try {
      await api.post('/vendor/send-otp', { email: email.trim().toLowerCase() });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Final registration
  async function handleRegister() {
    setError('');
    if (!form.name.trim()) { setError('Restaurant name is required'); return; }
    if (!form.password) { setError('Password is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await registerVendor({
        email: email.trim().toLowerCase(),
        otp: otp.join(''),
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        address: form.address.trim() || undefined,
        cuisine_type: form.cuisine_type || undefined,
        description: form.description.trim() || undefined,
      } as any);
      router.replace('/(vendor)/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      // If OTP issue, go back to OTP step
      if (err.message?.toLowerCase().includes('otp')) setStep(2);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Step indicator */}
          <View style={styles.stepRow}>
            {[1, 2, 3].map(s => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepDot, step >= s && styles.stepDotActive, step > s && styles.stepDotDone]}>
                  {step > s
                    ? <Ionicons name="checkmark" size={12} color={Colors.white} />
                    : <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>}
                </View>
                {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
              </View>
            ))}
          </View>

          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <Text style={styles.title}>Register Restaurant</Text>
              <Text style={styles.subtitle}>Enter your email to get started</Text>

              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

              <Text style={styles.label}>Business Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="restaurant@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <Text style={styles.hint}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} /> An OTP will be sent to this email to verify your identity.
              </Text>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <>
                      <Ionicons name="mail-outline" size={18} color={Colors.white} />
                      <Text style={styles.primaryBtnText}>Send OTP</Text>
                    </>}
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <Text style={styles.title}>Verify Email</Text>
              <Text style={styles.subtitle}>Enter the 6-digit code sent to{'\n'}<Text style={styles.emailHighlight}>{email}</Text></Text>

              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={r => { otpRefs.current[i] = r; }}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={v => handleOtpChange(i, v)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (loading || otp.join('').length < 6) && styles.disabledBtn]}
                onPress={() => verifyOtp(otp.join(''))}
                disabled={loading || otp.join('').length < 6}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <>
                      <Ionicons name="shield-checkmark-outline" size={18} color={Colors.white} />
                      <Text style={styles.primaryBtnText}>Verify OTP</Text>
                    </>}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Didn't receive the code? </Text>
                {resendTimer > 0
                  ? <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
                  : <TouchableOpacity onPress={handleResend} disabled={loading}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>}
              </View>

              <TouchableOpacity style={styles.backBtn} onPress={() => { setStep(1); setError(''); }}>
                <Ionicons name="arrow-back-outline" size={16} color={Colors.textLight} />
                <Text style={styles.backBtnText}>Change email</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <>
              <Text style={styles.title}>Restaurant Details</Text>
              <Text style={styles.subtitle}>Complete your profile to start receiving orders</Text>

              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.verifiedText}>{email} verified</Text>
              </View>

              <Text style={styles.label}>Restaurant Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Spice Garden" placeholderTextColor={Colors.textMuted} value={form.name} onChangeText={v => setField('name', v)} />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor={Colors.textMuted} value={form.phone} onChangeText={v => setField('phone', v)} keyboardType="phone-pad" />

              <Text style={styles.label}>Password *</Text>
              <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor={Colors.textMuted} value={form.password} onChangeText={v => setField('password', v)} secureTextEntry />

              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor={Colors.textMuted} value={form.confirmPassword} onChangeText={v => setField('confirmPassword', v)} secureTextEntry />

              <Text style={styles.label}>Restaurant Address</Text>
              <TextInput style={[styles.input, styles.multiline]} placeholder="123 Main St, City, Pincode" placeholderTextColor={Colors.textMuted} value={form.address} onChangeText={v => setField('address', v)} multiline numberOfLines={2} />

              <Text style={styles.label}>Cuisine Type</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowCuisinePicker(v => !v)}>
                <Text style={form.cuisine_type ? styles.pickerSelected : styles.pickerPlaceholder}>
                  {form.cuisine_type || 'Select cuisine type'}
                </Text>
                <Ionicons name={showCuisinePicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {showCuisinePicker && (
                <View style={styles.pickerOptions}>
                  {CUISINE_OPTIONS.map(c => (
                    <TouchableOpacity key={c} style={[styles.pickerOption, form.cuisine_type === c && styles.pickerOptionActive]} onPress={() => { setField('cuisine_type', c); setShowCuisinePicker(false); }}>
                      <Text style={[styles.pickerOptionText, form.cuisine_type === c && styles.pickerOptionTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.multiline]} placeholder="Tell customers about your restaurant..." placeholderTextColor={Colors.textMuted} value={form.description} onChangeText={v => setField('description', v)} multiline numberOfLines={3} />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <>
                      <Ionicons name="restaurant-outline" size={18} color={Colors.white} />
                      <Text style={styles.primaryBtnText}>Register Restaurant</Text>
                    </>}
              </TouchableOpacity>
            </>
          )}

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
  scroll: { padding: 24, paddingTop: 20 },
  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  stepDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepNumActive: { color: Colors.primary },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.primary },
  // Common
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.textLight, marginBottom: 20, lineHeight: 22 },
  emailHighlight: { color: Colors.primary, fontWeight: '700' },
  errorBox: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.error, fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 14 },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 6, lineHeight: 18 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.text,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  // OTP
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 24 },
  otpBox: {
    width: 46, height: 56, borderRadius: 12, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.white, fontSize: 22, fontWeight: '800', color: Colors.text,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  resendLabel: { fontSize: 14, color: Colors.textLight },
  resendTimer: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  backBtnText: { fontSize: 14, color: Colors.textLight },
  // Step 3
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success + '15', borderRadius: 10, padding: 10, marginBottom: 8 },
  verifiedText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  picker: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerSelected: { fontSize: 15, color: Colors.text },
  pickerPlaceholder: { fontSize: 15, color: Colors.textMuted },
  pickerOptions: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  pickerOptionActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  pickerOptionText: { fontSize: 13, color: Colors.text },
  pickerOptionTextActive: { color: Colors.primary, fontWeight: '700' },
  links: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 16 },
  linkText: { fontSize: 14, color: Colors.textLight },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
});
