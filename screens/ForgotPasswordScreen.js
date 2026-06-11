import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { confirmPasswordReset, requestPasswordReset } from '../services/apiService';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onRequest = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      Alert.alert(t('common.info'), t('auth.resetEmailSent'));
      setStep('confirm');
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    setLoading(true);
    try {
      await confirmPasswordReset(uid.trim(), token.trim(), password);
      Alert.alert(t('common.success'), t('auth.resetDone'));
      navigation.navigate('Login');
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
      {step === 'request' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor={c.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable style={styles.btn} onPress={onRequest} disabled={loading}>
            {loading ? <ActivityIndicator color={c.onPrimary} /> : <Text style={styles.btnText}>{t('auth.sendReset')}</Text>}
          </Pressable>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="uid" placeholderTextColor={c.textMuted} value={uid} onChangeText={setUid} />
          <TextInput style={styles.input} placeholder="token" placeholderTextColor={c.textMuted} value={token} onChangeText={setToken} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.passwordHint')}
            placeholderTextColor={c.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable style={styles.btn} onPress={onConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color={c.onPrimary} /> : <Text style={styles.btnText}>{t('auth.setPassword')}</Text>}
          </Pressable>
        </>
      )}
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>{t('common.back')}</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { radii } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg, padding: 24, paddingTop: 80 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 24, textAlign: 'center', color: c.textPrimary },
    input: {
      backgroundColor: c.card,
      borderRadius: radii.md,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.inputBorder,
      color: c.textPrimary,
    },
    btn: {
      backgroundColor: c.primary,
      borderRadius: radii.md,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    btnText: { color: c.onPrimary, fontWeight: '700' },
    link: { textAlign: 'center', color: c.primary, fontWeight: '600' },
  });
}
