import './i18n/config';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';

import { createStackNavigator } from '@react-navigation/stack';

let NavigationBar = {};

try {

  NavigationBar = require('expo-navigation-bar');

} catch (_) {}

import { Home, MapPin, ShoppingBag, User, Users } from 'lucide-react-native';

import { StatusBar } from 'expo-status-bar';

import React, { Component, lazy, Suspense, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { ActivityIndicator, AppRegistry, Platform, StyleSheet, Text, View } from 'react-native';

import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { enableScreens } from 'react-native-screens';

import { ThemeProvider, useTheme } from './context/ThemeContext';



import { AppProvider, useApp } from './context/AppContext';

import { AuthProvider, useAuth } from './context/AuthContext';

import i18n, { loadStoredLanguage } from './i18n/config';



enableScreens(true);



import AccountScreen from './screens/AccountScreen';

import AccountPrivacyScreen from './screens/AccountPrivacyScreen';

import AccountSettingsScreen from './screens/AccountSettingsScreen';

import HowToConnectStepsScreen from './screens/HowToConnectStepsScreen';

import PartnerHubScreen from './screens/PartnerHubScreen';

import TransactionsScreen from './screens/TransactionsScreen';

import StreaksScreen from './screens/StreaksScreen';

import ChallengesScreen from './screens/ChallengesScreen';

import AchievementsScreen from './screens/AchievementsScreen';

import FriendsScreen from './screens/FriendsScreen';

import TeamsScreen from './screens/TeamsScreen';

import FavoritesScreen from './screens/FavoritesScreen';

import BoostShopScreen from './screens/BoostShopScreen';

import PremiumScreen from './screens/PremiumScreen';

import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

import NotificationSettingsScreen from './screens/NotificationSettingsScreen';

import * as Linking from 'expo-linking';

import CouponDetailScreen from './screens/CouponDetailScreen';

import CouponRedeemScreen from './screens/CouponRedeemScreen';

import HomeScreen from './screens/HomeScreen';

import LoginScreen from './screens/LoginScreen';

import MarketScreen from './screens/MarketScreen';

import MyCouponsScreen from './screens/MyCouponsScreen';

import RegisterScreen from './screens/RegisterScreen';

import ScoreboardScreen from './screens/ScoreboardScreen';

import BrandStoreScreen from './screens/BrandStoreScreen';

import NotificationsScreen from './screens/NotificationsScreen';

const WorkoutSummaryScreen = lazy(() => import('./screens/WorkoutSummaryScreen'));

const SecureVerificationScreen = lazy(() => import('./screens/SecureVerificationScreen'));

const ReportScreen = lazy(() => import('./screens/ReportScreen'));

const HistoryScreen = lazy(() => import('./screens/HistoryScreen'));

const TrackScreen = lazy(() => import('./screens/TrackScreen'));



const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();

const AuthStack = createStackNavigator();

const MarketStack = createStackNavigator();

const HomeStack = createStackNavigator();

const SocialStack = createStackNavigator();

const ProfileStack = createStackNavigator();

const RootStack = createStackNavigator();

const stackScreenOptions = { headerShown: false, detachInactiveScreens: true };



function ThemedLoading() {

  const { theme } = useTheme();

  return (

    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.screenBg }]}>

      <ActivityIndicator size="large" color={theme.colors.primary} />

    </View>

  );

}



function HomeStackNav() {

  return (

    <Suspense fallback={<ThemedLoading />}>

      <HomeStack.Navigator screenOptions={stackScreenOptions}>

        <HomeStack.Screen name="HomeMain" component={HomeScreen} />

        <HomeStack.Screen name="ReportMain" component={ReportScreen} />

        <HomeStack.Screen name="History" component={HistoryScreen} />

        <HomeStack.Screen name="Streaks" component={StreaksScreen} />

        <HomeStack.Screen name="Challenges" component={ChallengesScreen} />

        <HomeStack.Screen name="Achievements" component={AchievementsScreen} />

        <HomeStack.Screen name="BrandStore" component={BrandStoreScreen} />

        <HomeStack.Screen name="Notifications" component={NotificationsScreen} />

        <HomeStack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />

        <HomeStack.Screen name="SecureVerification" component={SecureVerificationScreen} />

      </HomeStack.Navigator>

    </Suspense>

  );

}



