import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';

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

  useEffect(() => {
    (async () => {
      const r = await api<{ case: CaseFull }>(`/api/cases/${caseId}`);
      setLoading(false);
      if (!r.ok) { setErr(r.error ?? 'Failed to load'); return; }
      setData(r.data?.case ?? null);
    })();
  }, [caseId]);

  if (loading) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} /></SafeAreaView>;
  }
  if (err || !data) {
    return <SafeAreaView style={styles.safe}><Text style={styles.err}>{err || t('detail_notFound')}</Text></SafeAreaView>;
  }

  const c = data;
  const eq = c.enquiry;
  const appearances = [...(c.courtAppearances ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const diary = [...(c.caseDiary ?? [])].reverse();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 96 }]} {...useTabBarOnScroll()}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.caseNumberPill}>
            <Text style={styles.caseNumberText}>📄 {c.caseNumber}</Text>
          </View>
          <StatusBadge status={c.status} />
          {c.path && (
            <View style={styles.pathPill}>
              <Text style={styles.pathPillText}>{c.path === 'criminal' ? '⚖ Criminal' : '🏛 High Court'}</Text>
            </View>
          )}
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

        {/* Parties */}
        <SectionTitle>Parties</SectionTitle>
        <PartyRow label="Community" person={c.community} />
        <PartyRow label="Litigation Member" person={c.litigationMember} />
        <PartyRow label="Social Worker" person={c.socialWorker} />

        {/* Court / case management details */}
        {(c.courtName || c.courtCaseNumber || c.causeTitle || c.relevantSections || c.stage || c.bailAndAppearanceStatus || c.compensationStatus || c.district || c.state || c.caseType || c.eCourtLink) && (
          <>
            <SectionTitle>Court Details</SectionTitle>
            <Field label="Cause title" value={c.causeTitle} />
            <Field label="Court" value={c.courtName} />
            <Field label="Court case number" value={c.courtCaseNumber} mono />
            <Field label="Court type" value={c.courtType} />
            <Field label="State" value={c.state} />
            <Field label="District" value={c.district} />
            <Field label="Case type" value={c.caseType} />
            <Field label="Relevant sections" value={c.relevantSections} />
            <Field label="Stage" value={c.stage} />
            <Field label="Bail / appearance status" value={c.bailAndAppearanceStatus} />
            <Field label="Compensation" value={c.compensationStatus} />
            {c.eCourtLink ? (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>e-Courts link</Text>
                <TouchableOpacity onPress={() => Linking.openURL(c.eCourtLink!)}>
                  <Text style={[styles.fieldValue, { color: colors.accent }]}>{c.eCourtLink}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}

        {/* Background — for cases that existed before Janman picked them up */}
        {(c.isExistingCase || c.currentStep || c.existingNotes) && (
          <>
            <SectionTitle>Background</SectionTitle>
            {c.isExistingCase ? <Text style={styles.tag}>Pre-existing matter — Janman is monitoring</Text> : null}
            <Field label="Current step" value={c.currentStep} multiline />
            <Field label="Notes" value={c.existingNotes} multiline />
          </>
        )}

        {/* Intake / enquiry */}
        {eq && (eq.filerName || eq.victimName || eq.firNumber || eq.factsOfTheCase || (eq.issues && eq.issues.length) || (eq.petitioners && eq.petitioners.length) || (eq.respondents && eq.respondents.length)) && (
          <>
            <SectionTitle>Intake</SectionTitle>
            <Field label="Filed by" value={eq.filerName} />
            <Field label="Filer phone" value={eq.filerPhone} />
            <Field label="Relationship with victim" value={eq.relationshipWithVictim} />
            <Field label="Victim" value={eq.victimName} />
            <Field label="Victim address" value={eq.victimAddress} />
            <Field label="Victim contact" value={eq.victimContact} />
            <Field label="Issues" value={eq.issues?.join(', ')} />
            <Field label="Accused" value={eq.accusedNames} />
            <Field label="Accused count" value={eq.accusedCount?.toString()} />
            <Field label="FIR number" value={eq.firNumber} mono />
            <Field label="Police station" value={eq.policeStation} />
            <Field label="Place of occurrence" value={eq.placeOfOccurrence} />
            <Field label="Petitioners" value={eq.petitioners?.join(', ')} />
            <Field label="Respondents" value={eq.respondents?.join(', ')} />
            <Field label="Their position" value={eq.courtThey} multiline />
            <Field label="Our points" value={eq.ourPoints} multiline />
            <Field label="Facts of the case" value={eq.factsOfTheCase} multiline />
          </>
        )}

        {/* Documents */}
        {c.documents && c.documents.length > 0 && (
          <>
            <SectionTitle>{t('detail_documents')}</SectionTitle>
            {c.documents.map((d) => (
              <TouchableOpacity key={d._id ?? d.url} onPress={() => Linking.openURL(d.url)} style={styles.docRow}>
                <Text style={styles.docLabel}>📎 {d.label}</Text>
                <Text style={styles.docDate}>{fmtDate(d.uploadedAt)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Court appearances */}
        {appearances.length > 0 && (
          <>
            <SectionTitle>{t('detail_history')}</SectionTitle>
            {appearances.map((ap) => (
              <View key={ap._id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineDate}>{fmtDate(ap.date)}</Text>
                  <Text style={styles.timelineText}>{ap.dailyOrderBrief}</Text>
                  {ap.currentStatus ? <Text style={styles.timelineMeta}>Status: {ap.currentStatus}</Text> : null}
                  {ap.nextHearingDate ? (
                    <Text style={[styles.timelineMeta, { color: colors.accent, fontWeight: '600' }]}>
                      Next: {fmtDate(ap.nextHearingDate)}
                    </Text>
                  ) : null}
                  {ap.remarks ? <Text style={styles.timelineMeta}>Remarks: {ap.remarks}</Text> : null}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Diary */}
        {diary.length > 0 && (
          <>
            <SectionTitle>{t('detail_diary')}</SectionTitle>
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
});
