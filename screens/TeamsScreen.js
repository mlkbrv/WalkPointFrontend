import { StatusBar } from 'expo-status-bar';
import { UsersRound } from 'lucide-react-native';
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
import { createTeam, getTeams, joinTeam } from '../services/apiService';

export default function TeamsScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getTeams()
      .then((d) => setTeams(Array.isArray(d) ? d : []))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader title={t('features.teams')} onBack={() => navigation.goBack()} />
      <View style={styles.form}>
        <Text style={styles.formTitle}>{t('teams.createSection')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('teams.name')}
          placeholderTextColor={c.textMuted}
          value={name}
          onChangeText={setName}
        />
        <PrimaryButton
          label={t('teams.create')}
          loading={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await createTeam(name);
              setName('');
              load();
            } catch (e) {
              Alert.alert(t('common.error'), e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
        <Text style={[styles.formTitle, styles.formTitleSpaced]}>{t('teams.joinSection')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('teams.joinCode')}
          placeholderTextColor={c.textMuted}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
        <PrimaryButton
          label={t('teams.join')}
          variant="secondary"
          onPress={async () => {
            try {
              await joinTeam(code);
              setCode('');
              load();
            } catch (e) {
              Alert.alert(t('common.error'), e.message);
            }
          }}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <UsersRound size={20} color={c.primary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.code}>{t('teams.code', { code: item.invite_code })}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('teams.empty')}</Text>}
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
    form: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      gap: spacing.sm,
      ...shadow.card,
    },
    formTitle: { fontSize: 13, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase' },
    formTitleSpaced: { marginTop: spacing.sm },
    input: {
      backgroundColor: c.screenBg,
      borderRadius: radii.md,
      padding: 12,
      borderWidth: 1,
      borderColor: c.cardBorder,
      fontSize: 16,
      color: c.textPrimary,
    },
    loader: { marginTop: 16 },
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
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: radii.sm,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1 },
    rowTitle: { fontWeight: '700', fontSize: 16, color: c.textPrimary },
    code: { color: c.textSecondary, marginTop: 4, fontSize: 13 },
    empty: { textAlign: 'center', color: c.textSecondary, marginTop: 24 },
  });
}
