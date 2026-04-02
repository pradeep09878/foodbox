import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export interface VendorItem {
  id: number;
  name: string;
  cuisine_type?: string;
  rating: number;
  address?: string;
  logo?: string;
  is_open: boolean;
  description?: string;
}

interface Props {
  vendor: VendorItem;
  onPress: () => void;
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= Math.round(rating) ? 'star' : 'star-outline'}
        size={12}
        color={Colors.warning}
      />
    );
  }
  return <View style={{ flexDirection: 'row', gap: 1 }}>{stars}</View>;
}

export default function VendorCard({ vendor, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        {vendor.logo ? (
          <Image source={{ uri: vendor.logo }} style={styles.logo} resizeMode="cover" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
        )}
        <View style={[styles.badge, vendor.is_open ? styles.openBadge : styles.closedBadge]}>
          <Text style={styles.badgeText}>{vendor.is_open ? 'OPEN' : 'CLOSED'}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{vendor.name}</Text>
        <Text style={styles.cuisine} numberOfLines={1}>{vendor.cuisine_type || 'Restaurant'}</Text>
        <View style={styles.row}>
          <StarRating rating={vendor.rating} />
          <Text style={styles.ratingText}>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</Text>
        </View>
        {vendor.address ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.address} numberOfLines={1}>{vendor.address}</Text>
          </View>
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
  imageContainer: {
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: 150,
  },
  logoPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#FFF3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 48,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  openBadge: {
    backgroundColor: Colors.success,
  },
  closedBadge: {
    backgroundColor: Colors.error,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  info: {
    padding: 14,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  cuisine: {
    fontSize: 13,
    color: Colors.textLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  address: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
});
