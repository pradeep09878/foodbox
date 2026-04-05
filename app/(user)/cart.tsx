import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '@/services/api';
import ModalHeader, { modalSharedStyles } from '@/components/ModalHeader';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/Colors';

const DELIVERY_FEE = 30;

interface SavedAddress {
  id: number;
  label?: string;
  address_line: string;
  city?: string;
  pincode?: string;
}

interface AddressFields {
  house: string;
  street: string;
  landmark: string;
  city: string;
  pincode: string;
}

const EMPTY_ADDR: AddressFields = { house: '', street: '', landmark: '', city: '', pincode: '' };

function buildAddressString(f: AddressFields) {
  return [f.house, f.street, f.landmark, f.city, f.pincode].filter(Boolean).join(', ');
}

export default function CartScreen() {
  const router = useRouter();
  const { items, total, vendorId, addItem, removeItem, clearCart, fetchCart } = useCart();

  const [addrFields, setAddrFields] = useState<AddressFields>(EMPTY_ADDR);
  const [instructions, setInstructions] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressPickerVisible, setAddressPickerVisible] = useState(false);

  const [saveAddressModal, setSaveAddressModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await api.get('/user/addresses');
      setSavedAddresses(res.data.addresses || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (items.length > 0) loadAddresses();
  }, []);

  function setField(key: keyof AddressFields, value: string) {
    setAddrFields(f => ({ ...f, [key]: value }));
  }

  async function handleDetectLocation() {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow location access to auto-fill your address.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (place) {
        setAddrFields({
          house: addrFields.house, // keep what user typed
          street: [place.name, place.street].filter(Boolean).join(', '),
          landmark: place.district || place.subregion || '',
          city: place.city || place.region || '',
          pincode: place.postalCode || '',
        });
      }
    } catch {
      Alert.alert('Error', 'Could not detect location. Please fill in manually.');
    } finally {
      setDetectingLocation(false);
    }
  }

  function selectSavedAddress(addr: SavedAddress) {
    // Split saved address_line back into house + street best-effort
    const parts = addr.address_line.split(',').map(s => s.trim());
    setAddrFields({
      house: parts[0] || '',
      street: parts.slice(1).join(', ') || '',
      landmark: '',
      city: addr.city || '',
      pincode: addr.pincode || '',
    });
    setAddressPickerVisible(false);
  }

  async function handleSaveAddress() {
    const addressLine = [addrFields.house, addrFields.street, addrFields.landmark].filter(Boolean).join(', ');
    if (!addressLine) {
      Alert.alert('Enter address first', 'Fill in your address details before saving.');
      return;
    }
    setSavingAddress(true);
    try {
      const res = await api.post('/user/addresses', {
        label: saveLabel.trim() || undefined,
        address_line: addressLine,
        city: addrFields.city || undefined,
        pincode: addrFields.pincode || undefined,
      });
      setSavedAddresses(prev => [res.data.address, ...prev]);
      setSaveAddressModal(false);
      setSaveLabel('');
      Alert.alert('Saved', 'Address saved to your profile.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingAddress(false);
    }
  }

  async function handlePlaceOrder() {
    const fullAddress = buildAddressString(addrFields);
    if (!addrFields.house.trim() || !addrFields.city.trim()) {
      Alert.alert('Address Required', 'Please enter at least your house/flat number and city.');
      return;
    }
    if (!vendorId) return;
    setPlacingOrder(true);
    try {
      await api.post('/orders', {
        vendor_id: vendorId,
        delivery_address: fullAddress,
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
  const hasAddress = addrFields.house.trim() && addrFields.city.trim();

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

          {/* Delivery Address */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <View style={styles.addrActions}>
                {savedAddresses.length > 0 && (
                  <TouchableOpacity onPress={() => setAddressPickerVisible(true)} style={styles.addrActionBtn}>
                    <Ionicons name="bookmark-outline" size={13} color={Colors.primary} />
                    <Text style={styles.addrActionText}>Saved</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleDetectLocation} style={styles.addrActionBtn} disabled={detectingLocation}>
                  {detectingLocation
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : <Ionicons name="locate-outline" size={13} color={Colors.primary} />}
                  <Text style={styles.addrActionText}>My Location</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.fieldLabel}>House / Flat No. & Building *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 4B, Sunrise Apartments"
              placeholderTextColor={Colors.textMuted}
              value={addrFields.house}
              onChangeText={v => setField('house', v)}
            />

            <Text style={styles.fieldLabel}>Street / Area *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12 MG Road, Koramangala"
              placeholderTextColor={Colors.textMuted}
              value={addrFields.street}
              onChangeText={v => setField('street', v)}
            />

            <Text style={styles.fieldLabel}>Landmark <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Apollo Hospital"
              placeholderTextColor={Colors.textMuted}
              value={addrFields.landmark}
              onChangeText={v => setField('landmark', v)}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={Colors.textMuted}
                  value={addrFields.city}
                  onChangeText={v => setField('city', v)}
                />
              </View>
              <View style={styles.pincodeCol}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={Colors.textMuted}
                  value={addrFields.pincode}
                  onChangeText={v => setField('pincode', v)}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            {hasAddress && (
              <TouchableOpacity style={styles.saveAddrLink} onPress={() => setSaveAddressModal(true)}>
                <Ionicons name="add-circle-outline" size={15} color={Colors.primary} />
                <Text style={styles.saveAddrLinkText}>Save this address</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Special instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g. No onions, extra spicy, ring doorbell..."
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

          <TouchableOpacity
            style={[styles.orderBtn, (placingOrder || !hasAddress) && styles.disabledBtn]}
            onPress={handlePlaceOrder}
            disabled={placingOrder || !hasAddress}
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

      {/* Saved addresses picker */}
      <Modal visible={addressPickerVisible} animationType="slide" transparent onRequestClose={() => setAddressPickerVisible(false)}>
        <View style={modalSharedStyles.overlay}>
          <View style={modalSharedStyles.content}>
            <ModalHeader title="Saved Addresses" onClose={() => setAddressPickerVisible(false)} />
            <ScrollView>
              {savedAddresses.map(addr => (
                <TouchableOpacity key={addr.id} style={styles.addressItem} onPress={() => selectSavedAddress(addr)}>
                  <Ionicons name="location-outline" size={20} color={Colors.primary} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    {addr.label && <Text style={styles.addressLabel}>{addr.label}</Text>}
                    <Text style={styles.addressLine}>{addr.address_line}</Text>
                    {(addr.city || addr.pincode) && (
                      <Text style={styles.addressSub}>{[addr.city, addr.pincode].filter(Boolean).join(' – ')}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Save address modal */}
      <Modal visible={saveAddressModal} animationType="slide" transparent onRequestClose={() => setSaveAddressModal(false)}>
        <View style={modalSharedStyles.overlay}>
          <View style={modalSharedStyles.content}>
            <ModalHeader title="Save Address" onClose={() => setSaveAddressModal(false)} />
            <Text style={styles.saveHint}>Saving: {buildAddressString(addrFields)}</Text>
            <Text style={styles.fieldLabel}>Label</Text>
            <View style={styles.labelChips}>
              {['Home', 'Work', 'Other'].map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, saveLabel === l && styles.labelChipActive]}
                  onPress={() => setSaveLabel(l)}
                >
                  <Text style={[styles.labelChipText, saveLabel === l && styles.labelChipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Or type a custom label..."
              placeholderTextColor={Colors.textMuted}
              value={saveLabel}
              onChangeText={setSaveLabel}
            />
            <TouchableOpacity
              style={[styles.saveAddrSubmitBtn, savingAddress && styles.disabledBtn]}
              onPress={handleSaveAddress}
              disabled={savingAddress}
            >
              {savingAddress
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.orderBtnText}>Save Address</Text>}
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
  headerSubtitle: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  browseBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
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
  section: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginTop: 12, gap: 6 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  optional: { color: Colors.textMuted, fontWeight: '400', fontSize: 12 },
  addrActions: { flexDirection: 'row', gap: 8 },
  addrActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.primary + '15' },
  addrActionText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textLight, marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, padding: 11, fontSize: 14, color: Colors.text },
  multilineInput: { textAlignVertical: 'top', minHeight: 64 },
  row: { flexDirection: 'row', gap: 10, marginTop: 2 },
  pincodeCol: { width: 110 },
  saveAddrLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  saveAddrLinkText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  summary: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginTop: 12, gap: 10 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: Colors.textLight },
  summaryValue: { fontSize: 14, color: Colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  orderBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  disabledBtn: { opacity: 0.6 },
  orderBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  orderBtnAmount: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  addressItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  addressLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  addressLine: { fontSize: 14, color: Colors.text },
  addressSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  saveHint: { fontSize: 13, color: Colors.textMuted, marginBottom: 14, fontStyle: 'italic' },
  labelChips: { flexDirection: 'row', gap: 10, marginTop: 4 },
  labelChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  labelChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  labelChipText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  labelChipTextActive: { color: Colors.white },
  saveAddrSubmitBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
});