function SocialStackNav() {

  return (

    <SocialStack.Navigator screenOptions={stackScreenOptions}>

      <SocialStack.Screen name="SocialMain" component={ScoreboardScreen} />

      <SocialStack.Screen name="Friends" component={FriendsScreen} />

      <SocialStack.Screen name="Teams" component={TeamsScreen} />

      <SocialStack.Screen name="Challenges" component={ChallengesScreen} />

      <SocialStack.Screen name="Streaks" component={StreaksScreen} />

    </SocialStack.Navigator>

  );

}



function ProfileStackNav() {

  return (

    <ProfileStack.Navigator screenOptions={stackScreenOptions}>

      <ProfileStack.Screen name="ProfileMain" component={AccountScreen} />

      <ProfileStack.Screen name="AccountSettings" component={AccountSettingsScreen} />

      <ProfileStack.Screen name="AccountPrivacy" component={AccountPrivacyScreen} />

      <ProfileStack.Screen name="HowToConnectSteps" component={HowToConnectStepsScreen} />

      <ProfileStack.Screen name="Transactions" component={TransactionsScreen} />

      <ProfileStack.Screen name="PartnerHub" component={PartnerHubScreen} />

      <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />

    </ProfileStack.Navigator>

  );

}



function MarketStackNav() {

  return (

    <MarketStack.Navigator screenOptions={stackScreenOptions} initialRouteName="CouponStore">

      <MarketStack.Screen name="CouponStore" component={MarketScreen} />

      <MarketStack.Screen name="MyCoupons" component={MyCouponsScreen} />

      <MarketStack.Screen name="CouponDetail" component={CouponDetailScreen} />

      <MarketStack.Screen name="BrandStore" component={BrandStoreScreen} />

      <MarketStack.Screen name="SecureVerification" component={SecureVerificationScreen} />

      <MarketStack.Screen name="Notifications" component={NotificationsScreen} />

      <MarketStack.Screen name="CouponRedeem" component={CouponRedeemScreen} />

      <MarketStack.Screen name="Favorites" component={FavoritesScreen} />

      <MarketStack.Screen name="BoostShop" component={BoostShopScreen} />

      <MarketStack.Screen name="Premium" component={PremiumScreen} />

    </MarketStack.Navigator>

  );

}



function AuthNavigator() {

  return (

    <AuthStack.Navigator screenOptions={{ headerShown: false }}>

      <AuthStack.Screen name="Login" component={LoginScreen} />

      <AuthStack.Screen name="Register" component={RegisterScreen} />

      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

    </AuthStack.Navigator>

  );

}



const linking = {

  prefixes: [Linking.createURL('/'), 'walkpoint://'],

  config: {

    screens: {

      Register: {

        path: 'register',

        parse: {

          ref: (ref) => (ref ? String(ref) : ''),

        },

      },

      ForgotPassword: 'forgot-password',

    },

  },

};



function TabIcon({ focused, Icon, isTrack }) {

  const { theme } = useTheme();

  const tint = focused ? theme.colors.primary : theme.colors.textMuted;

  const size = isTrack && focused ? 26 : 22;



  return (

    <View style={styles.iconContainer}>

      {isTrack && focused ? (

        <View style={[styles.trackRing, { borderColor: theme.colors.accent }]}>

          <Icon size={size} color={tint} strokeWidth={2.5} />

        </View>

      ) : (

        <Icon size={size} color={tint} strokeWidth={focused ? 2.5 : 2} />

      )}

      {focused && (

        <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />

      )}

    </View>

  );

}



