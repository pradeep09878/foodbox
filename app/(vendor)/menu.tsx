import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Switch,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { getFileUrl } from '@/services/api';
import { Colors } from '@/constants/Colors';

interface Category { id: number; name: string; }
interface MenuItemVendor {
  id: number; vendor_id: number; category_id?: number; name: string;
  description?: string; price: number; image?: string; is_available: boolean; is_veg: boolean;
}

const EMPTY_FORM = { name: '', description: '', price: '', category_id: '', image: '', is_veg: true, is_available: true };

export default function VendorMenuScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItemVendor[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [itemModal, setItemModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemVendor | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [catName, setCatName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendor/menu');
      setCategories(res.data.categories || []);
      setItems(res.data.items || []);
      if (res.data.categories?.length > 0 && selectedCat === null) {
        setSelectedCat(res.data.categories[0].id);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadMenu(); }, []);

  function setField(key: string, value: any) { setForm(f => ({ ...f, [key]: value })); }

  async function pickAndUploadImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to upload an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'item.jpg',
      } as any);
      const res = await api.post('/vendor/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setField('image', res.data.url);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  function openAddItem() {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, category_id: selectedCat ? String(selectedCat) : '' });
    setItemModal(true);
  }

  function openEditItem(item: MenuItemVendor) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category_id: item.category_id ? String(item.category_id) : '',
      image: item.image || '',
      is_veg: item.is_veg,
      is_available: item.is_available,
    });
    setItemModal(true);
  }

  async function handleSaveItem() {
    if (!form.name.trim()) { Alert.alert('Error', 'Item name is required'); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { Alert.alert('Error', 'Valid price is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        category_id: form.category_id ? parseInt(form.category_id) : undefined,
        image: form.image.trim() || undefined,
        is_veg: form.is_veg,
        is_available: form.is_available,
      };
      if (editingItem) {
        await api.put(`/vendor/menu/item/${editingItem.id}`, payload);
      } else {
        await api.post('/vendor/menu/item', payload);
      }
      setItemModal(false);
      loadMenu();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(item: MenuItemVendor) {
    Alert.alert('Delete Item', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/vendor/menu/item/${item.id}`);
            loadMenu();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  async function handleToggleAvailability(item: MenuItemVendor) {
    try {
      await api.put(`/vendor/menu/item/${item.id}/toggle`);
      loadMenu();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleAddCategory() {
    if (!catName.trim()) { Alert.alert('Error', 'Category name is required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/vendor/menu/category', { name: catName.trim() });
      setCatName('');
      setCatModal(false);
      await loadMenu();
      setSelectedCat(res.data.category.id);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = selectedCat !== null
    ? items.filter(i => i.category_id === selectedCat)
    : items.filter(i => !i.category_id);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity style={styles.addCatBtn} onPress={() => setCatModal(true)}>
          <Ionicons name="add" size={18} color={Colors.primary} />
          <Text style={styles.addCatBtnText}>Category</Text>
        </TouchableOpacity>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {items.filter(i => !i.category_id).length > 0 && (
          <TouchableOpacity style={[styles.tab, selectedCat === null && styles.tabActive]} onPress={() => setSelectedCat(null)}>
            <Text style={[styles.tabText, selectedCat === null && styles.tabTextActive]}>General</Text>
          </TouchableOpacity>
        )}
        {categories.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.tab, selectedCat === cat.id && styles.tabActive]} onPress={() => setSelectedCat(cat.id)}>
            <Text style={[styles.tabText, selectedCat === cat.id && styles.tabTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <View style={[styles.vegDot, { backgroundColor: item.is_veg ? Colors.veg : Colors.nonVeg }]} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                  {item.description ? <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text> : null}
                </View>
              </View>
              <View style={styles.itemActions}>
                <Switch
                  value={item.is_available}
                  onValueChange={() => handleToggleAvailability(item)}
                  trackColor={{ false: Colors.border, true: Colors.success + '88' }}
                  thumbColor={item.is_available ? Colors.success : Colors.textMuted}
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
                <TouchableOpacity onPress={() => openEditItem(item)} style={styles.iconBtn}>
                  <Ionicons name="create-outline" size={18} color={Colors.info} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No items in this category</Text>
              <Text style={styles.emptySubText}>Tap the + button to add items</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddItem}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal visible={itemModal} animationType="slide" onRequestClose={() => setItemModal(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
            <TouchableOpacity onPress={() => setItemModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Item Name *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={v => setField('name', v)} placeholder="e.g. Butter Chicken" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.multiline]} value={form.description} onChangeText={v => setField('description', v)} placeholder="Short description..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={2} />

            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput style={styles.input} value={form.price} onChangeText={v => setField('price', v)} placeholder="e.g. 250" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity style={[styles.catChip, !form.category_id && styles.catChipActive]} onPress={() => setField('category_id', '')}>
                <Text style={[styles.catChipText, !form.category_id && styles.catChipTextActive]}>General</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.catChip, form.category_id === String(cat.id) && styles.catChipActive]} onPress={() => setField('category_id', String(cat.id))}>
                  <Text style={[styles.catChipText, form.category_id === String(cat.id) && styles.catChipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Item Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickAndUploadImage} disabled={uploadingImage}>
              {uploadingImage ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : form.image ? (
                <Image source={{ uri: getFileUrl(form.image) }} style={styles.imagePreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>Tap to upload image</Text>
                </View>
              )}
            </TouchableOpacity>
            {form.image ? (
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setField('image', '')}>
                <Ionicons name="trash-outline" size={14} color={Colors.error} />
                <Text style={styles.removeImageText}>Remove image</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Vegetarian</Text>
              <Switch value={form.is_veg} onValueChange={v => setField('is_veg', v)} trackColor={{ false: Colors.nonVeg + '66', true: Colors.veg + '66' }} thumbColor={form.is_veg ? Colors.veg : Colors.nonVeg} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Available</Text>
              <Switch value={form.is_available} onValueChange={v => setField('is_available', v)} trackColor={{ false: Colors.border, true: Colors.success + '66' }} thumbColor={form.is_available ? Colors.success : Colors.textMuted} />
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={handleSaveItem} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>{editingItem ? 'Save Changes' : 'Add Item'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={catModal} animationType="slide" transparent onRequestClose={() => setCatModal(false)}>
        <View style={styles.smallModalOverlay}>
          <View style={styles.smallModalContent}>
            <Text style={styles.modalTitle}>Add Category</Text>
            <TextInput style={[styles.input, { marginTop: 16 }]} value={catName} onChangeText={setCatName} placeholder="e.g. Starters, Main Course..." placeholderTextColor={Colors.textMuted} autoFocus />
            <View style={styles.smallModalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setCatName(''); setCatModal(false); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }, saving && styles.disabledBtn]} onPress={handleAddCategory} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: Colors.text },
  addCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addCatBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  tabs: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 48 },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 100 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  vegDot: { width: 10, height: 10, borderRadius: 5 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemPrice: { fontSize: 13, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  itemDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },
  empty: { padding: 40, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  emptySubText: { fontSize: 13, color: Colors.textMuted },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: Colors.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalScroll: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text },
  multiline: { minHeight: 65, textAlignVertical: 'top' },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  catChipTextActive: { color: Colors.white },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  toggleLabel: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  smallModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  smallModalContent: { backgroundColor: Colors.white, borderRadius: 20, padding: 20 },
  smallModalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  imagePicker: { height: 160, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: Colors.background, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, alignSelf: 'flex-end' },
  removeImageText: { fontSize: 12, color: Colors.error, fontWeight: '600' },
});
