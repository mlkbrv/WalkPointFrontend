import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Footprints } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function HowToConnectStepsScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const steps = useMemo(() => {
    const raw =
      Platform.OS === 'android'
        ? t('howTo.androidSteps', { returnObjects: true })
        : t('howTo.iosSteps', { returnObjects: true });
    const list = Array.isArray(raw) ? raw : [];
    return list.map((text, i) => ({ n: i + 1, text }));
  }, [t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#000000" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('howTo.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrapper}>
          <Footprints size={48} color="#8140F3" strokeWidth={2} />
        </View>
        <Text style={styles.subtitle}>
          {Platform.OS === 'android' ? t('howTo.subtitleAndroid') : t('howTo.subtitleIos')}
        </Text>
        <View style={styles.stepsList}>
          {steps.map((s) => (
            <View key={s.n} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{s.n}</Text>
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>
        {Platform.OS === 'android' ? (
          <Text style={styles.footer}>{t('howTo.footerAndroid')}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  iconWrapper: {
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  stepsList: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5E35B1',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  footer: {
    marginTop: 28,
    fontSize: 13,
    lineHeight: 20,
    color: '#888',
    textAlign: 'center',
  },
});
