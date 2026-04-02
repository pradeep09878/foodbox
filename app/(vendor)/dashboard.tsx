import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Switch, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Colors, StatusColors } from '@/constants/Colors';

interface Stats {
  today_orders: number;
  today_revenue: number;
  pending_count: number;
}

interface DashboardOrder {
  id: number;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  status: string;
  created_at: string;
  items?: { name: string; quantity: number; price: number }[];
}

export default function DashboardScreen() {
  const { vendor, refreshVendor } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingOrders, setPendingOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(vendor?.is_open ?? true);
  const [togglingOpen, setTogglingOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/vendor/stats'),
        api.get('/vendor/orders', { params: { status: 'pending' } }),
      ]);
      setStats(statsRes.data);
      setPendingOrders(ordersRes.data.orders || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setIsOpen(vendor?.is_open ?? true); }, [vendor]);

  function onRefresh() { setRefreshing(true); loadData(); }

  async function handleToggleOpen() {
    setTogglingOpen(true);
    try {
      const res = await api.put('/vendor/toggle-open');
      setIsOpen(res.data.is_open);
      await refreshVendor();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setTogglingOpen(false);
    }
  }

  async function handleUpdateStatus(orderId: number, status: string) {
    try {
      await api.put(`/vendor/orders/${orderId}/status`, { status });
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  function renderOrderItem({ item }: { item: DashboardOrder }) {
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderCardHeader}>
          <View>
            <Text style={styles.orderNum}>Order #{item.id}</Text>
            <Text style={styles.orderCustomer}>{item.customer_name}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: (StatusColors[item.status] || Colors.textMuted) + '22' }]}>
            <Text style={[styles.statusPillText, { color: StatusColors[item.status] || Colors.textMuted }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        {item.items && (
          <Text style={styles.orderItems} numberOfLines={2}>
            {item.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
          </Text>
        )}
        <View style={styles.orderCardFooter}>
          <Text style={styles.orderTotal}>₹{item.total_amount.toFixed(2)}</Text>
          <View style={styles.actionBtns}>
            {item.status === 'pending' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(item.id, 'confirmed')}>
                <Text style={styles.actionBtnText}>Confirm</Text>
              </TouchableOpacity>
            )}
            {item.status === 'confirmed' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.info }]} onPress={() => handleUpdateStatus(item.id, 'preparing')}>
                <Text style={styles.actionBtnText}>Preparing</Text>
              </TouchableOpacity>
            )}
            {item.status === 'preparing' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleUpdateStatus(item.id, 'ready')}>
                <Text style={styles.actionBtnText}>Ready</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcome}>Welcome back!</Text>
            <Text style={styles.vendorName}>{vendor?.name || 'Restaurant'}</Text>
          </View>
          <View style={styles.openToggle}>
            <Text style={styles.openLabel}>{isOpen ? 'OPEN' : 'CLOSED'}</Text>
            {togglingOpen ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Switch
                value={isOpen}
                onValueChange={handleToggleOpen}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.8)' }}
                thumbColor={Colors.white}
              />
            )}
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={pendingOrders}
          keyExtractor={item => String(item.id)}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <View>
              {/* Stats */}
              {stats && (
                <View style={styles.statsRow}>
                  <View style={[styles.statCard, { backgroundColor: Colors.primary + '15' }]}>
                    <Ionicons name="receipt-outline" size={24} color={Colors.primary} />
                    <Text style={styles.statValue}>{stats.today_orders}</Text>
                    <Text style={styles.statLabel}>Today's Orders</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: Colors.success + '15' }]}>
                    <Ionicons name="cash-outline" size={24} color={Colors.success} />
                    <Text style={[styles.statValue, { color: Colors.success }]}>₹{stats.today_revenue.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>Today's Revenue</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: Colors.warning + '15' }]}>
                    <Ionicons name="time-outline" size={24} color={Colors.warning} />
                    <Text style={[styles.statValue, { color: Colors.warning }]}>{stats.pending_count}</Text>
                    <Text style={styles.statLabel}>Active Orders</Text>
                  </View>
                </View>
              )}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pending Orders</Text>
                <Text style={styles.sectionCount}>{pendingOrders.length}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>No pending orders</Text>
              <Text style={styles.emptySubText}>All caught up!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { padding: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  vendorName: { fontSize: 22, fontWeight: '800', color: Colors.white },
  openToggle: { alignItems: 'center', gap: 4 },
  openLabel: { fontSize: 11, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 24 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textLight, textAlign: 'center', fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  sectionCount: { fontSize: 13, color: Colors.white, backgroundColor: Colors.primary, width: 22, height: 22, borderRadius: 11, textAlign: 'center', lineHeight: 22, fontWeight: '700' },
  orderCard: { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderNum: { fontSize: 15, fontWeight: '700', color: Colors.text },
  orderCustomer: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  orderItems: { fontSize: 13, color: Colors.textMuted, marginBottom: 10 },
  orderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontSize: 16, fontWeight: '800', color: Colors.text },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  actionBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textMuted },
});
