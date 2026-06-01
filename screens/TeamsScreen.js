import { StatusBar } from 'expo-status-bar';
import { UsersRound } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
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
import { colors, radii, shadow, spacing } from '../constants/theme';
import { createTeam, getTeams, joinTeam } from '../services/apiService';

export default function TeamsScreen() {
  const { t } = useTranslation();
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
      <StatusBar style="dark" />
      <ScreenHeader title={t('features.teams')} onBack={() => navigation.goBack()} />
      <View style={styles.form}>
        <Text style={styles.formTitle}>{t('teams.createSection')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('teams.name')}
          placeholderTextColor={colors.textMuted}
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
          placeholderTextColor={colors.textMuted}
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
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <UsersRound size={20} color={colors.primary} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadow.card,
  },
  formTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  formTitleSpaced: { marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
  },
  loader: { marginTop: 16 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  code: { color: colors.textSecondary, marginTop: 4, fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 24 },
});
