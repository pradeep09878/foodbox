import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getFileUrl } from '@/services/api';

export interface MenuItem {
  id: number;
  vendor_id: number;
  category_id?: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  is_available: boolean;
  is_veg: boolean;
}

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function MenuItemCard({ item, quantity, onAdd, onRemove }: Props) {
  return (
    <View style={[styles.card, !item.is_available && styles.unavailable]}>
      <View style={styles.left}>
        <View style={styles.vegRow}>
          <View style={[styles.vegBadge, { borderColor: item.is_veg ? Colors.veg : Colors.nonVeg }]}>
            <View style={[styles.vegDot, { backgroundColor: item.is_veg ? Colors.veg : Colors.nonVeg }]} />
          </View>
          {!item.is_available && (
            <Text style={styles.unavailableLabel}>Unavailable</Text>
          )}
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {item.image ? (
          <Image source={{ uri: getFileUrl(item.image) }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 28 }}>🍛</Text>
          </View>
        )}
        {item.is_available && (
          quantity > 0 ? (
            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.qBtn} onPress={onRemove}>
                <Ionicons name="remove" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qText}>{quantity}</Text>
              <TouchableOpacity style={styles.qBtn} onPress={onAdd}>
                <Ionicons name="add" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
              <Text style={styles.addBtnText}>ADD</Text>
              <Ionicons name="add" size={14} color={Colors.primary} />
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  unavailable: {
    opacity: 0.5,
  },
  left: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  vegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegBadge: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unavailableLabel: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  description: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  right: {
    alignItems: 'center',
    gap: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#FFF3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 2,
    backgroundColor: Colors.white,
  },
  addBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  qBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: Colors.white,
  },
  qText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    paddingHorizontal: 8,
  },
});
