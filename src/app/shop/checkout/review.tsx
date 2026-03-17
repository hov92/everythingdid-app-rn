import React, { useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
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

export default function ShopCheckoutReviewScreen() {
  const items = useShopCartStore((s) => s.items);
  const subtotal = useShopCartStore((s) => s.subtotal);
  const total = useShopCartStore((s) => s.total);
  const currency = useShopCartStore((s) => s.currency);
  const syncing = useShopCartStore((s) => s.syncing);
  const lastError = useShopCartStore((s) => s.lastError);
  const hydrateFromServer = useShopCartStore((s) => s.hydrateFromServer);

  useEffect(() => {
    hydrateFromServer().catch(() => {});
  }, [hydrateFromServer]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const fallbackSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + parsePriceToNumber(item.price) * item.quantity;
    }, 0);
  }, [items]);

  const subtotalText =
    subtotal ||
    `${currency ? `${currency} ` : '$'}${fallbackSubtotal.toFixed(2)}`;

  const totalText =
    total ||
    `${currency ? `${currency} ` : '$'}${fallbackSubtotal.toFixed(2)}`;

  function handlePlaceOrder() {
    Alert.alert(
      'Next step',
      'This review screen is ready. The next step is wiring checkout prepare/create-order endpoints and payment.'
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>

            <Text style={styles.title}>Review Order</Text>
            <Text style={styles.subtitle}>
              Final check before placing your order.
            </Text>

            {syncing ? (
              <View style={styles.syncRow}>
                <ActivityIndicator size="small" />
                <Text style={styles.syncText}>Refreshing totals…</Text>
              </View>
            ) : null}

            {lastError ? (
              <Text style={styles.errorText}>{lastError}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />

            <View style={styles.itemMeta}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              {item.lineSubtotal ? (
                <Text style={styles.itemSubtotal}>{item.lineSubtotal}</Text>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No items to review</Text>
            <Text style={styles.emptyText}>
              Add products to your cart before checkout.
            </Text>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.replace('/shop/(shop-tabs)/home')}
            >
              <Text style={styles.secondaryBtnText}>Go to Shop</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          items.length ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>{itemCount}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{subtotalText}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Total</Text>
                <Text style={styles.summaryTotal}>{totalText}</Text>
              </View>

              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Ready for server checkout</Text>
                <Text style={styles.noteText}>
                  Next we will send address info, validate totals on the server,
                  create the Woo order, and connect payment.
                </Text>
              </View>

              <Pressable
                style={[styles.primaryBtn, syncing && styles.disabledBtn]}
                disabled={syncing}
                onPress={handlePlaceOrder}
              >
                <Text style={styles.primaryBtnText}>
                  {syncing ? 'Syncing...' : 'Place Order'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryBtn}
                onPress={() => router.push('/shop/checkout/address')}
              >
                <Text style={styles.secondaryBtnText}>Back to Address</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  headerWrap: {
    marginBottom: 14,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    marginBottom: 14,
  },
  backBtnText: {
    color: '#111',
    fontWeight: '700',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#111',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    fontWeight: '600',
  },
  syncRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#b42318',
    fontWeight: '600',
  },
  itemCard: {
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
  itemImage: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#e9e9ec',
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#111',
  },
  itemPrice: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  itemQty: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  itemSubtotal: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
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
  summaryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
  summaryTotal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },
  noteCard: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#f3f3f6',
    padding: 14,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
  noteText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#666',
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#ececf1',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});