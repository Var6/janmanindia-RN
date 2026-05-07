import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { colors, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';

interface DocMeta { _id?: string; label: string; url: string; uploadedAt: string }
interface DiaryEntry { _id: string; date: string; findings: string }
interface Appearance { _id: string; date: string; dailyOrderBrief: string; currentStatus?: string; nextHearingDate?: string }
interface Comment { _id: string; text: string; byName: string; pinned?: boolean; createdAt: string }
interface CaseFull {
  _id: string;
  caseTitle: string;
  caseNumber: string;
  status: string;
  path?: 'criminal' | 'highcourt';
  courtName?: string;
  nextHearingDate?: string;
  documents?: DocMeta[];
  caseDiary?: DiaryEntry[];
  courtAppearances?: Appearance[];
  caseComments?: Comment[];
}

export function CaseDetailScreen({ route }: { route: { params: { caseId: string } } }) {
  useLocale();
  const { caseId } = route.params;
  const [data, setData] = useState<CaseFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const r = await api<{ case: CaseFull }>(`/api/cases/${caseId}`);
      setLoading(false);
      if (!r.ok) { setErr(r.error ?? 'Failed to load'); return; }
      setData(r.data?.case ?? null);
    })();
  }, [caseId]);

  if (loading) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator style={{ marginTop: 40 }} /></SafeAreaView>;
  }
  if (err || !data) {
    return <SafeAreaView style={styles.safe}><Text style={styles.err}>{err || t('detail_notFound')}</Text></SafeAreaView>;
  }

  const c = data;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.caseNumber}>{c.caseNumber}</Text>
          <Text style={styles.title}>{c.caseTitle}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
            <StatusBadge status={c.status} />
            {c.path && <StatusBadge status={c.path === 'criminal' ? t('track_criminal') : t('track_highcourt')} />}
          </View>
          {c.courtName && <Text style={styles.meta}>{t('detail_court')}: {c.courtName}</Text>}
          {c.nextHearingDate && (
            <Text style={[styles.meta, { color: colors.accent, fontWeight: '600' }]}>
              {t('dash_nextHearing')}: {new Date(c.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          )}
        </View>

        {c.courtAppearances && c.courtAppearances.length > 0 && (
          <>
            <Text style={styles.section}>{t('detail_history')}</Text>
            {[...c.courtAppearances].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((ap) => (
              <Card key={ap._id}>
                <Text style={styles.dateLabel}>
                  {new Date(ap.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Text style={styles.body}>{ap.dailyOrderBrief}</Text>
                {ap.currentStatus && <Text style={styles.meta}>{t('detail_status')}: {ap.currentStatus}</Text>}
                {ap.nextHearingDate && (
                  <Text style={[styles.meta, { color: colors.accent }]}>
                    {t('detail_next')}: {new Date(ap.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                )}
              </Card>
            ))}
          </>
        )}

        {c.documents && c.documents.length > 0 && (
          <>
            <Text style={styles.section}>{t('detail_documents')}</Text>
            {c.documents.map((d) => (
              <Card key={d._id ?? d.url} onPress={() => Linking.openURL(d.url)}>
                <Text style={[styles.body, { color: colors.accent, fontWeight: '600' }]}>📎 {d.label}</Text>
                <Text style={styles.meta}>
                  {new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Card>
            ))}
          </>
        )}

        {c.caseDiary && c.caseDiary.length > 0 && (
          <>
            <Text style={styles.section}>{t('detail_diary')}</Text>
            {[...c.caseDiary].reverse().map((d) => (
              <Card key={d._id}>
                <Text style={styles.dateLabel}>
                  {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Text style={styles.body}>{d.findings}</Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg },
  header: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  caseNumber: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 1, fontFamily: 'monospace' },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 4 },
  meta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  section: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.md },
  dateLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  err: { color: colors.error, padding: spacing.lg, textAlign: 'center' },
});
