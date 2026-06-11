import { StatusBar } from 'expo-status-bar';
import { UserPlus, Users } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { addFriend, getFriends } from '../services/apiService';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const [rows, setRows] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getFriends()
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onAdd = async () => {
    setAdding(true);
    try {
      await addFriend(email.trim());
      setEmail('');
      load();
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader title={t('features.friends')} onBack={() => navigation.goBack()} />
      <View style={styles.addCard}>
        <TextInput
          style={styles.input}
          placeholder={t('friends.email')}
          placeholderTextColor={c.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <PrimaryButton label={t('friends.add')} onPress={onAdd} loading={adding} />
      </View>
      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name = [item.friend?.first_name, item.friend?.last_name].filter(Boolean).join(' ');
            const initial = (name || '?').charAt(0).toUpperCase();
            return (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.name}>{name || t('account.userFallback')}</Text>
                  <Text style={styles.email}>{item.friend?.email}</Text>
                </View>
                <Users size={18} color={c.textMuted} />
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <UserPlus size={40} color={c.textMuted} />
              <Text style={styles.empty}>{t('friends.empty')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { radii, shadow, spacing } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    addCard: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      gap: spacing.sm,
      ...shadow.card,
    },
    input: {
      backgroundColor: c.screenBg,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: c.textPrimary,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    loader: { marginTop: 24 },
    list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.cardBorder,
      gap: spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '800', color: c.primary },
    rowBody: { flex: 1 },
    name: { fontWeight: '700', fontSize: 16, color: c.textPrimary },
    email: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
    emptyWrap: { alignItems: 'center', marginTop: 48, gap: spacing.sm },
    empty: { color: c.textSecondary, fontSize: 15 },
  });
}
