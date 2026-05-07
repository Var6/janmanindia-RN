import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { colors, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';

interface CaseLite { _id: string; caseTitle: string; caseNumber: string; status: string; nextHearingDate?: string; path?: string }

export function CaseTrackerScreen() {
  useLocale();
  const nav = useNavigation<any>();
  const [cases, setCases] = useState<CaseLite[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    setErr('');
    const r = await api<{ cases: CaseLite[] }>('/api/cases');
    setRefreshing(false);
    if (!r.ok) { setErr(r.error ?? 'Failed to load'); return; }
    setCases(r.data?.cases ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
        <Text style={styles.title}>{t('track_title')}</Text>
        <Text style={styles.subtitle}>{cases.length} {cases.length === 1 ? t('track_count_one') : t('track_count_other')}</Text>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        {cases.length === 0 && !err && !refreshing ? (
          <Card><Text style={styles.empty}>{t('dash_noCases')}</Text></Card>
        ) : (
          cases.map((c) => (
            <Card key={c._id} onPress={() => nav.navigate('CaseDetail', { caseId: c._id, title: c.caseTitle })}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseTitle} numberOfLines={2}>{c.caseTitle}</Text>
                  <Text style={styles.caseSub}>#{c.caseNumber} · {c.path === 'criminal' ? t('track_criminal') : t('track_highcourt')}</Text>
                  {c.nextHearingDate && (
                    <Text style={styles.caseSub}>{t('dash_nextHearing')}: {new Date(c.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  )}
                </View>
                <StatusBadge status={c.status} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.muted, marginBottom: spacing.lg },
  err: { color: colors.error, backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: 8, fontSize: 13, marginBottom: spacing.md },
  empty: { fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  caseTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  caseSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
