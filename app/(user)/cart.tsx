import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/Colors';

const DELIVERY_FEE = 30;

export default function CartScreen() {
  const router = useRouter();
  const { items, total, vendorId, addItem, removeItem, clearCart, fetchCart } = useCart();
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  async function handlePlaceOrder() {
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter your delivery address.');
      return;
    }
    if (!vendorId) return;

    setPlacingOrder(true);
    try {
      await api.post('/orders', {
        vendor_id: vendorId,
        delivery_address: address.trim(),
        special_instructions: instructions.trim() || undefined,
      });
      await fetchCart();
      Alert.alert('Order Placed!', 'Your order has been placed successfully.', [
        { text: 'View Orders', onPress: () => router.replace('/(user)/orders') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubText}>Browse restaurants and add items to get started</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(user)/home')}>
            <Text style={styles.browseBtnText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const vendorName = items[0]?.vendor_name || 'Restaurant';
  const grandTotal = total + DELIVERY_FEE;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerSubtitle}>{vendorName}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Cart items */}
          {items.map(item => (
            <View key={item.item_id} style={styles.cartItem}>
              <View style={styles.cartItemLeft}>
                <View style={[styles.vegDot, { backgroundColor: item.is_veg ? Colors.veg : Colors.nonVeg }]} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price.toFixed(2)} each</Text>
                </View>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qBtn} onPress={() => removeItem(item.item_id)}>
                  <Ionicons name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qBtn} onPress={() => addItem(item.item_id, item.quantity + 1)}>
                  <Ionicons name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.clearBtn} onPress={() => {
            Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ]);
          }}>
            <Ionicons name="trash-outline" size={15} color={Colors.error} />
            <Text style={styles.clearBtnText}>Clear Cart</Text>
          </TouchableOpacity>

          {/* Delivery address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Enter your full delivery address..."
              placeholderTextColor={Colors.textMuted}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Special instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g. No onions, extra spicy..."
              placeholderTextColor={Colors.textMuted}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Order summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹{DELIVERY_FEE.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Place order button */}
          <TouchableOpacity
            style={[styles.orderBtn, placingOrder && styles.disabledBtn]}
            onPress={handlePlaceOrder}
            disabled={placingOrder}
          >
            {placingOrder ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.orderBtnText}>Place Order</Text>
                <Text style={styles.orderBtnAmount}>₹{grandTotal.toFixed(2)}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  browseBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16, gap: 0, paddingBottom: 40 },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cartItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  vegDot: { width: 10, height: 10, borderRadius: 5 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  itemPrice: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8, overflow: 'hidden', marginHorizontal: 10 },
  qBtn: { paddingHorizontal: 8, paddingVertical: 5 },
  qText: { fontSize: 14, fontWeight: '700', color: Colors.primary, paddingHorizontal: 6 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: Colors.text, minWidth: 60, textAlign: 'right' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, justifyContent: 'flex-end' },
  clearBtnText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  section: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginTop: 12, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  optional: { color: Colors.textMuted, fontWeight: '400', fontSize: 13 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
  },
  multilineInput: { textAlignVertical: 'top', minHeight: 70 },
  summary: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginTop: 12, gap: 10 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: Colors.textLight },
  summaryValue: { fontSize: 14, color: Colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  orderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledBtn: { opacity: 0.7 },
  orderBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  orderBtnAmount: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
