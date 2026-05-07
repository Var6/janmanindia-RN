import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';

export function FileCaseScreen() {
  useLocale();
  const [caseTitle, setCaseTitle] = useState('');
  const [filerName, setFilerName] = useState('');
  const [filerPhone, setFilerPhone] = useState('');
  const [victimName, setVictimName] = useState('');
  const [issues, setIssues] = useState('');
  const [accusedNames, setAccusedNames] = useState('');
  const [facts, setFacts] = useState('');
  const [firNumber, setFirNumber] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [placeOfOccurrence, setPlace] = useState('');
  const [path, setPath] = useState<'criminal' | 'highcourt'>('criminal');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!caseTitle.trim() || !filerName.trim() || !facts.trim()) {
      Alert.alert(t('file_missing'), t('file_missingMsg'));
      return;
    }
    setSubmitting(true);
    const r = await api('/api/cases', {
      method: 'POST',
      body: JSON.stringify({
        caseTitle: caseTitle.trim(),
        path,
        enquiry: {
          filerName: filerName.trim(),
          filerPhone: filerPhone.trim() || undefined,
          victimName: victimName.trim() || filerName.trim(),
          issues: issues.split(',').map(s => s.trim()).filter(Boolean),
          accusedNames: accusedNames.trim() || undefined,
          factsOfTheCase: facts.trim(),
          firNumber: firNumber.trim() || undefined,
          policeStation: policeStation.trim() || undefined,
          placeOfOccurrence: placeOfOccurrence.trim() || undefined,
        },
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
          <Text style={{ fontSize: 60, marginBottom: spacing.md }}>✅</Text>
          <Text style={styles.title}>{t('file_done')}</Text>
          <Text style={styles.subtitle}>{t('file_doneMsg')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('file_title')}</Text>
        <Text style={styles.subtitle}>{t('file_subtitle')}</Text>

        <Field label={t('file_caseTitle')} value={caseTitle} onChange={setCaseTitle} placeholder={t('file_caseTitlePh')} />

        <Text style={styles.label}>{t('file_type')}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          {(['criminal', 'highcourt'] as const).map((p) => (
            <TouchableOpacity key={p} onPress={() => setPath(p)}
              style={[styles.input, { flex: 1, alignItems: 'center', paddingVertical: spacing.md, backgroundColor: path === p ? colors.accent : colors.surface, borderColor: path === p ? colors.accent : colors.border }]}>
              <Text style={{ color: path === p ? colors.accentText : colors.text, fontWeight: '600' }}>{p === 'highcourt' ? t('track_highcourt') : t('track_criminal')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label={t('file_filerName')} value={filerName} onChange={setFilerName} placeholder={t('file_filerNamePh')} />
        <Field label={t('file_filerPhone')} value={filerPhone} onChange={setFilerPhone} placeholder={t('file_filerPhonePh')} keyboardType="phone-pad" />
        <Field label={t('file_victim')} value={victimName} onChange={setVictimName} placeholder="" />
        <Field label={t('file_issues')} value={issues} onChange={setIssues} placeholder={t('file_issuesPh')} />
        <Field label={t('file_accused')} value={accusedNames} onChange={setAccusedNames} placeholder="" />
        <Field label={t('file_facts')} value={facts} onChange={setFacts} placeholder={t('file_factsPh')} multiline />
        <Field label={t('file_fir')} value={firNumber} onChange={setFirNumber} placeholder="" />
        <Field label={t('file_police')} value={policeStation} onChange={setPoliceStation} placeholder="" />
        <Field label={t('file_place')} value={placeOfOccurrence} onChange={setPlace} placeholder="" />

        <TouchableOpacity onPress={submit} disabled={submitting} style={[styles.btn, submitting && { opacity: 0.6 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('submit')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, multiline, keyboardType }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: 'default' | 'phone-pad' | 'email-address' }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted}
        multiline={multiline} keyboardType={keyboardType ?? 'default'}
        style={[styles.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: 15 },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  btnText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
  donePanel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
