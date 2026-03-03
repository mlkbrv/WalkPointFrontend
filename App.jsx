import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
let NavigationBar = {};
try {
  NavigationBar = require('expo-navigation-bar');
} catch (_) {}
import { BarChart3, Home, MapPin, ShoppingBag, Trophy, User } from 'lucide-react-native';
import React, { lazy, Suspense, useEffect } from 'react';
import { ActivityIndicator, AppRegistry, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

enableScreens(true);

import AccountScreen from './screens/AccountScreen';
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

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 70;
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);
  const tabBarTotalHeight = tabBarHeight + insets.bottom;

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
        component={AccountScreen}
        options={{
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

function App() {
  useEffect(() => {
    if (Platform.OS === 'android' && NavigationBar.setPositionAsync) {
      NavigationBar.setPositionAsync('absolute').catch(() => {});
      NavigationBar.setBackgroundColorAsync('#ffffff').catch(() => {});
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
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
