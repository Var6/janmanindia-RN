import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBadge } from '../components/StatusBadge';
import { Skeleton } from '../components/Skeleton';
import { api } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';
import { useTabBarOnScroll } from '../lib/tabBarVisibility';

interface DocMeta { _id?: string; label: string; url: string; uploadedAt: string }
interface DiaryEntry { _id: string; date: string; findings: string }
interface Appearance { _id: string; date: string; dailyOrderBrief: string; currentStatus?: string; nextHearingDate?: string; remarks?: string }
interface Party { _id: string; name: string; email?: string; phone?: string }
interface Enquiry {
  filerName?: string; filerPhone?: string; relationshipWithVictim?: string;
  victimName?: string; victimAddress?: string; victimContact?: string;
  issues?: string[]; accusedNames?: string; accusedCount?: number;
  factsOfTheCase?: string; firNumber?: string; policeStation?: string; placeOfOccurrence?: string;
  petitioners?: string[]; respondents?: string[]; courtThey?: string; ourPoints?: string;
}
interface CaseFull {
  _id: string;
  caseTitle: string;
  caseNumber: string;
  status: string;
  path?: 'criminal' | 'highcourt';
  caseType?: string;
  district?: string;
  causeTitle?: string;
  courtCaseNumber?: string;
  courtName?: string;
  relevantSections?: string;
  bailAndAppearanceStatus?: string;
  stage?: string;
  compensationStatus?: string;
  courtType?: string;
  state?: string;
  eCourtLink?: string;
  currentStep?: string;
  existingNotes?: string;
  isExistingCase?: boolean;
  nextHearingDate?: string;
  createdAt?: string;
  updatedAt?: string;
  community?: Party;
  litigationMember?: Party;
  socialWorker?: Party;
  documents?: DocMeta[];
  caseDiary?: DiaryEntry[];
  courtAppearances?: Appearance[];
  enquiry?: Enquiry;
}

function fmtDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function CaseDetailScreen({ route }: { route: { params: { caseId: string } } }) {
  useLocale();
  const { caseId } = route.params;
  const [data, setData] = useState<CaseFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const tabBarScroll = useTabBarOnScroll();

  useEffect(() => {
    if (!caseId) { setLoading(false); setErr('Missing case ID'); return; }
    (async () => {
      try {
        const r = await api<{ case: CaseFull }>(`/api/cases/${caseId}`);
        setLoading(false);
        if (!r.ok) { setErr(r.error ?? `Failed to load (status ${r.status})`); return; }
        const c = r.data?.case ?? null;
        if (!c) { setErr('Case data missing in response'); return; }
        setData(c);
      } catch (e) {
        setLoading(false);
        setErr(`Unexpected error: ${String(e)}`);
      }
    })();
  }, [caseId]);

  if (loading) {
    return <CaseDetailSkeleton />;
  }

  if (err || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errIcon}>⚠️</Text>
          <Text style={styles.errTitle}>{t('detail_notFound')}</Text>
          {err ? <Text style={styles.errBody}>{err}</Text> : null}
          <Text style={styles.errHint}>Case ID: {caseId || '—'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  let c: CaseFull;
  let eq: Enquiry | undefined;
  let appearances: Appearance[];
  let diary: DiaryEntry[];
  try {
    c = data;
    eq = c.enquiry;
    appearances = [...(c.courtAppearances ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    diary = [...(c.caseDiary ?? [])].reverse();
  } catch (e) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errIcon}>💥</Text>
          <Text style={styles.errTitle}>Render error</Text>
          <Text style={styles.errBody}>{String(e)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 96 }]} {...tabBarScroll}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.caseNumberPill}>
            <Text style={styles.caseNumberText}>📄 {c.caseNumber}</Text>
          </View>
          <StatusBadge status={c.status} />
        </View>
        <Text style={styles.title}>{c.caseTitle}</Text>
        <Text style={styles.metaSmall}>
          {c.createdAt ? `Filed ${fmtDate(c.createdAt)}` : ''}
          {c.createdAt && c.updatedAt ? ' · ' : ''}
          {c.updatedAt ? `Last updated ${fmtDate(c.updatedAt)}` : ''}
        </Text>

        {c.nextHearingDate && (
          <View style={styles.hearingTile}>
            <Text style={styles.hearingLabel}>Next Hearing</Text>
            <Text style={styles.hearingDate}>{fmtDate(c.nextHearingDate)}</Text>
          </View>
        )}

        {/* Your social worker — the person to call. */}
        {c.socialWorker && (
          <>
            <SectionTitle>Your Social Worker</SectionTitle>
            <PartyRow label="Reach out to" person={c.socialWorker} />
          </>
        )}

        {/* Where the case stands — plain language only */}
        {(c.currentStep || c.courtName || c.district) && (
          <>
            <SectionTitle>Where things stand</SectionTitle>
            <Field label="What's happening now" value={c.currentStep} multiline />
            <Field label="Where the matter is being heard" value={c.courtName} />
            <Field label="District" value={c.district} />
          </>
        )}

        {/* Documents */}
        {c.documents && c.documents.length > 0 && (
          <>
            <SectionTitle>Papers attached</SectionTitle>
            {c.documents.map((d) => (
              <TouchableOpacity key={d._id ?? d.url} onPress={() => Linking.openURL(d.url)} style={styles.docRow}>
                <Text style={styles.docLabel}>📎 {d.label}</Text>
                <Text style={styles.docDate}>{fmtDate(d.uploadedAt)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Court appearances — what's happened in court so far */}
        {appearances.length > 0 && (
          <>
            <SectionTitle>What's happened so far</SectionTitle>
            {appearances.map((ap) => (
              <View key={ap._id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineDate}>{fmtDate(ap.date)}</Text>
                  <Text style={styles.timelineText}>{ap.dailyOrderBrief}</Text>
                  {ap.nextHearingDate ? (
                    <Text style={[styles.timelineMeta, { color: colors.accent, fontWeight: '600' }]}>
                      Next date: {fmtDate(ap.nextHearingDate)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Diary — case worker's notes (omit raw "diary" jargon) */}
        {diary.length > 0 && (
          <>
            <SectionTitle>Notes from your case worker</SectionTitle>
            {diary.map((d) => (
              <View key={d._id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.muted }]} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineDate}>{fmtDate(d.date)}</Text>
                  <Text style={styles.timelineText}>{d.findings}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Field({ label, value, mono, multiline }: { label: string; value?: string; mono?: boolean; multiline?: boolean }) {
  if (!value) return null;
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, mono && { fontFamily: 'monospace' }, multiline && { lineHeight: 20 }]}>{value}</Text>
    </View>
  );
}

function CaseDetailSkeleton() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 96 }]} pointerEvents="none">
        {/* Header pills */}
        <View style={styles.headerRow}>
          <Skeleton width={120} height={24} rounded={999} />
          <Skeleton width={80} height={24} rounded={999} />
          <Skeleton width={100} height={24} rounded={999} />
        </View>
        {/* Title + meta */}
        <Skeleton width={'85%'} height={26} />
        <View style={{ height: 8 }} />
        <Skeleton width={'60%'} height={26} />
        <View style={{ height: 8 }} />
        <Skeleton width={'40%'} height={12} />

        {/* Hearing tile */}
        <View style={[styles.hearingTile, { paddingVertical: spacing.md }]}>
          <Skeleton width={100} height={10} />
          <View style={{ height: 8 }} />
          <Skeleton width={140} height={20} />
        </View>

        {/* Parties section */}
        <View style={{ marginTop: spacing.xl, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Skeleton width={80} height={12} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.partyRow}>
            <Skeleton width={120} height={10} />
            <View style={{ height: 8 }} />
            <Skeleton width={'70%'} height={16} />
            <View style={{ height: 6 }} />
            <Skeleton width={'50%'} height={12} />
          </View>
        ))}

        {/* Court Details section */}
        <View style={{ marginTop: spacing.xl, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Skeleton width={120} height={12} />
        </View>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.fieldRow}>
            <Skeleton width={100} height={10} />
            <View style={{ height: 6 }} />
            <Skeleton width={`${60 + ((i * 7) % 30)}%` as `${number}%`} height={14} />
          </View>
        ))}

        {/* Timeline section */}
        <View style={{ marginTop: spacing.xl, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Skeleton width={140} height={12} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: colors.border }]} />
            <View style={styles.timelineBody}>
              <Skeleton width={90} height={10} />
              <View style={{ height: 8 }} />
              <Skeleton width={'95%'} height={14} />
              <View style={{ height: 4 }} />
              <Skeleton width={'80%'} height={14} />
              <View style={{ height: 6 }} />
              <Skeleton width={'50%'} height={11} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function PartyRow({ label, person }: { label: string; person?: Party }) {
  return (
    <View style={styles.partyRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {person ? (
        <View style={{ marginTop: 2 }}>
          <Text style={styles.partyName}>{person.name}</Text>
          {person.email ? <Text style={styles.partyMeta}>{person.email}</Text> : null}
          {person.phone ? <Text style={styles.partyMeta}>{person.phone}</Text> : null}
        </View>
      ) : (
        <Text style={[styles.fieldValue, { color: colors.muted, fontStyle: 'italic' }]}>Not assigned</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  caseNumberPill: { backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '40', borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  caseNumberText: { fontSize: 11, fontWeight: '700', color: colors.accent, fontFamily: 'monospace' },
  pathPill: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  pathPillText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 28 },
  metaSmall: { fontSize: 12, color: colors.muted, marginTop: 4 },
  hearingTile: { backgroundColor: colors.accent + '12', borderWidth: 1, borderColor: colors.accent + '35', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  hearingLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  hearingDate: { fontSize: 18, fontWeight: '800', color: colors.accent, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.xl, marginBottom: spacing.sm, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldRow: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  fieldValue: { fontSize: 14, color: colors.text },
  partyRow: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  partyName: { fontSize: 14, fontWeight: '700', color: colors.text },
  partyMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  tag: { fontSize: 12, color: colors.accent, fontWeight: '700', marginBottom: spacing.sm },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  docLabel: { fontSize: 14, color: colors.accent, fontWeight: '600', flex: 1 },
  docDate: { fontSize: 11, color: colors.muted, marginLeft: spacing.sm },
  timelineItem: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 8, marginRight: spacing.md },
  timelineBody: { flex: 1 },
  timelineDate: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  timelineText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  timelineMeta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  err: { color: colors.error, padding: spacing.lg, textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  centeredText: { fontSize: 14, color: colors.muted, marginTop: spacing.sm },
  errIcon: { fontSize: 56 },
  errTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  errBody: { fontSize: 13, color: colors.error, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  errHint: { fontSize: 11, color: colors.muted, fontFamily: 'monospace', marginTop: spacing.md },
});
