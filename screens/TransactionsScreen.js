import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getTransactions } from '../services/apiService';

const TYPE_LABELS = {
  EARN_STEPS: 'transactions.typeSteps',
  EARN_STORY: 'transactions.typeStory',
  SPEND_COUPON: 'transactions.typeCoupon',
  EARN_REFERRAL: 'transactions.typeReferral',
};

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTransactions();
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setRows(list);
    } catch (e) {
      setError(e.message || t('transactions.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item }) => {
    const amount = Number(item.amount);
    const positive = amount >= 0;
    const labelKey = TYPE_LABELS[item.type] || 'transactions.typeOther';
    const when = item.created_at
      ? new Date(item.created_at).toLocaleString()
      : '';
    return (
      <View style={styles.row}>
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{t(labelKey)}</Text>
          <Text style={styles.rowDate}>{when}</Text>
        </View>
        <Text style={[styles.rowAmount, positive ? styles.positive : styles.negative]}>
          {positive ? '+' : ''}
          {amount}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>{t('transactions.title')}</Text>
        <View style={styles.backBtn} />
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#8140F3" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={rows.length ? styles.list : styles.listEmpty}
          ListEmptyComponent={<Text style={styles.empty}>{t('transactions.empty')}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
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
  loader: { marginTop: 40 },
  error: { color: '#DC2626', textAlign: 'center', marginTop: 24, paddingHorizontal: 20 },
  list: { padding: 16, paddingBottom: 32 },
  listEmpty: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  empty: { textAlign: 'center', color: '#6B7280', fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  rowDate: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  rowAmount: { fontSize: 17, fontWeight: '700' },
  positive: { color: '#059669' },
  negative: { color: '#DC2626' },
});
