import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusColors } from '@/constants/Colors';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  vendor_id?: number;
  vendor_name?: string;
  customer_name?: string;
  total_amount: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

interface Props {
  order: Order;
  onPress?: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrderCard({ order, onPress }: Props) {
  const statusColor = StatusColors[order.status] || Colors.textMuted;
  const itemsCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const label = order.vendor_name || order.customer_name || '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          {label ? <Text style={styles.vendorName}>{label}</Text> : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{order.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Ionicons name="receipt-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.infoText}>{itemsCount} item{itemsCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.dot}>•</Text>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.infoText}>{formatDate(order.created_at)}</Text>
        </View>
        <Text style={styles.total}>₹{order.total_amount.toFixed(2)}</Text>
      </View>
      {order.items && order.items.length > 0 && (
        <Text style={styles.itemsSummary} numberOfLines={1}>
          {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  vendorName: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  infoText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dot: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemsSummary: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
