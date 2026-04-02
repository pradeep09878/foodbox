import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import VendorCard, { VendorItem } from '@/components/VendorCard';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

const CUISINES = ['All', 'Indian', 'Chinese', 'Italian', 'Fast Food', 'Pizza', 'Biryani', 'South Indian', 'Continental', 'Cafe'];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');

  const fetchVendors = useCallback(async (q?: string, c?: string) => {
    try {
      const params: Record<string, string> = {};
      if (q && q.trim()) params.search = q.trim();
      if (c && c !== 'All') params.cuisine = c;
      const res = await api.get('/user/vendors', { params });
      setVendors(res.data.vendors || []);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors(search, cuisine);
  }, [search, cuisine]);

  function onRefresh() {
    setRefreshing(true);
    fetchVendors(search, cuisine);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'}! 👋</Text>
        <Text style={styles.subGreeting}>What are you craving today?</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsContainer}
      >
        {CUISINES.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, cuisine === c && styles.chipActive]}
            onPress={() => setCuisine(c)}
          >
            <Text style={[styles.chipText, cuisine === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              onPress={() => router.push(`/(user)/restaurant/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyText}>No restaurants found</Text>
              <Text style={styles.emptySubText}>Try a different search or filter</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.white },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, padding: 0 },
  chipsContainer: { maxHeight: 52, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  chipTextActive: { color: Colors.white },
  list: { paddingTop: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textMuted },
});
