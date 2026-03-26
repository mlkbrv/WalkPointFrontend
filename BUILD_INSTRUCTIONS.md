# Сборка WalkPoint

## Вариант 1: EAS Build (облако Expo) — рекомендуется

Сборка в облаке Expo, без Android Studio на компьютере.

### Шаг 1. Установите EAS CLI
```bash
npm install -g eas-cli
```

### Шаг 2. Войдите в аккаунт Expo
```bash
eas login
```
Если нет аккаунта — создайте на [expo.dev](https://expo.dev)

### Шаг 3. Соберите APK
```bash
cd MotherApp/WalkPoint
eas build --platform android --profile preview
```

- `preview` — APK для тестирования (внутренняя рассылка)
- `production` — APK для публикации
- `development` — сборка с dev client

После сборки будет ссылка на скачивание APK.

---

## Вариант 2: Локальная сборка (Expo Dev Client)

Нужны: Android Studio, JDK, Android SDK.

```bash
cd MotherApp/WalkPoint
npx expo run:android
```

Соберёт APK в `android/app/build/outputs/` или установит на подключённый эмулятор/устройство.

---

## Вариант 3: Локальная production-сборка AAB/APK

```bash
cd MotherApp/WalkPoint/android
./gradlew assembleRelease
```

APK будет в `app/build/outputs/apk/release/app-release.apk`