function MainTabs() {

  const { t } = useTranslation();

  const { theme, isDark } = useTheme();

  const insets = useSafeAreaInsets();

  const { startStepTracking } = useApp();

  const tb = theme.tabBar;

  const tabBarPaddingBottom = Math.max(insets.bottom, tb.paddingBottomMin);

  const tabBarTotalHeight = tb.height + insets.bottom;



  useEffect(() => {

    startStepTracking();

  }, [startStepTracking]);



  return (

    <Suspense fallback={<ThemedLoading />}>

      <Tab.Navigator

        screenOptions={{

          headerShown: false,

          detachInactiveScreens: true,

          tabBarActiveTintColor: tb.activeTint,

          tabBarInactiveTintColor: tb.inactiveTint,

          tabBarStyle: {

            backgroundColor: tb.bg,

            borderTopWidth: 1,

            borderTopColor: tb.border,

            paddingTop: 8,

            paddingBottom: tabBarPaddingBottom,

            height: tabBarTotalHeight,

            shadowColor: theme.colors.shadowColor,

            shadowOffset: { width: 0, height: -2 },

            shadowOpacity: isDark ? 0.3 : 0.05,

            shadowRadius: 8,

            elevation: 8,

          },

          tabBarLabelStyle: tb.labelStyle,

          tabBarIconStyle: tb.iconStyle,

        }}

      >

        <Tab.Screen

          name="Home"

          component={HomeStackNav}

          options={{

            tabBarLabel: t('tabs.home'),

            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Home} />,

          }}

        />

        <Tab.Screen

          name="Track"

          component={TrackScreen}

          options={{

            lazy: true,

            tabBarLabel: t('tabs.track'),

            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={MapPin} isTrack />,

          }}

        />

        <Tab.Screen

          name="Market"

          component={MarketStackNav}

          options={{

            tabBarLabel: t('tabs.store'),

            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={ShoppingBag} />,

          }}

        />

        <Tab.Screen

          name="Social"

          component={SocialStackNav}

          options={{

            tabBarLabel: t('tabs.social'),

            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Users} />,

          }}

        />

        <Tab.Screen

          name="Profile"

          component={ProfileStackNav}

          options={{

            tabBarLabel: t('tabs.profile'),

            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={User} />,

          }}

        />

      </Tab.Navigator>

    </Suspense>

  );

}



function RootNavigator() {

  const { isAuthenticated, isLoading } = useAuth();

  const { theme } = useTheme();



  if (isLoading) {

    return <ThemedLoading />;

  }



  return isAuthenticated ? (

    <AppProvider>

      <RootStack.Navigator screenOptions={stackScreenOptions}>

        <RootStack.Screen name="MainTabs" component={MainTabs} />

        <RootStack.Screen name="Notifications" component={NotificationsScreen} />

        <RootStack.Screen name="BrandStore" component={BrandStoreScreen} />

        <RootStack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />

        <RootStack.Screen name="SecureVerification" component={SecureVerificationScreen} />

      </RootStack.Navigator>

    </AppProvider>

  ) : (

    <AuthNavigator />

  );

}



function NavigationRoot() {

  const { theme, isDark } = useTheme();

  const navTheme = isDark

    ? {

        ...DarkTheme,

        colors: {

          ...DarkTheme.colors,

          primary: theme.colors.primary,

          background: theme.colors.screenBg,

          card: theme.colors.card,

          text: theme.colors.textPrimary,

          border: theme.colors.cardBorder,

        },

      }

    : {

        ...DefaultTheme,

        colors: {

          ...DefaultTheme.colors,

          primary: theme.colors.primary,

          background: theme.colors.screenBg,

          card: theme.colors.card,

          text: theme.colors.textPrimary,

          border: theme.colors.cardBorder,

        },

      };



  return (

    <>

      <StatusBar style={isDark ? 'light' : 'dark'} />

      <NavigationContainer linking={linking} theme={navTheme}>

        <RootNavigator />

      </NavigationContainer>

    </>

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

        <View style={[styles.loadingContainer, { padding: 24, backgroundColor: '#F5F3FF' }]}>

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

  const { theme, isDark } = useTheme();



  useEffect(() => {

    loadStoredLanguage();

  }, []);



  useEffect(() => {

    if (Platform.OS === 'android' && NavigationBar.setBackgroundColorAsync) {

      NavigationBar.setBackgroundColorAsync(theme.colors.tabBarBg).catch(() => {});

    }

  }, [theme.colors.tabBarBg]);



  return (

    <AppErrorBoundary>

      <SafeAreaProvider>

        <AuthProvider>

          <NavigationRoot />

        </AuthProvider>

      </SafeAreaProvider>

    </AppErrorBoundary>

  );

}



function AppWithTheme() {

  return (

    <ThemeProvider>

      <App />

    </ThemeProvider>

  );

}



const styles = StyleSheet.create({

  loadingContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

  iconContainer: {

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',

  },

  trackRing: {

    width: 44,

    height: 44,

    borderRadius: 22,

    borderWidth: 2,

    alignItems: 'center',

    justifyContent: 'center',

  },

  activeIndicator: {

    position: 'absolute',

    bottom: -8,

    width: 30,

    height: 3,

    borderRadius: 2,

  },

});



export default AppWithTheme;



AppRegistry.registerComponent('main', () => AppWithTheme);


