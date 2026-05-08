import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Animated, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { BottomTabBar, createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TabBarVisibilityProvider, useTabBarTranslateY } from './src/lib/tabBarVisibility';

import { hasSession, getMe } from './src/lib/api';
import { colors } from './src/lib/theme';
import { initLocale } from './src/lib/i18n';
import { t, useLocale } from './src/lib/useLocale';

import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { VoiceSignupScreen } from './src/screens/VoiceSignupScreen';
import { PendingVerificationScreen } from './src/screens/PendingVerificationScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CaseTrackerScreen } from './src/screens/CaseTrackerScreen';
import { CaseDetailScreen } from './src/screens/CaseDetailScreen';
import { AppointmentsScreen } from './src/screens/AppointmentsScreen';
import { FileCaseScreen } from './src/screens/FileCaseScreen';
import { SpeakToUsScreen } from './src/screens/SpeakToUsScreen';
import { SOSScreen } from './src/screens/SOSScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RtpsScreen } from './src/screens/RtpsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackScreenOptions = { headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text };

function DashboardStack() {
  useLocale();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CaseTracker" component={CaseTrackerScreen} options={{ title: t('track_title') }} />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={({ route }) => ({ title: (route.params as any)?.title ?? t('detail_history') })}
      />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: t('apts_title') }} />
      <Stack.Screen name="FileCase" component={FileCaseScreen} options={{ title: t('file_title') }} />
      <Stack.Screen name="SpeakToUs" component={SpeakToUsScreen} options={{ title: t('speak_title') }} />
      <Stack.Screen name="SOS" component={SOSScreen} options={{ title: t('sos_title') }} />
      <Stack.Screen name="Rtps" component={RtpsScreen} options={{ title: 'Schemes & Rights' }} />
    </Stack.Navigator>
  );
}

function CasesStack() {
  useLocale();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="CasesHome" component={CaseTrackerScreen} options={{ title: t('track_title') }} />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={({ route }) => ({ title: (route.params as any)?.title ?? t('detail_history') })}
      />
    </Stack.Navigator>
  );
}

function VoiceStack() {
  useLocale();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="VoiceHome" component={SpeakToUsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SOS" component={SOSScreen} options={{ title: t('sos_title') }} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: t('apts_title') }} />
    </Stack.Navigator>
  );
}

function AnimatedTabBar(props: BottomTabBarProps) {
  const translateY = useTabBarTranslateY();
  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        transform: [{ translateY: translateY ?? 0 }],
      }}>
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

function MainTabs({ onLoggedOut }: { onLoggedOut: () => void }) {
  // Re-render when the user changes language so tab labels translate too.
  useLocale();
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}>
      <Tab.Screen name="Home" component={DashboardStack} options={{ tabBarLabel: t('dash_hi'), tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Cases" component={CasesStack} options={{ tabBarLabel: t('track_title'), tabBarIcon: tabIcon('📂') }} />
      <Tab.Screen name="Voice" component={VoiceStack} options={{ tabBarLabel: t('dash_speak'), tabBarIcon: tabIcon('🎤') }} />
      <Tab.Screen name="Rtps" component={RtpsScreen} options={{ tabBarLabel: 'Schemes', tabBarIcon: tabIcon('📜') }} />
      <Tab.Screen name="Me" options={{ tabBarLabel: t('profile_title'), tabBarIcon: tabIcon('👤') }}>
        {() => <ProfileScreen onLoggedOut={onLoggedOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function tabIcon(emoji: string) {
  // eslint-disable-next-line react/display-name
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.7, color }}>{emoji}</Text>
  );
}

type AuthState = 'loading' | 'login' | 'signup' | 'voiceSignup' | 'pending' | 'in';

function isVerified(status?: string) {
  return status === 'verified' || status === 'approved';
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [pendingEmail, setPendingEmail] = useState<string | undefined>(undefined);

  const bootstrap = useCallback(async () => {
    await initLocale();
    if (!(await hasSession())) { setAuthState('login'); return; }
    const me = await getMe();
    if (!me) { setAuthState('login'); return; }
    if (me.role !== 'community') { setAuthState('login'); return; }
    if (!isVerified(me.communityProfile?.verificationStatus)) {
      setPendingEmail(me.email);
      setAuthState('pending');
      return;
    }
    setAuthState('in');
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const afterLogin = useCallback(async () => {
    const me = await getMe();
    if (me && !isVerified(me.communityProfile?.verificationStatus)) {
      setPendingEmail(me.email);
      setAuthState('pending');
    } else {
      setAuthState('in');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {authState === 'loading' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : authState === 'login' ? (
        <LoginScreen
          onLoggedIn={afterLogin}
          onSignUp={() => setAuthState('signup')}
          onVoiceSignUp={() => setAuthState('voiceSignup')}
        />
      ) : authState === 'voiceSignup' ? (
        <VoiceSignupScreen
          onRegistered={() => { setPendingEmail(undefined); setAuthState('pending'); }}
          onBackToLogin={() => setAuthState('login')}
          onUseEmailSignup={() => setAuthState('signup')}
        />
      ) : authState === 'signup' ? (
        <SignupScreen
          onRegistered={(email) => { setPendingEmail(email); setAuthState('pending'); }}
          onBackToLogin={() => setAuthState('login')}
        />
      ) : authState === 'pending' ? (
        <PendingVerificationScreen
          email={pendingEmail}
          onVerified={() => setAuthState('in')}
          onSignOut={() => { setPendingEmail(undefined); setAuthState('login'); }}
        />
      ) : (
        <TabBarVisibilityProvider>
          <NavigationContainer>
            <MainTabs onLoggedOut={() => setAuthState('login')} />
          </NavigationContainer>
        </TabBarVisibilityProvider>
      )}
    </SafeAreaProvider>
  );
}
