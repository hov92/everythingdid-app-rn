import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchShopProductDetail } from '../../../lib/api';
import { useShopCartStore } from '../../../store/shop-cart-store';

export default function ShopProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id ?? 0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const addItem = useShopCartStore((s) => s.addItem);
  const getItemQuantity = useShopCartStore((s) => s.getItemQuantity);
  const cartCount = useShopCartStore((s) => s.count);
  const syncing = useShopCartStore((s) => s.syncing);

  const productQuery = useQuery({
    queryKey: ['shop-product', productId],
    queryFn: () => fetchShopProductDetail(productId),
    enabled: !!productId,
  });

  const product = productQuery.data;
  const alreadyInCart = getItemQuantity(productId);

  const gallery = useMemo(() => {
    if (!product) return [];
    const items = Array.isArray(product.gallery) ? product.gallery : [];
    return items.length ? items : product.image ? [product.image] : [];
  }, [product]);

  const activeImage = gallery[activeImageIndex] || gallery[0] || '';

  async function handleAddToCart() {
    if (!product) return;

    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stockStatus: product.stockStatus,
      });

      Alert.alert('Added to cart', `${product.name} was added to your cart.`, [
        { text: 'Keep Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => router.push('/shop/(shop-tabs)/cart'),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Cart error', e?.message || 'Could not add item to cart.');
    }
  }

  if (productQuery.isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Could not load product</Text>
          <Text style={styles.errorText}>
            {(productQuery.error as Error)?.message || 'Try again.'}
          </Text>

          <Pressable onPress={() => router.back()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/shop/(shop-tabs)/cart')}
            style={styles.cartBtn}
          >
            <Text style={styles.cartBtnText}>
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </Text>
          </Pressable>
        </View>

        <View style={styles.imageCard}>
          {activeImage ? (
            <Image
              source={{ uri: activeImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroImage} />
          )}

          {product.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.badge}</Text>
            </View>
          ) : null}
        </View>

        {gallery.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {gallery.map((img, index) => {
              const active = index === activeImageIndex;

              return (
                <Pressable
                  key={`${img}-${index}`}
                  onPress={() => setActiveImageIndex(index)}
                  style={[styles.thumbWrap, active && styles.thumbWrapActive]}
                >
                  <Image source={{ uri: img }} style={styles.thumbImage} />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.infoCard}>
          <View style={styles.topMetaRow}>
            <View style={styles.topMetaText}>
              <Text style={styles.title}>{product.name}</Text>

              {!!product.categories?.length ? (
                <Text style={styles.categoryText}>
                  {product.categories.map((cat) => cat.name).join(' • ')}
                </Text>
              ) : null}
            </View>

            {product.stockStatus ? (
              <View
                style={[
                  styles.stockPill,
                  product.stockStatus === 'instock'
                    ? styles.stockPillIn
                    : styles.stockPillOut,
                ]}
              >
                <Text
                  style={[
                    styles.stockPillText,
                    product.stockStatus === 'instock'
                      ? styles.stockPillTextIn
                      : styles.stockPillTextOut,
                  ]}
                >
                  {product.stockStatus === 'instock'
                    ? 'In Stock'
                    : product.stockStatus}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price || 'View pricing'}</Text>

            {product.regularPrice && product.salePrice ? (
              <Text style={styles.comparePrice}>Was ${product.regularPrice}</Text>
            ) : null}
          </View>

          {product.shortDescription ? (
            <>
              <Text style={styles.sectionLabel}>About</Text>
              <Text style={styles.description}>{product.shortDescription}</Text>
            </>
          ) : null}

          {product.description &&
          product.description !== product.shortDescription ? (
            <>
              <Text style={styles.sectionLabel}>Details</Text>
              <Text style={styles.description}>{product.description}</Text>
            </>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.push('/shop/(shop-tabs)/cart')}
            >
              <Text style={styles.secondaryBtnText}>View Cart</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryBtn, syncing && styles.disabledBtn]}
              onPress={handleAddToCart}
              disabled={syncing}
            >
              <Text style={styles.primaryBtnText}>
                {syncing
                  ? 'Adding...'
                  : alreadyInCart > 0
                    ? 'Add Another'
                    : 'Add to Cart'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f6f7' },
  content: { padding: 16, paddingBottom: 28 },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  backBtnText: { color: '#111', fontWeight: '700' },
  cartBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  cartBtnText: { color: '#fff', fontWeight: '700' },
  imageCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e9e9ec',
  },
  heroImage: { width: '100%', height: 360, backgroundColor: '#e9e9ec' },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(17,17,17,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  thumbRow: { gap: 10, paddingTop: 12, paddingBottom: 4 },
  thumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e9e9ec',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapActive: { borderColor: '#111' },
  thumbImage: { width: '100%', height: '100%' },
  infoCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 16,
  },
  topMetaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  topMetaText: { flex: 1 },
  title: { fontSize: 28, lineHeight: 32, fontWeight: '900', color: '#111' },
  categoryText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#666',
    fontWeight: '600',
  },
  stockPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  stockPillIn: { backgroundColor: '#e8f7ee' },
  stockPillOut: { backgroundColor: '#fdecec' },
  stockPillText: { fontSize: 12, fontWeight: '800' },
  stockPillTextIn: { color: '#137333' },
  stockPillTextOut: { color: '#b42318' },
  priceRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  price: { fontSize: 24, fontWeight: '900', color: '#111' },
  comparePrice: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  sectionLabel: {
    marginTop: 18,
    fontSize: 13,
    fontWeight: '800',
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  description: { marginTop: 8, fontSize: 15, lineHeight: 22, color: '#333' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#111', fontSize: 14, fontWeight: '800' },
  disabledBtn: {
    opacity: 0.6,
  },
});