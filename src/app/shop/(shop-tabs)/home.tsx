import React, { useMemo, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShopCartStore } from '../../../store/shop-cart-store';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  fetchShopCategories,
  fetchShopProducts,
  ShopProduct,
} from '../../../lib/api';

function ShopSectionHeader({
  title,
  actionText,
  onPress,
}: {
  title: string;
  actionText?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionText ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FeaturedCard({ item }: { item: ShopProduct }) {
  return (
    <Pressable
      style={styles.featuredCard}
      onPress={() => router.push(`/shop/product/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        {item.badge ? <Text style={styles.featuredBadge}>{item.badge}</Text> : null}
        <Text style={styles.featuredName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.featuredPrice}>{item.price || 'View product'}</Text>
      </View>
    </Pressable>
  );
}

function ProductCard({ item }: { item: ShopProduct }) {
  return (
    <Pressable
      style={styles.productCard}
      onPress={() => router.push(`/shop/product/${item.id}`)}
    >
      <View style={styles.productImageWrap}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        {item.badge ? <Text style={styles.productBadge}>{item.badge}</Text> : null}
      </View>

      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.productVendor} numberOfLines={1}>
        {item.categories?.[0]?.name || 'Shop'}
      </Text>
      <Text style={styles.productPrice}>{item.price || 'View product'}</Text>
    </Pressable>
  );
}

export default function ShopHomeScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const cartCount = useShopCartStore((s) => s.count);
const hydrateFromServer = useShopCartStore((s) => s.hydrateFromServer);

useEffect(() => {
  hydrateFromServer().catch(() => {});
}, [hydrateFromServer]);



  const categoriesQuery = useQuery({
    queryKey: ['shop-categories'],
    queryFn: fetchShopCategories,
  });

  const productsQuery = useQuery({
    queryKey: ['shop-products', search, activeCategory],
    queryFn: () =>
      fetchShopProducts({
        search,
        category: activeCategory === 'all' ? undefined : activeCategory,
        perPage: 20,
      }),
  });

  const featuredQuery = useQuery({
    queryKey: ['shop-products-featured'],
    queryFn: () => fetchShopProducts({ featured: true, perPage: 8 }),
  });

  const categoryPills = useMemo(() => {
    const cats = categoriesQuery.data ?? [];
    return [{ id: 0, name: 'All', slug: 'all' }, ...cats];
  }, [categoriesQuery.data]);

  const products = productsQuery.data ?? [];
  const featuredProducts = featuredQuery.data ?? [];

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={({ item }) => <ProductCard item={item} />}
        columnWrapperStyle={products.length ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.headerWrap}>
              <View style={styles.topRow}>
                <View>
                  <Text style={styles.eyebrow}>EverythingDid</Text>
                  <Text style={styles.title}>Shop</Text>
                </View>

                <Pressable
                  style={styles.cartBtn}
                  onPress={() => router.push('/shop/(shop-tabs)/cart')}
                >
                  <Text style={styles.cartBtnText}>
  Cart{cartCount > 0 ? ` (${cartCount})` : ''}
</Text>
                </Pressable>
              </View>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search products, vendors, categories"
                placeholderTextColor="#8b8b8b"
                style={styles.search}
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
              >
                {categoryPills.map((category: any) => {
                  const slug = String(category.slug);
                  const active = activeCategory === slug;

                  return (
                    <Pressable
                      key={String(category.id)}
                      style={[
                        styles.categoryPill,
                        active && styles.categoryPillActive,
                      ]}
                      onPress={() => setActiveCategory(slug)}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          active && styles.categoryPillTextActive,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.sectionWrap}>
              <ShopSectionHeader
                title="Featured"
                actionText="Categories"
                onPress={() => router.push('/shop/(shop-tabs)/categories')}
              />

              {featuredQuery.isLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}
                >
                  {featuredProducts.map((item) => (
                    <FeaturedCard key={item.id} item={item} />
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.sectionWrap}>
              <ShopSectionHeader title="Latest products" />
            </View>
          </View>
        }
        ListEmptyComponent={
          productsQuery.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator />
            </View>
          ) : productsQuery.isError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Could not load products</Text>
              <Text style={styles.emptyText}>Try again.</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                Try a different search or category.
              </Text>
            </View>
          )
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
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  headerWrap: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: '#ececf1',
    color: '#222',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  title: {
    marginTop: 18,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
    color: '#111',
  },
  cartBtn: {
    backgroundColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  cartBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  search: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#e9e9ec',
  },
  categoriesRow: {
    gap: 10,
    paddingTop: 16,
    paddingBottom: 4,
  },
  categoryPill: {
    backgroundColor: '#ececf1',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
  },
  categoryPillActive: {
    backgroundColor: '#111',
  },
  categoryPillText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#fff',
  },
  sectionWrap: {
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  featuredRow: {
    gap: 12,
    paddingBottom: 10,
  },
  featuredCard: {
    width: 280,
    height: 190,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#ddd',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e9e9ec',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  featuredContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: '#111',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  featuredName: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  featuredPrice: {
    marginTop: 6,
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  productCard: {
    width: '48%',
  },
  productImageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#e9e9ec',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e9e9ec',
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(17,17,17,0.9)',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  productName: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#111',
  },
  productVendor: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  productPrice: {
    marginTop: 6,
    fontSize: 15,
    color: '#111',
    fontWeight: '800',
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  empty: {
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});