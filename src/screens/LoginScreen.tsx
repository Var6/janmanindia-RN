import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';

export function LoginScreen({ onLoggedIn, onSignUp }: { onLoggedIn: () => void; onSignUp: () => void }) {
  useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!email.trim() || !password) return;
    setLoading(true); setErr('');
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setErr(res.error ?? t('login_failed'));
      return;
    }
    if (res.data?.role !== 'community') {
      setErr(t('login_communityOnly'));
      return;
    }
    onLoggedIn();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.center}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>{t('login_title')}</Text>
          <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          {err ? <Text style={styles.err}>{err}</Text> : null}

          <Text style={styles.label}>{t('login_email')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>{t('login_password')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <TouchableOpacity onPress={submit} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('login_signin')}</Text>}
          </TouchableOpacity>

          <Text style={styles.hint} onPress={onSignUp}>
            {t('login_noAccount')} <Text style={styles.link}>Sign up</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  center: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 80, height: 80, marginBottom: spacing.md, resizeMode: 'contain' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  form: { backgroundColor: colors.surface, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 6, marginTop: spacing.md },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: 15 },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  btnText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
  err: { color: colors.error, backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: radius.sm, fontSize: 13 },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: spacing.lg },
  link: { color: colors.accent, fontWeight: '700' },
});
