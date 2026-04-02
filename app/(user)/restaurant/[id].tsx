import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { VendorItem } from '@/components/VendorCard';
import MenuItemCard, { MenuItem } from '@/components/MenuItemCard';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/Colors';

interface Category {
  id: number;
  name: string;
}

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items: cartItems, vendorId: cartVendorId, addItem, removeItem, clearCart, total } = useCart();

  const [vendor, setVendor] = useState<VendorItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [vendorRes, menuRes] = await Promise.all([
        api.get(`/user/vendors/${id}`),
        api.get(`/menu/${id}`),
      ]);
      setVendor(vendorRes.data.vendor);
      const cats: Category[] = menuRes.data.categories || [];
      setCategories(cats);
      setMenuItems(menuRes.data.items || []);
      if (cats.length > 0) setSelectedCategory(cats[0].id);
      else setSelectedCategory(null);
    } catch {
      Alert.alert('Error', 'Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  }

  function getQuantity(itemId: number) {
    return cartItems.find(c => c.item_id === itemId)?.quantity ?? 0;
  }

  async function handleAdd(item: MenuItem) {
    if (cartVendorId && cartVendorId !== item.vendor_id) {
      Alert.alert(
        'Different Restaurant',
        'Your cart has items from another restaurant. Clear the cart and add this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Add', style: 'destructive',
            onPress: async () => {
              await clearCart();
              await addItem(item.id, 1);
            },
          },
        ]
      );
      return;
    }
    try {
      await addItem(item.id, getQuantity(item.id) + 1);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleRemove(item: MenuItem) {
    try {
      await removeItem(item.id);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  const filtered = selectedCategory
    ? menuItems.filter(i => i.category_id === selectedCategory)
    : menuItems.filter(i => !i.category_id);

  const noCategory = menuItems.filter(i => !i.category_id);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const cartItemCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const showCartBanner = cartVendorId === Number(id) && cartItemCount > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        {vendor && (
          <View style={styles.headerInfo}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <View style={styles.headerRow}>
              <Text style={styles.cuisine}>{vendor.cuisine_type || 'Restaurant'}</Text>
              <Text style={styles.dot}> • </Text>
              <Ionicons name="star" size={12} color={Colors.warning} />
              <Text style={styles.rating}> {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</Text>
              <Text style={styles.dot}> • </Text>
              <View style={[styles.openBadge, { backgroundColor: vendor.is_open ? Colors.success : Colors.error }]}>
                <Text style={styles.openText}>{vendor.is_open ? 'OPEN' : 'CLOSED'}</Text>
              </View>
            </View>
            {vendor.address ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.address} numberOfLines={1}>{vendor.address}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Category tabs */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs} contentContainerStyle={styles.categoryTabsContent}>
          {noCategory.length > 0 && (
            <TouchableOpacity
              style={[styles.catTab, selectedCategory === null && styles.catTabActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.catTabText, selectedCategory === null && styles.catTabTextActive]}>General</Text>
            </TouchableOpacity>
          )}
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catTab, selectedCategory === cat.id && styles.catTabActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.catTabText, selectedCategory === cat.id && styles.catTabTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Menu items */}
      <FlatList
        data={selectedCategory ? filtered : (categories.length === 0 ? menuItems : noCategory)}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            quantity={getQuantity(item.id)}
            onAdd={() => handleAdd(item)}
            onRemove={() => handleRemove(item)}
          />
        )}
        contentContainerStyle={styles.menuList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items in this category</Text>
          </View>
        }
      />

      {/* Floating View Cart button */}
      {showCartBanner && (
        <TouchableOpacity style={styles.cartBanner} onPress={() => router.push('/(user)/cart')}>
          <View style={styles.cartBannerLeft}>
            <Text style={styles.cartBannerCount}>{cartItemCount} item{cartItemCount > 1 ? 's' : ''}</Text>
            <Text style={styles.cartBannerVendor}>View Cart</Text>
          </View>
          <Text style={styles.cartBannerTotal}>₹{total.toFixed(2)}</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  backBtn: { padding: 4, marginTop: 2 },
  headerInfo: { flex: 1, gap: 3 },
  vendorName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  headerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cuisine: { fontSize: 13, color: Colors.textLight },
  dot: { color: Colors.textMuted },
  rating: { fontSize: 13, color: Colors.textLight },
  openBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  openText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  address: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  categoryTabs: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 48 },
  categoryTabsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  catTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  catTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catTabText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  catTabTextActive: { color: Colors.white },
  menuList: { paddingBottom: 100 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  cartBanner: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBannerLeft: { flex: 1 },
  cartBannerCount: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  cartBannerVendor: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  cartBannerTotal: { color: Colors.white, fontSize: 16, fontWeight: '700', marginRight: 8 },
});
