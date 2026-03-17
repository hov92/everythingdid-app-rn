import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useShopCartStore } from '../../../store/shop-cart-store';

function parsePriceToNumber(price: string) {
  const cleaned = String(price || '').replace(/[^0-9.]/g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export default function ShopCartScreen() {
  const items = useShopCartStore((s) => s.items);
  const removeItem = useShopCartStore((s) => s.removeItem);
  const setQuantity = useShopCartStore((s) => s.setQuantity);
  const clearCart = useShopCartStore((s) => s.clearCart);

  const subtotal = items.reduce((sum, item) => {
    return sum + parsePriceToNumber(item.price) * item.quantity;
  }, 0);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.title}>Cart</Text>
            <Text style={styles.subtitle}>
              {items.length} item{items.length === 1 ? '' : 's'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />

            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.price}>{item.price}</Text>

              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(item.productId, item.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>

                <Text style={styles.qtyText}>{item.quantity}</Text>

                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(item.productId, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => removeItem(item.productId)}
              style={styles.removeBtn}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Add products from the Shop to see them here.
            </Text>
          </View>
        }
        ListFooterComponent={
          items.length ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>

              <Pressable
                style={styles.checkoutBtn}
                onPress={() =>
                  Alert.alert(
                    'Checkout next',
                    'Cart state is real. Checkout sync to Woo is the next step.'
                  )
                }
              >
                <Text style={styles.checkoutBtnText}>Checkout</Text>
              </Pressable>

              <Pressable style={styles.clearBtn} onPress={clearCart}>
                <Text style={styles.clearBtnText}>Clear Cart</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f6f7' },
  listContent: { padding: 16, paddingBottom: 28 },
  headerWrap: { marginBottom: 14 },
  title: { fontSize: 36, fontWeight: '900', color: '#111' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#666', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#e9e9ec',
  },
  meta: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: '#111' },
  price: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#222' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '800', color: '#111' },
  qtyText: { minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: '800' },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fbe9e9',
  },
  removeBtnText: { color: '#b42318', fontSize: 12, fontWeight: '700' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  summaryCard: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 15, fontWeight: '700', color: '#555' },
  summaryValue: { fontSize: 22, fontWeight: '900', color: '#111' },
  checkoutBtn: {
    marginTop: 16,
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  clearBtn: {
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ececf1',
  },
  clearBtnText: { color: '#111', fontSize: 14, fontWeight: '800' },
});