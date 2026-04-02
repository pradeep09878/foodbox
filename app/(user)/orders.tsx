import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, Modal, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import OrderCard, { Order } from '@/components/OrderCard';
import { Colors, StatusColors } from '@/constants/Colors';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selected && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Order #{selected.id}</Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

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
              </ScrollView>
            )}
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
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
});
