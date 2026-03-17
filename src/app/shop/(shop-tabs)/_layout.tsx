import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useShopCartStore } from '../../../store/shop-cart-store';

export default function ShopTabsLayout() {
  const cartCount = useShopCartStore((s) => s.count);
  const hydrateFromServer = useShopCartStore((s) => s.hydrateFromServer);

  useEffect(() => {
    hydrateFromServer().catch(() => {});
  }, [hydrateFromServer]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#8b8b8b',
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          paddingBottom: 18,
          backgroundColor: '#fff',
          borderTopColor: '#ececf1',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: cartCount > 0 ? `Cart (${cartCount})` : 'Cart',
        }}
      />
    </Tabs>
  );
}