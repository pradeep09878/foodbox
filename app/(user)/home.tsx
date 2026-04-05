import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import api from '@/services/api';
import VendorCard, { VendorItem } from '@/components/VendorCard';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

const CUISINES: { label: string; icon: string }[] = [
  { label: 'All',          icon: '🍽️' },
  { label: 'Indian',       icon: '🍛' },
  { label: 'Chinese',      icon: '🥡' },
  { label: 'Italian',      icon: '🍝' },
  { label: 'Fast Food',    icon: '🍔' },
  { label: 'Pizza',        icon: '🍕' },
  { label: 'Biryani',      icon: '🍚' },
  { label: 'South Indian', icon: '🥘' },
  { label: 'Continental',  icon: '🥗' },
  { label: 'Cafe',         icon: '☕' },
  { label: 'Desserts',     icon: '🍰' },
  { label: 'Seafood',      icon: '🦐' },
  { label: 'Burgers',      icon: '🍟' },
  { label: 'Sushi',        icon: '🍣' },
  { label: 'Mexican',      icon: '🌮' },
  { label: 'Healthy',      icon: '🥙' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState(CUISINES[0].label);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      locationRef.current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocationEnabled(true);
      // Reverse geocode to get area name
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (place) {
          const area = place.district || place.subregion || place.city || place.region || null;
          setLocationName(area);
        }
      } catch {}
    })();
  }, []);

  const fetchVendors = useCallback(async (q?: string, c?: string) => {
    try {
      const params: Record<string, string> = {};
      if (q && q.trim()) params.search = q.trim();
      if (c && c !== 'All') params.cuisine = c;
      if (locationRef.current) {
        params.lat = String(locationRef.current.lat);
        params.lng = String(locationRef.current.lng);
      }
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
  }, [search, cuisine, locationEnabled]);

  function onRefresh() {
    setRefreshing(true);
    fetchVendors(search, cuisine);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'}! 👋</Text>
            <Text style={styles.subGreeting}>What are you craving today?</Text>
          </View>
          <View style={styles.locationBadge}>
            <Ionicons name={locationEnabled ? 'location' : 'location-outline'} size={14} color={Colors.white} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationEnabled ? (locationName || 'Near you') : 'All areas'}
            </Text>
          </View>
        </View>

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
            key={c.label}
            style={[styles.chip, cuisine === c.label && styles.chipActive]}
            onPress={() => setCuisine(c.label)}
          >
            <Text style={styles.chipIcon}>{c.icon}</Text>
            <Text style={[styles.chipText, cuisine === c.label && styles.chipTextActive]}>{c.label}</Text>
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
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.white },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  locationText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
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
  chipsContainer: { maxHeight: 80, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 2,
    minWidth: 62,
  },
  chipActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  chipIcon: { fontSize: 20 },
  chipText: { fontSize: 11, color: Colors.textLight, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  list: { paddingTop: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textMuted },
});
