import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { Colors, StatusColors } from '@/constants/Colors';

interface VendorOrder {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  delivery_address: string;
  special_instructions?: string;
  created_at: string;
  customer_name: string;
  customer_phone?: string;
  items?: { name: string; quantity: number; price: number }[];
}

const FILTER_OPTIONS = ['All', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const STATUS_TRANSITIONS: Record<string, string | null> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
  delivered: null,
  cancelled: null,
};

const STATUS_BUTTON_LABELS: Record<string, string> = {
  pending: 'Confirm',
  confirmed: 'Mark Preparing',
  preparing: 'Mark Ready',
  ready: 'Mark Delivered',
};

export default function VendorOrdersScreen() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (f?: string) => {
    try {
      const params: Record<string, string> = {};
      if (f && f !== 'All') params.status = f;
      const res = await api.get('/vendor/orders', { params });
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(filter); }, [filter]);

  function onRefresh() { setRefreshing(true); fetchOrders(filter); }

  async function handleUpdateStatus(order: VendorOrder, newStatus: string) {
    try {
      await api.put(`/vendor/orders/${order.id}/status`, { status: newStatus });
      fetchOrders(filter);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  function renderOrder({ item }: { item: VendorOrder }) {
    const nextStatus = STATUS_TRANSITIONS[item.status];
    const btnLabel = STATUS_BUTTON_LABELS[item.status];
    const statusColor = StatusColors[item.status] || Colors.textMuted;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderTime}>{formatDate(item.created_at)} at {formatTime(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <Ionicons name="person-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.customerName}>{item.customer_name}</Text>
          {item.customer_phone ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.customerPhone}>{item.customer_phone}</Text>
            </>
          ) : null}
        </View>

        {item.items && item.items.length > 0 && (
          <View style={styles.itemsList}>
            {item.items.map((oi, i) => (
              <View key={i} style={styles.orderItemRow}>
                <Text style={styles.orderItemName}>{oi.name} x{oi.quantity}</Text>
                <Text style={styles.orderItemPrice}>₹{(oi.price * oi.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {item.delivery_address ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={2}>{item.delivery_address}</Text>
          </View>
        ) : null}

        {item.special_instructions ? (
          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.info} />
            <Text style={styles.noteText} numberOfLines={2}>{item.special_instructions}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardTotal}>Total: ₹{item.total_amount.toFixed(2)}</Text>
          <View style={styles.footerBtns}>
            {item.status !== 'cancelled' && item.status !== 'delivered' && (
              <TouchableOpacity
                style={styles.cancelOrderBtn}
                onPress={() => Alert.alert('Cancel Order', 'Cancel this order?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleUpdateStatus(item, 'cancelled') },
                ])}
              >
                <Text style={styles.cancelOrderBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
            {nextStatus && btnLabel && (
              <TouchableOpacity
                style={[styles.statusBtn, { backgroundColor: StatusColors[nextStatus] || Colors.primary }]}
                onPress={() => handleUpdateStatus(item, nextStatus)}
              >
                <Text style={styles.statusBtnText}>{btnLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        {FILTER_OPTIONS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  filtersScroll: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 52 },
  filtersContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  filterChipTextActive: { color: Colors.white },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: '800', color: Colors.text },
  orderTime: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  customerName: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  dot: { color: Colors.textMuted },
  customerPhone: { fontSize: 13, color: Colors.textLight },
  itemsList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginBottom: 8, gap: 4 },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orderItemName: { fontSize: 13, color: Colors.text },
  orderItemPrice: { fontSize: 13, color: Colors.textLight },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 6 },
  addressText: { fontSize: 13, color: Colors.textMuted, flex: 1 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 6 },
  noteText: { fontSize: 13, color: Colors.info, flex: 1, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 },
  cardTotal: { fontSize: 16, fontWeight: '800', color: Colors.text },
  footerBtns: { flexDirection: 'row', gap: 8 },
  cancelOrderBtn: { borderWidth: 1.5, borderColor: Colors.error, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  cancelOrderBtnText: { fontSize: 13, color: Colors.error, fontWeight: '700' },
  statusBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  statusBtnText: { fontSize: 13, color: Colors.white, fontWeight: '700' },
  empty: { padding: 60, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
});
