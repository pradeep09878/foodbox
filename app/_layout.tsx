import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Colors } from '@/constants/Colors';

function RootNavigator() {
  const { authType, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inUserGroup = segments[0] === '(user)';
    const inVendorGroup = segments[0] === '(vendor)';

    if (authType === 'user' && !inUserGroup) {
      router.replace('/(user)/home');
    } else if (authType === 'vendor' && !inVendorGroup) {
      router.replace('/(vendor)/dashboard');
    } else if (!authType && !inAuthGroup && segments[0] !== undefined && segments[0] !== 'index') {
      router.replace('/');
    }
  }, [authType, loading]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(vendor)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
