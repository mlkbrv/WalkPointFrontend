import './i18n/config';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
let NavigationBar = {};
try {
  NavigationBar = require('expo-navigation-bar');
} catch (_) {}
import { BarChart3, Home, MapPin, ShoppingBag, Trophy, User } from 'lucide-react-native';
import React, { Component, lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from './context/AppContext';
import { ActivityIndicator, AppRegistry, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import i18n, { loadStoredLanguage } from './i18n/config';

enableScreens(true);

import AccountScreen from './screens/AccountScreen';
import HowToConnectStepsScreen from './screens/HowToConnectStepsScreen';
import CouponDetailScreen from './screens/CouponDetailScreen';
import CouponRedeemScreen from './screens/CouponRedeemScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import MarketScreen from './screens/MarketScreen';
import MyCouponsScreen from './screens/MyCouponsScreen';
import RegisterScreen from './screens/RegisterScreen';
import ScoreboardScreen from './screens/ScoreboardScreen';

const ReportScreen = lazy(() => import('./screens/ReportScreen'));
const HistoryScreen = lazy(() => import('./screens/HistoryScreen'));
const TrackScreen = lazy(() => import('./screens/TrackScreen'));

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const MarketStack = createStackNavigator();

function ReportStackNav() {
  return (
    <Suspense fallback={<View style={styles.loadingContainer}><ActivityIndicator size="large" color="#8140F3" /></View>}>
      <Stack.Navigator screenOptions={{ headerShown: false, detachInactiveScreens: true }}>
        <Stack.Screen name="ReportMain" component={ReportScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </Suspense>
  );
}

function MarketStackNav() {
  return (
    <MarketStack.Navigator screenOptions={{ headerShown: false, detachInactiveScreens: true }} initialRouteName="MyCoupons">
      <MarketStack.Screen name="MyCoupons" component={MyCouponsScreen} />
      <MarketStack.Screen name="CouponStore" component={MarketScreen} />
      <MarketStack.Screen name="CouponDetail" component={CouponDetailScreen} />
      <MarketStack.Screen name="CouponRedeem" component={CouponRedeemScreen} />
    </MarketStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AccountStackNav() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, detachInactiveScreens: true }}>
      <Stack.Screen name="AccountMain" component={AccountScreen} />
      <Stack.Screen name="HowToConnectSteps" component={HowToConnectStepsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { startStepTracking } = useApp();
  const tabBarHeight = 70;
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);
  const tabBarTotalHeight = tabBarHeight + insets.bottom;

  // Single place to start step counting when user enters the app (Home and Track no longer start it separately).
  useEffect(() => {
    startStepTracking();
  }, [startStepTracking]);

  return (
    <Suspense fallback={<View style={styles.loadingContainer}><ActivityIndicator size="large" color="#8140F3" /></View>}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        detachInactiveScreens: true,
        tabBarActiveTintColor: '#8140F3',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          paddingTop: 8,
          paddingBottom: tabBarPaddingBottom,
          height: tabBarTotalHeight,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Home size={22} color={focused ? '#8140F3' : '#999999'} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Track"
        component={TrackScreen}
        options={{
          lazy: true,
          tabBarLabel: t('tabs.track'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MapPin size={22} color={focused ? '#8140F3' : '#999999'} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Market"
        component={MarketStackNav}
        options={{
          tabBarLabel: t('tabs.market'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <ShoppingBag size={22} color={focused ? '#8140F3' : '#999999'} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportStackNav}
        options={{
          tabBarLabel: t('tabs.report'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <BarChart3 size={22} color={focused ? '#8140F3' : '#999999'} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Scoreboard"
        component={ScoreboardScreen}
        options={{
          tabBarLabel: t('tabs.scoreboard'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Trophy size={22} color={focused ? '#8140F3' : '#999999'} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackNav}
        options={{
          tabBarLabel: t('tabs.account'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <User size={22} color={focused ? '#8140F3' : '#999999'} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
    </Suspense>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8140F3" />
      </View>
    );
  }

  return isAuthenticated ? (
    <AppProvider>
      <MainTabs />
    </AppProvider>
  ) : (
    <AuthNavigator />
  );
}

class AppErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary:', error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.loadingContainer, { padding: 24 }]}>
          <Text style={{ fontSize: 16, color: '#333', textAlign: 'center' }}>
            {i18n.t('appError.title')}
          </Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 12 }} selectable>
            {this.state.error?.message || String(this.state.error)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    loadStoredLanguage();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && NavigationBar.setPositionAsync) {
      NavigationBar.setPositionAsync('absolute').catch(() => {});
      NavigationBar.setBackgroundColorAsync('#ffffff').catch(() => {});
    }
  }, []);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 30,
    height: 3,
    backgroundColor: '#8140F3',
    borderRadius: 2,
  },
});

export default App;

AppRegistry.registerComponent('main', () => App);
