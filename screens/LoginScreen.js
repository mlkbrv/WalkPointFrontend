import { LinearGradient } from 'expo-linear-gradient';
import { Footprints } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import PrimaryButton from '../components/ui/PrimaryButton';
import TextField from '../components/ui/TextField';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(e.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={theme.gradients.hero} style={styles.hero}>
        <View style={styles.logoCircle}>
          <Footprints size={40} color={c.onPrimary} />
        </View>
        <Text style={styles.appName}>STRIDE</Text>
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>
      </LinearGradient>
      <KeyboardAvoidingView
        style={styles.formWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TextField
            placeholder={t('auth.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            placeholder={t('auth.password')}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <PrimaryButton
            label={t('auth.logIn')}
            variant="gradient"
            loading={loading}
            onPress={handleLogin}
          />
          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              {t('auth.signUpLink')}{' '}
              <Text style={styles.linkBold}>{t('auth.signUpBold')}</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { typography, spacing, radii } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.screenBg },
    hero: {
      paddingTop: 72,
      paddingBottom: 40,
      alignItems: 'center',
      borderBottomLeftRadius: radii.xl,
      borderBottomRightRadius: radii.xl,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    appName: { ...typography.titleLarge, color: c.onPrimary, fontSize: 32 },
    tagline: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    formWrap: { flex: 1, justifyContent: 'center' },
    form: { paddingHorizontal: spacing.lg, gap: 4 },
    errorText: { ...typography.caption, color: c.danger, textAlign: 'center', marginBottom: spacing.sm },
    forgotText: { ...typography.caption, color: c.primary, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
    linkText: { ...typography.caption, color: c.textMuted, textAlign: 'center', marginTop: spacing.sm },
    linkBold: { color: c.primary, fontWeight: '700' },
  });
}
