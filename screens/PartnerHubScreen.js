import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

let CameraView = null;
try {
  CameraView = require('expo-camera').CameraView;
} catch (_) {}
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  createCouponTemplate,
  createStory,
  getPartnerProfile,
  redeemCouponByCode,
  updatePartnerProfile,
} from '../services/apiService';

export default function PartnerHubScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [storyUrl, setStoryUrl] = useState('');
  const [storyReward, setStoryReward] = useState('5');
  const [couponTitle, setCouponTitle] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponPrice, setCouponPrice] = useState('10');
  const [couponQty, setCouponQty] = useState('10');
  const [redeemCode, setRedeemCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getPartnerProfile();
      setBrandName(profile.brand_name || '');
      setDescription(profile.description || '');
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const saveProfile = async () => {
    setBusy(true);
    try {
      await updatePartnerProfile({
        brand_name: brandName.trim(),
        description: description.trim(),
      });
      Alert.alert(t('common.success'), t('partnerHub.profileSaved'));
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitStory = async () => {
    if (!storyUrl.trim()) {
      Alert.alert(t('common.error'), t('partnerHub.storyUrlRequired'));
      return;
    }
    setBusy(true);
    try {
      await createStory({
        media_url: storyUrl.trim(),
        reward_amount: storyReward.trim() || '5',
      });
      setStoryUrl('');
      Alert.alert(t('common.success'), t('partnerHub.storyCreated'));
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCoupon = async () => {
    if (!couponTitle.trim()) {
      Alert.alert(t('common.error'), t('partnerHub.couponTitleRequired'));
      return;
    }
    setBusy(true);
    try {
      await createCouponTemplate({
        title: couponTitle.trim(),
        description: couponDesc.trim(),
        price: couponPrice.trim() || '10',
        quantity: parseInt(couponQty, 10) || 1,
      });
      setCouponTitle('');
      setCouponDesc('');
      Alert.alert(t('common.success'), t('partnerHub.couponCreated'));
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitRedeem = async () => {
    if (!redeemCode.trim()) return;
    setBusy(true);
    try {
      await redeemCouponByCode(redeemCode.trim().toUpperCase());
      setRedeemCode('');
      Alert.alert(t('common.success'), t('partnerHub.redeemed'));
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8140F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>{t('partnerHub.title')}</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>{t('partnerHub.profileSection')}</Text>
        <TextInput style={styles.input} value={brandName} onChangeText={setBrandName} placeholder={t('partnerHub.brandName')} />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('partnerHub.description')}
          multiline
        />
        <Pressable style={styles.btn} onPress={saveProfile} disabled={busy}>
          <Text style={styles.btnText}>{t('partnerHub.saveProfile')}</Text>
        </Pressable>

        <Text style={styles.section}>{t('partnerHub.storySection')}</Text>
        <TextInput style={styles.input} value={storyUrl} onChangeText={setStoryUrl} placeholder={t('partnerHub.storyUrl')} autoCapitalize="none" />
        <TextInput style={styles.input} value={storyReward} onChangeText={setStoryReward} placeholder={t('partnerHub.storyReward')} keyboardType="decimal-pad" />
        <Pressable style={styles.btn} onPress={submitStory} disabled={busy}>
          <Text style={styles.btnText}>{t('partnerHub.createStory')}</Text>
        </Pressable>

        <Text style={styles.section}>{t('partnerHub.couponSection')}</Text>
        <TextInput style={styles.input} value={couponTitle} onChangeText={setCouponTitle} placeholder={t('partnerHub.couponTitle')} />
        <TextInput style={styles.input} value={couponDesc} onChangeText={setCouponDesc} placeholder={t('partnerHub.couponDesc')} />
        <TextInput style={styles.input} value={couponPrice} onChangeText={setCouponPrice} placeholder={t('partnerHub.couponPrice')} keyboardType="decimal-pad" />
        <TextInput style={styles.input} value={couponQty} onChangeText={setCouponQty} placeholder={t('partnerHub.couponQty')} keyboardType="number-pad" />
        <Pressable style={styles.btn} onPress={submitCoupon} disabled={busy}>
          <Text style={styles.btnText}>{t('partnerHub.createCoupon')}</Text>
        </Pressable>

        <Text style={styles.section}>{t('partnerHub.redeemSection')}</Text>
        <TextInput
          style={styles.input}
          value={redeemCode}
          onChangeText={setRedeemCode}
          placeholder={t('partnerHub.redeemCode')}
          autoCapitalize="characters"
        />
        {CameraView ? (
          <Pressable style={styles.btnSecondary} onPress={() => setScanOpen(true)} disabled={busy}>
            <Text style={styles.btnSecondaryText}>{t('partnerHub.scanQr')}</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.btn} onPress={submitRedeem} disabled={busy}>
          <Text style={styles.btnText}>{t('partnerHub.redeem')}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <View style={styles.scanModal}>
          {CameraView ? (
            <CameraView
              style={styles.scanCamera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                if (!data) return;
                setRedeemCode(String(data).trim());
                setScanOpen(false);
              }}
            />
          ) : null}
          <Pressable style={styles.btn} onPress={() => setScanOpen(false)}>
            <Text style={styles.btnText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111827' },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 10 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#111827',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  btn: {
    backgroundColor: '#8140F3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnSecondaryText: { color: '#111827', fontSize: 16, fontWeight: '700' },
  scanModal: { flex: 1, backgroundColor: '#000', paddingTop: 56 },
  scanCamera: { flex: 1 },
});
