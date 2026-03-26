import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Footprints } from 'lucide-react-native';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS_ANDROID = [
  { n: 1, text: 'Откройте Health Connect (устанавливается из Google Play, если ещё нет).' },
  { n: 2, text: 'В приложении WalkPoint нажмите «Подключить шаги» и выберите WalkPoint в списке приложений.' },
  { n: 3, text: 'Включите доступ к «Шаги» для WalkPoint.' },
  { n: 4, text: 'Если пользуетесь Samsung Health: откройте Samsung Health → Настройки → Health Connect → включите обмен данными «Шаги».' },
  { n: 5, text: 'Готово. Шаги будут синхронизироваться автоматически.' },
];

const STEPS_IOS = [
  { n: 1, text: 'Откройте «Здоровье» (Health) на iPhone.' },
  { n: 2, text: 'Нажмите «Обзор» → «Активность» → «Шаги».' },
  { n: 3, text: 'Нажмите «Показать все данные» и включите доступ для WalkPoint.' },
  { n: 4, text: 'Разрешите чтение данных о шагах при запросе от приложения.' },
  { n: 5, text: 'Готово. Шаги будут синхронизироваться автоматически.' },
];

export default function HowToConnectStepsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const steps = Platform.OS === 'android' ? STEPS_ANDROID : STEPS_IOS;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#000000" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Как подключить шаги</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrapper}>
          <Footprints size={48} color="#8140F3" strokeWidth={2} />
        </View>
        <Text style={styles.subtitle}>
          {Platform.OS === 'android'
            ? 'WalkPoint использует Health Connect для получения данных о шагах на Android.'
            : 'WalkPoint использует Apple Health для получения данных о шагах на iPhone.'}
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
        <Text style={styles.footer}>
          Если шаги не приходят — убедитесь, что приложение‑источник (Samsung Health, Google Fit и др.) передаёт данные в Health Connect.
        </Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  stepsList: {
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8140F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  footer: {
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
