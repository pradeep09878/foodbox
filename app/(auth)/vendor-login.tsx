import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

export default function VendorLoginScreen() {
  const router = useRouter();
  const { loginVendor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginVendor(email.trim().toLowerCase(), password);
      router.replace('/(vendor)/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.emoji}>🏪</Text>
            <Text style={styles.title}>Vendor Login</Text>
            <Text style={styles.subtitle}>Manage your restaurant on FoodBox</Text>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="restaurant@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.loginBtnText}>Login as Vendor</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.links}>
            <Text style={styles.linkText}>New restaurant? </Text>
            <Link href="/(auth)/vendor-register" asChild>
              <TouchableOpacity><Text style={styles.link}>Register here</Text></TouchableOpacity>
            </Link>
          </View>

          <View style={styles.links}>
            <Text style={styles.linkText}>Are you a customer? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={styles.link}>User Login</Text></TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 32 },
  header: { marginBottom: 28, alignItems: 'center' },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textLight, marginTop: 4 },
  errorBox: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.error, fontSize: 14 },
  form: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eyeBtn: { padding: 13, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12 },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: { opacity: 0.7 },
  loginBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  links: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  linkText: { fontSize: 14, color: Colors.textLight },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
});
