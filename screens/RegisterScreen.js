import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { Footprints } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromRoute = route?.params?.ref;
    if (fromRoute) {
      setReferralCode(String(fromRoute));
      return;
    }
    const applyUrl = (url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const ref = parsed.queryParams?.ref;
      if (ref) setReferralCode(String(ref));
    };
    Linking.getInitialURL().then(applyUrl);
    const sub = Linking.addEventListener('url', ({ url }) => applyUrl(url));
    return () => sub.remove();
  }, [route?.params?.ref]);

  const handleRegister = async () => {
    if (!email || !password || !firstName) {
      setError(t('auth.fillRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordMin'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        referral_code: referralCode.trim(),
      });
    } catch (e) {
      setError(e.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Footprints size={40} color={c.onPrimary} />
          </View>
          <Text style={styles.appName}>{t('auth.createAccount')}</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder={t('auth.firstNameRequired')}
            placeholderTextColor={c.textMuted}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.lastName')}
            placeholderTextColor={c.textMuted}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.emailRequired')}
            placeholderTextColor={c.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.passwordHint')}
            placeholderTextColor={c.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.referralCode')}
            placeholderTextColor={c.textMuted}
            autoCapitalize="characters"
            value={referralCode}
            onChangeText={setReferralCode}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>{t('auth.signUp')}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>
              {t('auth.haveAccount')}{' '}
              <Text style={styles.linkBold}>{t('auth.logInBold')}</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { radii } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    inner: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    appName: {
      fontSize: 28,
      fontWeight: '800',
      color: c.textPrimary,
    },
    form: {
      gap: 14,
    },
    errorText: {
      color: c.danger,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '500',
    },
    input: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      paddingHorizontal: 20,
      paddingVertical: 16,
      fontSize: 16,
      color: c.textPrimary,
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: radii.lg,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: c.onPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    linkText: {
      textAlign: 'center',
      color: c.textSecondary,
      fontSize: 14,
      marginTop: 8,
    },
    linkBold: {
      color: c.primary,
      fontWeight: '700',
    },
  });
}
