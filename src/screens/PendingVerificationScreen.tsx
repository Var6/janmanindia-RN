import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMe, logout } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';

export function PendingVerificationScreen({
  email,
  onVerified,
  onSignOut,
}: {
  email?: string;
  onVerified: () => void;
  onSignOut: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');

  async function refresh() {
    setChecking(true);
    setMsg('');
    const me = await getMe();
    setChecking(false);
    if (!me) {
      setMsg('Could not reach the server. Please try again.');
      return;
    }
    const status = me.communityProfile?.verificationStatus;
    if (status === 'verified' || status === 'approved') {
      onVerified();
      return;
    }
    setMsg('Still pending review. We’ll let you know as soon as your account is verified.');
  }

  async function signOut() {
    await logout();
    onSignOut();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⏳ Pending verification</Text>
        </View>
        <Text style={styles.title}>Thanks for signing up!</Text>
        <Text style={styles.body}>
          Your account{email ? ` (${email})` : ''} has been created and is awaiting verification by a Janmanindia social
          worker. This usually takes 1–2 business days.
        </Text>
        <Text style={styles.body}>
          Once verified, you’ll be able to file cases, book appointments, and access community support directly from this
          app.
        </Text>

        {msg ? <Text style={styles.msg}>{msg}</Text> : null}

        <TouchableOpacity onPress={refresh} disabled={checking} style={[styles.btn, checking && { opacity: 0.6 }]}>
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Check status</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={signOut} style={styles.linkBtn}>
          <Text style={styles.link}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 72, height: 72, marginBottom: spacing.lg, resizeMode: 'contain' },
  badge: { backgroundColor: colors.errorBg, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm, marginBottom: spacing.md },
  badgeText: { color: colors.error, fontWeight: '700', fontSize: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  body: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  msg: { fontSize: 13, color: colors.text, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.sm },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center', marginTop: spacing.lg, minWidth: 200 },
  btnText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
  linkBtn: { marginTop: spacing.lg, padding: spacing.sm },
  link: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
});
