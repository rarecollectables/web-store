import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Appbar, Card, Button, TextInput, FAB, Portal, Dialog, Paragraph, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../../lib/supabase/client';
import { useRouter } from 'expo-router';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', image_url: '', additional_images: '', category: '', shipping_label: '', description: '', stock: '', material: '', stone: '', size: '', length: '', video_url: '' });
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!search) {
      setSearchResults(products);
      return;
    }
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      const s = search.trim().toLowerCase();
      setSearchResults(products.filter(p =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.category && p.category.toLowerCase().includes(s)) ||
        (p.description && p.description.toLowerCase().includes(s))
      ));
    }, 200));
  }, [search, products]);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, additional_images, category, shipping_label, description, stock, material, stone, size, length, video_url')
      .order('created_at', { ascending: false });
    if (error) {
      setError('Failed to fetch products');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  function openDialog(product = null) {
    setEditingProduct(product);
    setForm(product ? {
      ...product,
      price: String(product.price),
      stock: String(product.stock),
      additional_images: Array.isArray(product.additional_images) ? product.additional_images.join(', ') : (product.additional_images || ''),
      material: product.material || '',
      stone: product.stone || '',
      size: product.size || '',
      length: product.length || '',
      shipping_label: product.shipping_label || '',
      video_url: product.video_url || ''
    } : { name: '', price: '', image_url: '', additional_images: '', category: '', shipping_label: '', description: '', stock: '', material: '', stone: '', size: '', length: '', video_url: '' });
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditingProduct(null);
    setForm({ name: '', price: '', image_url: '', additional_images: '', category: '', shipping_label: '', description: '', stock: '', material: '', stone: '', size: '', length: '', video_url: '' });
  }

  async function handleSave() {
    const { name, price, image_url, additional_images, category, shipping_label, description, stock, material, stone, size, length, video_url } = form;
    if (!name || !price) return Alert.alert('Validation', 'Name and price are required');
    setLoading(true);
    let result;
    // Ensure price is a string (not a number) and stock is int or null
    const updatePayload = {
      name: name.trim(),
      price: String(price).trim(),
      image_url: image_url?.trim() || null,
      category: category?.trim() || null,
      shipping_label: shipping_label?.trim() || null,
      description: description?.trim() || null,
      stock: stock === '' ? null : parseInt(stock),
      additional_images: additional_images ? additional_images.split(',').map(s => s.trim()).filter(Boolean) : [],
      material: material?.trim() || null,
      stone: stone?.trim() || null,
      size: size?.trim() || null,
      length: length?.trim() || null,
      video_url: video_url?.trim() || null
    };
    if (editingProduct) {
      result = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', editingProduct.id);
    } else {
      // Remove id from payload for insert (let Supabase auto-generate or handle it)
      const { id, ...insertPayload } = updatePayload;
      result = await supabase
        .from('products')
        .insert([insertPayload]);
    }
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      fetchProducts();
      closeDialog();
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setLoading(true);
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchProducts();
          setLoading(false);
        }
      }
    ]);
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Manage Products" />
        <Appbar.Action icon="plus" onPress={() => openDialog()} />
      </Appbar.Header>
      <TextInput
        label="Search Products"
        value={search}
        onChangeText={setSearch}
        style={{ margin: 16, marginBottom: 0 }}
        placeholder="Search by name, category, or description"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {loading ? <ActivityIndicator style={{ marginTop: 30 }} /> : (
        <FlatList
          data={search ? searchResults : products}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title title={item.name} subtitle={`₤${item.price} | ${item.category}`} />
              <Card.Content>
                <Paragraph>{item.description}</Paragraph>
                <Paragraph>Stock: {item.stock}</Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => openDialog(item)}>Edit</Button>
                <Button onPress={() => handleDelete(item.id)} color='red'>Delete</Button>
              </Card.Actions>
            </Card>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
      <Portal>
        <Dialog visible={showDialog} onDismiss={closeDialog}>
          <Dialog.Title>{editingProduct ? 'Edit Product' : 'Add Product'}</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }}>
            <TextInput
              label="Name"
              value={form.name}
              onChangeText={text => setForm(f => ({ ...f, name: text }))}
              style={styles.input}
            />
            <TextInput
              label="Price"
              value={form.price}
              onChangeText={text => setForm(f => ({ ...f, price: text }))}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              label="Image URL"
              value={form.image_url}
              onChangeText={text => setForm(f => ({ ...f, image_url: text }))}
              style={styles.input}
            />
            <TextInput
              label="Category"
              value={form.category}
              onChangeText={text => setForm(f => ({ ...f, category: text }))}
              style={styles.input}
            />
            <TextInput
              label="Shipping Label (e.g. next_day)"
              value={form.shipping_label}
              onChangeText={text => setForm(f => ({ ...f, shipping_label: text }))}
              style={styles.input}
            />
            <TextInput
              label="Additional Images (comma separated URLs)"
              value={form.additional_images}
              onChangeText={text => setForm(f => ({ ...f, additional_images: text }))}
              style={styles.input}
            />
            <TextInput
              label="Material"
              value={form.material}
              onChangeText={text => setForm(f => ({ ...f, material: text }))}
              style={styles.input}
            />
            <TextInput
              label="Stone"
              value={form.stone}
              onChangeText={text => setForm(f => ({ ...f, stone: text }))}
              style={styles.input}
            />
            <TextInput
              label="Size"
              value={form.size}
              onChangeText={text => setForm(f => ({ ...f, size: text }))}
              style={styles.input}
            />
            <TextInput
              label="Length"
              value={form.length}
              onChangeText={text => setForm(f => ({ ...f, length: text }))}
              style={styles.input}
            />
            <TextInput
              label="Product Video URL (.mp4)"
              value={form.video_url}
              onChangeText={text => setForm(f => ({ ...f, video_url: text }))}
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={form.description}
              onChangeText={text => setForm(f => ({ ...f, description: text }))}
              style={styles.input}
            />
            <TextInput
              label="Stock"
              value={form.stock}
              onChangeText={text => setForm(f => ({ ...f, stock: text }))}
              keyboardType="number-pad"
              style={styles.input}
            />
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleSave}>{editingProduct ? 'Update' : 'Add'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
});
