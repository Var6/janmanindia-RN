import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';

export function SOSScreen() {
  useLocale();
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!details.trim()) {
      Alert.alert(t('sos_emptyTitle'), t('sos_emptyMsg'));
      return;
    }
    Alert.alert(t('sos_confirm'), t('sos_confirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('send'), style: 'destructive', onPress: doSend },
      ]
    );
  }

  async function doSend() {
    setSubmitting(true);
    const r = await api('/api/sos', {
      method: 'POST',
      body: JSON.stringify({
        description: details.trim(),
        location: location.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (!r.ok) { Alert.alert(t('failed'), r.error ?? t('failed')); return; }
    setDone(true);
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.donePanel}>
          <Text style={{ fontSize: 60 }}>🚨</Text>
          <Text style={[styles.title, { color: colors.error, marginTop: spacing.md }]}>{t('sos_done')}</Text>
          <Text style={styles.subtitle}>{t('sos_doneMsg')}</Text>
          <Text style={[styles.subtitle, { marginTop: spacing.md, fontWeight: '700' }]}>
            {t('sos_doneCall')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.warning}>
          <Text style={styles.warnTitle}>{t('sos_title')}</Text>
          <Text style={styles.warnText}>{t('sos_warn')}</Text>
        </View>

        <Text style={styles.label}>{t('sos_what')}</Text>
        <TextInput value={details} onChangeText={setDetails} multiline placeholder={t('sos_whatPh')}
          style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]} placeholderTextColor={colors.muted} />

        <Text style={styles.label}>{t('sos_where')}</Text>
        <TextInput value={location} onChangeText={setLocation} placeholder={t('sos_wherePh')}
          style={styles.input} placeholderTextColor={colors.muted} />

        <TouchableOpacity onPress={submit} disabled={submitting} style={[styles.btn, submitting && { opacity: 0.6 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('sos_send')}</Text>}
        </TouchableOpacity>

        <Text style={styles.helpline}>{t('sos_helpline')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg },
  warning: { backgroundColor: colors.errorBg, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: '#fecaca' },
  warnTitle: { fontSize: 18, fontWeight: '800', color: colors.error },
  warnText: { fontSize: 13, color: '#991b1b', marginTop: 4 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 6, marginTop: spacing.md },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: 15 },
  btn: { backgroundColor: colors.error, borderRadius: radius.md, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.lg },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  helpline: { textAlign: 'center', fontSize: 12, color: colors.muted, marginTop: spacing.lg },
  donePanel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
