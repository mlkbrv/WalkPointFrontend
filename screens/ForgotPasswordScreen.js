import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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
import { confirmPasswordReset, requestPasswordReset } from '../services/apiService';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
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
      <StatusBar style="dark" />
      <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
      {step === 'request' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable style={styles.btn} onPress={onRequest} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{t('auth.sendReset')}</Text>}
          </Pressable>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="uid" value={uid} onChangeText={setUid} />
          <TextInput style={styles.input} placeholder="token" value={token} onChangeText={setToken} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.passwordHint')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable style={styles.btn} onPress={onConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{t('auth.setPassword')}</Text>}
          </Pressable>
        </>
      )}
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>{t('common.back')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 24, textAlign: 'center' },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  btn: {
    backgroundColor: '#8140F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: { color: '#FFF', fontWeight: '700' },
  link: { textAlign: 'center', color: '#8140F3', fontWeight: '600' },
});
