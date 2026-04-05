import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { Colors } from '@/constants/Colors';

interface DailyData {
  day: string;
  order_count: number;
  revenue: number;
}

interface Totals {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

interface TopItem {
  name: string;
  total_qty: number;
  revenue: number;
}

export default function AnalyticsScreen() {
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/vendor/analytics');
      setDaily(res.data.daily || []);
      setTotals(res.data.totals || null);
      setTopItems(res.data.top_items || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  function onRefresh() { setRefreshing(true); loadData(); }

  const weekData = useMemo<DailyData[]>(() => {
    const days: DailyData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = daily.find(r => r.day.slice(0, 10) === key);
      days.push(found ?? { day: key, order_count: 0, revenue: 0 });
    }
    return days;
  }, [daily]);

  const maxRevenue = useMemo(
    () => Math.max(...weekData.map(d => d.revenue), 1),
    [weekData],
  );

  function formatDay(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.headerTitle}>Analytics</Text></View>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
      >
        {/* All-time summary cards */}
        {totals && (
          <View style={styles.cardsRow}>
            <View style={[styles.summaryCard, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
              <Text style={[styles.cardValue, { color: Colors.primary }]}>{totals.total_orders}</Text>
              <Text style={styles.cardLabel}>Total Orders</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: Colors.success + '15' }]}>
              <Ionicons name="cash-outline" size={22} color={Colors.success} />
              <Text style={[styles.cardValue, { color: Colors.success }]}>₹{totals.total_revenue.toFixed(0)}</Text>
              <Text style={styles.cardLabel}>Total Revenue</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: Colors.info + '15' }]}>
              <Ionicons name="trending-up-outline" size={22} color={Colors.info} />
              <Text style={[styles.cardValue, { color: Colors.info }]}>₹{totals.avg_order_value.toFixed(0)}</Text>
              <Text style={styles.cardLabel}>Avg Order</Text>
            </View>
          </View>
        )}

        {/* 7-day revenue bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 Days Revenue</Text>
          <View style={styles.barChart}>
            {weekData.map((d, i) => {
              const barH = maxRevenue > 0 ? Math.max(4, (d.revenue / maxRevenue) * 100) : 4;
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValue}>
                    {d.revenue > 0 ? `₹${d.revenue.toFixed(0)}` : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: barH, backgroundColor: d.revenue > 0 ? Colors.primary : Colors.border }]} />
                  </View>
                  <Text style={styles.barLabel}>{formatDay(d.day)}</Text>
                  <Text style={styles.barOrders}>{d.order_count > 0 ? `${d.order_count}` : ''}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Bar height = revenue · Number below bar = orders</Text>
          </View>
        </View>

        {/* Top items */}
        {topItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Selling Items</Text>
            {topItems.map((item, i) => (
              <View key={i} style={styles.topItemRow}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemSub}>{item.total_qty} sold</Text>
                </View>
                <Text style={styles.topItemRevenue}>₹{item.revenue.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}

        {topItems.length === 0 && daily.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubText}>Analytics will appear once you receive orders</Text>
          </View>
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },
  cardsRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  cardValue: { fontSize: 18, fontWeight: '800' },
  cardLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '600', textAlign: 'center' },
  section: { backgroundColor: Colors.white, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  // Bar chart
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: Colors.primary, fontWeight: '700', textAlign: 'center', minHeight: 14 },
  barTrack: { width: '80%', height: 100, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  barOrders: { fontSize: 10, color: Colors.textLight, fontWeight: '700', minHeight: 14 },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  legendText: { fontSize: 11, color: Colors.textMuted },
  // Top items
  topItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  topItemRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  topItemRankText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  topItemName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  topItemSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  topItemRevenue: { fontSize: 14, fontWeight: '700', color: Colors.success },
  // Empty
  empty: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
