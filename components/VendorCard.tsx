import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getFileUrl } from '@/services/api';

export interface VendorItem {
  id: number;
  name: string;
  cuisine_type?: string;
  rating: number;
  address?: string;
  logo?: string;
  is_open: boolean;
  description?: string;
  distance_km?: number;
}

interface Props {
  vendor: VendorItem;
  onPress: () => void;
}

// Cuisine → emoji + gradient colors
const CUISINE_THEME: Record<string, { icon: string; colors: [string, string] }> = {
  indian:       { icon: '🍛', colors: ['#FF8C00', '#FF5722'] },
  chinese:      { icon: '🥡', colors: ['#E53935', '#B71C1C'] },
  italian:      { icon: '🍝', colors: ['#43A047', '#1B5E20'] },
  'fast food':  { icon: '🍔', colors: ['#FB8C00', '#E65100'] },
  pizza:        { icon: '🍕', colors: ['#F4511E', '#BF360C'] },
  biryani:      { icon: '🍚', colors: ['#8D6E63', '#4E342E'] },
  'south indian': { icon: '🥘', colors: ['#FF7043', '#BF360C'] },
  continental:  { icon: '🥗', colors: ['#26A69A', '#00695C'] },
  cafe:         { icon: '☕', colors: ['#6D4C41', '#3E2723'] },
  desserts:     { icon: '🍰', colors: ['#EC407A', '#880E4F'] },
  seafood:      { icon: '🦐', colors: ['#0288D1', '#01579B'] },
  burgers:      { icon: '🍟', colors: ['#FFA000', '#E65100'] },
  sushi:        { icon: '🍣', colors: ['#D32F2F', '#B71C1C'] },
  mexican:      { icon: '🌮', colors: ['#F57F17', '#E65100'] },
  healthy:      { icon: '🥙', colors: ['#558B2F', '#1B5E20'] },
};

function getCuisineTheme(cuisine?: string) {
  if (!cuisine) return { icon: '🍽️', colors: ['#FF6B35', '#E55A24'] as [string, string] };
  const key = cuisine.toLowerCase();
  for (const k of Object.keys(CUISINE_THEME)) {
    if (key.includes(k)) return CUISINE_THEME[k];
  }
  return { icon: '🍽️', colors: ['#FF6B35', '#E55A24'] as [string, string] };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={12} color={Colors.warning} />
      ))}
    </View>
  );
}

export default function VendorCard({ vendor, onPress }: Props) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getFileUrl(vendor.logo);
  const theme = getCuisineTheme(vendor.cuisine_type);
  const showImage = imageUrl && !imgError;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        {showImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.logo}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          // Gradient-style placeholder using cuisine colors
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors[0] }]}>
            <View style={[styles.placeholderOverlay, { backgroundColor: theme.colors[1] }]} />
            <Text style={styles.placeholderIcon}>{theme.icon}</Text>
            <Text style={styles.placeholderName} numberOfLines={1}>{vendor.name}</Text>
          </View>
        )}

        {/* OPEN/CLOSED badge */}
        <View style={[styles.badge, vendor.is_open ? styles.openBadge : styles.closedBadge]}>
          <Text style={styles.badgeText}>{vendor.is_open ? 'OPEN' : 'CLOSED'}</Text>
        </View>

        {/* Cuisine chip on image */}
        {vendor.cuisine_type && (
          <View style={styles.cuisineChip}>
            <Text style={styles.cuisineChipText}>{theme.icon} {vendor.cuisine_type}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{vendor.name}</Text>
        <View style={styles.row}>
          <StarRating rating={vendor.rating} />
          <Text style={styles.ratingText}>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</Text>
          {vendor.distance_km != null && (
            <>
              <Text style={styles.dot}>•</Text>
              <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.distanceText}>
                {vendor.distance_km < 1
                  ? `${(vendor.distance_km * 1000).toFixed(0)} m`
                  : `${vendor.distance_km.toFixed(1)} km`}
              </Text>
            </>
          )}
        </View>
        {vendor.address && vendor.distance_km == null && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.address} numberOfLines={1}>{vendor.address}</Text>
          </View>
        )}
        {vendor.description ? (
          <Text style={styles.description} numberOfLines={1}>{vendor.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: { position: 'relative' },
  logo: { width: '100%', height: 160 },
  logoPlaceholder: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  placeholderIcon: { fontSize: 52 },
  placeholderName: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)', paddingHorizontal: 16 },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  openBadge: { backgroundColor: Colors.success },
  closedBadge: { backgroundColor: Colors.error },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cuisineChip: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cuisineChipText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  info: { padding: 14, gap: 4 },
  name: { fontSize: 17, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  dot: { fontSize: 10, color: Colors.textMuted },
  distanceText: { fontSize: 12, color: Colors.textMuted },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  address: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  description: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
