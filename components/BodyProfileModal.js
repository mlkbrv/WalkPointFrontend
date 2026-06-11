import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const parseNum = (s) => {
  const t = String(s ?? '').trim().replace(',', '.');
  const n = parseFloat(t, 10);
  return Number.isFinite(n) ? n : NaN;
};

export default function BodyProfileModal({
  visible,
  initialWeightKg,
  initialHeightCm,
  onSave,
  onLater,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [weightText, setWeightText] = useState('');
  const [heightText, setHeightText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setWeightText(
      initialWeightKg != null && Number.isFinite(initialWeightKg)
        ? String(Math.round(initialWeightKg * 10) / 10)
        : '',
    );
    setHeightText(
      initialHeightCm != null && Number.isFinite(initialHeightCm)
        ? String(Math.round(initialHeightCm))
        : '',
    );
    setError('');
  }, [visible, initialWeightKg, initialHeightCm]);

  const handleSave = async () => {
    const w = parseNum(weightText);
    const h = parseNum(heightText);
    if (!Number.isFinite(w) || w < 20 || w > 400) {
      setError(t('bodyProfile.errorWeight'));
      return;
    }
    if (!Number.isFinite(h) || h < 40 || h > 260) {
      setError(t('bodyProfile.errorHeight'));
      return;
    }
    setError('');
    await onSave(w, h);
  };

  const handleLater = async () => {
    setError('');
    await onLater();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleLater}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleLater} />
        <View
          style={[
            styles.sheet,
            {
              marginBottom: Math.max(insets.bottom, 16),
              marginHorizontal: 20,
            },
          ]}
        >
          <Text style={styles.title}>{t('bodyProfile.title')}</Text>
          <Text style={styles.subtitle}>{t('bodyProfile.subtitle')}</Text>

          <Text style={styles.label}>{t('bodyProfile.weightLabel')}</Text>
          <TextInput
            style={styles.input}
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="decimal-pad"
            placeholder={t('bodyProfile.weightPlaceholder')}
            placeholderTextColor="#9CA3AF"
            maxLength={6}
          />

          <Text style={styles.label}>{t('bodyProfile.heightLabel')}</Text>
          <TextInput
            style={styles.input}
            value={heightText}
            onChangeText={setHeightText}
            keyboardType="number-pad"
            placeholder={t('bodyProfile.heightPlaceholder')}
            placeholderTextColor="#9CA3AF"
            maxLength={5}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primaryBtn} onPress={handleSave} android_ripple={{ color: 'rgba(255,255,255,0.3)' }}>
            <Text style={styles.primaryBtnText}>{t('common.save')}</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={handleLater} android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
            <Text style={styles.secondaryBtnText}>{t('bodyProfile.later')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#111827',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: c.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: c.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  });
}
