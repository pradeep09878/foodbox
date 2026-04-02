import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

const { height } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.hero}
      >
        <SafeAreaView style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍱</Text>
            <Text style={styles.logoText}>FoodBox</Text>
            <Text style={styles.tagline}>Delicious food, delivered fast</Text>
          </View>
          <View style={styles.decorRow}>
            <Text style={styles.decorEmoji}>🍕</Text>
            <Text style={styles.decorEmoji}>🍔</Text>
            <Text style={styles.decorEmoji}>🍜</Text>
            <Text style={styles.decorEmoji}>🥗</Text>
            <Text style={styles.decorEmoji}>🍣</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.bottom}>
        <Text style={styles.selectLabel}>How would you like to continue?</Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>🛵  Order as Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.push('/(auth)/vendor-login')}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>🏪  I'm a Vendor / Restaurant</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          By continuing, you agree to our Terms & Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  hero: {
    height: height * 0.55,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  decorRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  decorEmoji: {
    fontSize: 28,
  },
  bottom: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    gap: 14,
  },
  selectLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  outlineBtn: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
