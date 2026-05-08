import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { getMe, logout } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';
import { setLocale, getSupportedLocales, getLocale, LOCALE_NAMES, Locale } from '../lib/i18n';
import { useTabBarOnScroll } from '../lib/tabBarVisibility';

export function ProfileScreen({ onLoggedOut }: { onLoggedOut: () => void }) {
  useLocale();
  const [me, setMe] = useState<{ name: string; email: string; phone?: string; communityProfile?: { verificationStatus?: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await getMe();
      setLoading(false);
      setMe(u);
    })();
  }, []);

  function doSignOut() {
    logout().catch(() => undefined);
    onLoggedOut();
  }

  function confirmLogout() {
    if (Platform.OS === 'web') {
      // Alert.alert on web falls back to window.alert and never fires onPress.
      const ok = typeof window !== 'undefined' && window.confirm
        ? window.confirm(t('signOutConfirm'))
        : true;
      if (ok) doSignOut();
      return;
    }
    Alert.alert(t('signOutQ'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: doSignOut },
    ]);
  }

  if (loading) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator style={{ marginTop: 40 }} /></SafeAreaView>;
  }

  const current = getLocale();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('profile_title')}</Text>

        <Card>
          <Row label={t('profile_name')} value={me?.name ?? '—'} />
          <Row label={t('profile_email')} value={me?.email ?? '—'} />
          <Row label={t('profile_phone')} value={me?.phone ?? '—'} />
          <Row label={t('profile_verification')} value={me?.communityProfile?.verificationStatus ?? 'pending'} />
        </Card>

        <Text style={styles.section}>{t('selectLanguage')}</Text>
        <View style={styles.langRow}>
          {getSupportedLocales().map((loc: Locale) => {
            const isActive = loc === current;
            return (
              <TouchableOpacity key={loc}
                onPress={async () => { await setLocale(loc); }}
                style={[styles.langBtn, isActive && styles.langBtnActive]}>
                <Text style={[styles.langText, isActive && styles.langTextActive]}>
                  {LOCALE_NAMES[loc]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={confirmLogout} style={styles.signOut}>
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>

        <Text style={styles.foot}>Janmanindia Community · v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: 120 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  section: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { width: 110, fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  rowValue: { flex: 1, fontSize: 14, color: colors.text },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  langBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  langBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  langText: { fontSize: 14, fontWeight: '600', color: colors.text },
  langTextActive: { color: colors.accentText },
  signOut: { backgroundColor: colors.errorBg, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.lg },
  signOutText: { color: colors.error, fontWeight: '700' },
  foot: { textAlign: 'center', fontSize: 11, color: colors.muted, marginTop: spacing.xl },
});
