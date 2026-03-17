import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { prepareCheckout } from '../../../lib/api';
import { useShopCartStore } from '../../../store/shop-cart-store';
import { useShopCartSessionStore } from '../../../store/shop-cart-session-store';

export default function ShopCheckoutAddressScreen() {
  const items = useShopCartStore((s) => s.items);
  const subtotal = useShopCartStore((s) => s.subtotal);
  const total = useShopCartStore((s) => s.total);
  const currency = useShopCartStore((s) => s.currency);
  const hydrateFromServer = useShopCartStore((s) => s.hydrateFromServer);
  const cartToken = useShopCartSessionStore((s) => s.cartToken);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('US');
  const [submitting, setSubmitting] = useState(false);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const summaryTotal =
    total || subtotal || `${currency ? `${currency} ` : '$'}0.00`;

  const canContinue =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    address1.trim().length > 0 &&
    city.trim().length > 0 &&
    stateValue.trim().length > 0 &&
    zip.trim().length > 0 &&
    country.trim().length > 0 &&
    itemCount > 0 &&
    !submitting;

  async function handleContinue() {
    if (!itemCount) {
      Alert.alert('Cart is empty', 'Add items to your cart before checkout.');
      return;
    }

    if (!canContinue) {
      Alert.alert('Missing details', 'Please complete all required address fields.');
      return;
    }

    try {
      setSubmitting(true);

      const address = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address_1: address1.trim(),
        address_2: address2.trim(),
        city: city.trim(),
        state: stateValue.trim().toUpperCase(),
        postcode: zip.trim(),
        country: country.trim().toUpperCase(),
      };

      const prepared = await prepareCheckout({
        address,
        cartToken,
      });

      await hydrateFromServer().catch(() => {});

      router.push({
        pathname: '/shop/checkout/review',
        params: {
          checkoutData: JSON.stringify(prepared),
        },
      });
    } catch (e: any) {
      Alert.alert(
        'Checkout error',
        e?.message || 'Could not validate checkout details.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerWrap}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>

            <Text style={styles.title}>Address</Text>
            <Text style={styles.subtitle}>
              Enter your contact and delivery details.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contact</Text>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#8b8b8b"
                  style={styles.input}
                />
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#8b8b8b"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#8b8b8b"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor="#8b8b8b"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>

            <Text style={styles.label}>Address Line 1</Text>
            <TextInput
              value={address1}
              onChangeText={setAddress1}
              placeholder="Street address"
              placeholderTextColor="#8b8b8b"
              style={styles.input}
            />

            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              value={address2}
              onChangeText={setAddress2}
              placeholder="Apartment, suite, etc. (optional)"
              placeholderTextColor="#8b8b8b"
              style={styles.input}
            />

            <Text style={styles.label}>City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor="#8b8b8b"
              style={styles.input}
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  value={stateValue}
                  onChangeText={setStateValue}
                  placeholder="State"
                  placeholderTextColor="#8b8b8b"
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>ZIP</Text>
                <TextInput
                  value={zip}
                  onChangeText={setZip}
                  placeholder="ZIP code"
                  placeholderTextColor="#8b8b8b"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Country</Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="Country code"
              placeholderTextColor="#8b8b8b"
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Snapshot</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{itemCount}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Total</Text>
              <Text style={styles.summaryValue}>{summaryTotal}</Text>
            </View>

            <Text style={styles.summaryNote}>
              Shipping, taxes, and final totals will be confirmed on the review step.
            </Text>

            <Pressable
              style={[styles.primaryBtn, !canContinue && styles.disabledBtn]}
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? 'Validating...' : 'Continue to Review'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.push('/shop/checkout')}
              disabled={submitting}
            >
              <Text style={styles.secondaryBtnText}>Back to Checkout</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  content: {
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  label: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },
  input: {
    backgroundColor: '#f8f8fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    marginBottom: 10,
  },
  summaryCard: {
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
  summaryNote: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#777',
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
    opacity: 0.5,
  },
});