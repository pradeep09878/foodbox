import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, Modal, TouchableOpacity, ScrollView, Alert, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import OrderCard, { Order } from '@/components/OrderCard';
import ModalHeader, { modalSharedStyles } from '@/components/ModalHeader';
import { useCart } from '@/context/CartContext';
import { Colors, StatusColors } from '@/constants/Colors';

export default function OrdersScreen() {
  const router = useRouter();
  const { addItem, clearCart, fetchCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const ratingOrderRef = useRef<Order | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<number>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
      setReviewedOrderIds(new Set());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchOrders();
  }

  async function handleCancel(orderId: number) {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          setCancelling(true);
          try {
            await api.put(`/orders/${orderId}/cancel`);
            setSelected(null);
            fetchOrders();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  async function handleReorder(order: Order) {
    if (!order.items || order.items.length === 0) return;
    Alert.alert('Reorder', 'Add all items from this order to your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reorder', onPress: async () => {
          setReordering(true);
          try {
            await clearCart();
            await Promise.all(
              order.items!.map(item =>
                addItem((item as any).item_id || (item as any).id, item.quantity)
              )
            );
            await fetchCart();
            setSelected(null);
            router.push('/(user)/cart');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not reorder. Some items may be unavailable.');
          } finally {
            setReordering(false);
          }
        },
      },
    ]);
  }

  function openRatingModal(order: Order) {
    ratingOrderRef.current = order;
    setStarRating(0);
    setRatingComment('');
    setRatingModalVisible(true);
  }

  async function handleSubmitRating() {
    if (starRating === 0) {
      Alert.alert('Select Rating', 'Please select a star rating before submitting.');
      return;
    }
    const ratingOrder = ratingOrderRef.current;
    if (!ratingOrder) return;
    setSubmittingRating(true);
    try {
      await api.post('/reviews', {
        order_id: ratingOrder.id,
        rating: starRating,
        comment: ratingComment.trim() || undefined,
      });
      setReviewedOrderIds(prev => new Set([...prev, ratingOrder.id]));
      setRatingModalVisible(false);
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmittingRating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => setSelected(item)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubText}>Your order history will appear here</Text>
            </View>
          }
        />
      )}

      {/* Order detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={modalSharedStyles.overlay}>
          <View style={modalSharedStyles.content}>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <ModalHeader title={`Order #${selected.id}`} onClose={() => setSelected(null)} />

                <View style={[styles.statusBadge, { backgroundColor: (StatusColors[selected.status] || Colors.textMuted) + '22' }]}>
                  <Text style={[styles.statusText, { color: StatusColors[selected.status] || Colors.textMuted }]}>
                    {selected.status.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.detailLabel}>Restaurant</Text>
                <Text style={styles.detailValue}>{selected.vendor_name}</Text>

                <Text style={styles.detailLabel}>Delivery Address</Text>
                <Text style={styles.detailValue}>{(selected as any).delivery_address || 'N/A'}</Text>

                {selected.items && selected.items.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>Items</Text>
                    {selected.items.map((item, i) => (
                      <View key={i} style={styles.itemRow}>
                        <Text style={styles.itemRowName}>{item.name} x{item.quantity}</Text>
                        <Text style={styles.itemRowPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                      </View>
                    ))}
                  </>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{selected.total_amount.toFixed(2)}</Text>
                </View>

                <View style={styles.actionRow}>
                  {selected.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={() => handleCancel(selected.id)}
                      disabled={cancelling}
                    >
                      {cancelling
                        ? <ActivityIndicator size="small" color={Colors.error} />
                        : <Text style={styles.cancelBtnText}>Cancel Order</Text>}
                    </TouchableOpacity>
                  )}

                  {selected.status === 'delivered' && !reviewedOrderIds.has(selected.id) && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rateBtn]}
                      onPress={() => { setSelected(null); openRatingModal(selected); }}
                    >
                      <Ionicons name="star" size={15} color={Colors.warning} />
                      <Text style={styles.rateBtnText}>Rate Order</Text>
                    </TouchableOpacity>
                  )}

                  {(selected.status === 'delivered' || selected.status === 'cancelled') && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.reorderBtn]}
                      onPress={() => handleReorder(selected)}
                      disabled={reordering}
                    >
                      {reordering ? <ActivityIndicator size="small" color={Colors.white} /> : (
                        <>
                          <Ionicons name="refresh" size={15} color={Colors.white} />
                          <Text style={styles.reorderBtnText}>Reorder</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Rating modal */}
      <Modal visible={ratingModalVisible} animationType="slide" transparent onRequestClose={() => setRatingModalVisible(false)}>
        <View style={modalSharedStyles.overlay}>
          <View style={modalSharedStyles.content}>
            <ModalHeader title="Rate Your Order" onClose={() => setRatingModalVisible(false)} />

            {ratingOrderRef.current && (
              <Text style={styles.rateSubtitle}>From {ratingOrderRef.current.vendor_name}</Text>
            )}

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setStarRating(star)} style={styles.starBtn}>
                  <Ionicons
                    name={star <= starRating ? 'star' : 'star-outline'}
                    size={38}
                    color={star <= starRating ? Colors.warning : Colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {starRating > 0 && (
              <Text style={styles.ratingLabel}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][starRating]}
              </Text>
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience (optional)..."
              placeholderTextColor={Colors.textMuted}
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitRatingBtn, submittingRating && { opacity: 0.7 }]}
              onPress={handleSubmitRating}
              disabled={submittingRating}
            >
              {submittingRating
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.submitRatingText}>Submit Review</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textMuted },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '700' },
  detailLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: Colors.text, marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemRowName: { fontSize: 14, color: Colors.text },
  itemRowPrice: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 14, paddingTop: 14 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 110, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  cancelBtn: { borderWidth: 1.5, borderColor: Colors.error, backgroundColor: Colors.error + '10' },
  cancelBtnText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  rateBtn: { borderWidth: 1.5, borderColor: Colors.warning, backgroundColor: Colors.warning + '15' },
  rateBtnText: { color: Colors.warning, fontWeight: '700', fontSize: 14 },
  reorderBtn: { backgroundColor: Colors.primary },
  reorderBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  // Rating modal
  rateSubtitle: { fontSize: 14, color: Colors.textLight, marginBottom: 20, marginTop: -8 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  starBtn: { padding: 4 },
  ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: Colors.warning, marginBottom: 16 },
  commentInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    padding: 12, fontSize: 14, color: Colors.text,
    textAlignVertical: 'top', minHeight: 80, marginBottom: 16,
  },
  submitRatingBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  submitRatingText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
