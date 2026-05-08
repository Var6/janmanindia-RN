import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useTabBarOnScroll } from '../lib/tabBarVisibility';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { api, getMe } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';

interface CaseLite { _id: string; caseTitle: string; caseNumber: string; status: string; nextHearingDate?: string }
interface AptLite  { _id: string; reason: string; proposedDate: string; status: string }

function quickActions() {
  return [
    { key: 'tracker', route: 'CaseTracker',  icon: '📂', title: t('dash_caseTracker'), subtitle: t('dash_caseTracker_sub'), accent: colors.accent },
    { key: 'speak',   route: 'SpeakToUs',    icon: '🎤', title: t('dash_speak'),       subtitle: t('dash_speak_sub'),       accent: '#7c3aed' },
    { key: 'sos',     route: 'SOS',          icon: '🚨', title: t('dash_sos'),         subtitle: t('dash_sos_sub'),         accent: '#dc2626' },
    { key: 'apts',    route: 'Appointments', icon: '📅', title: t('dash_apts'),        subtitle: t('dash_apts_sub'),        accent: '#16a34a' },
    { key: 'file',    route: 'FileCase',     icon: '📝', title: t('dash_file'),        subtitle: t('dash_file_sub'),        accent: '#0ea5e9' },
  ];
}

export function DashboardScreen() {
  useLocale();
  const nav = useNavigation<any>();
  const [name, setName] = useState('');
  const [cases, setCases] = useState<CaseLite[]>([]);
  const [appts, setAppts] = useState<AptLite[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const me = await getMe();
      if (me) setName(me.name);
      const [c, a] = await Promise.all([
        api<{ cases: CaseLite[] }>('/api/cases'),
        api<{ appointments: AptLite[] }>('/api/appointments'),
      ]);
      if (c.ok && c.data?.cases) setCases(c.data.cases.slice(0, 5));
      if (a.ok && a.data?.appointments) setAppts(a.data.appointments.slice(0, 3));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 96 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        {...useTabBarOnScroll()}>

        <Text style={styles.greet}>{t('dash_hi')} {name ? name.split(' ')[0] : ''} 👋</Text>
        <Text style={styles.greetSub}>{t('dash_help')}</Text>

        <View style={styles.actionGrid}>
          {quickActions().map((a) => (
            <TouchableOpacity key={a.key} onPress={() => nav.navigate(a.route)} style={styles.actionCard} activeOpacity={0.85}>
              <View style={[styles.actionDot, { backgroundColor: a.accent }]} />
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionSub}>{a.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('dash_myCases')}</Text>
        {cases.length === 0 ? (
          <Card>
            <Text style={styles.empty}>{t('dash_noCases')}</Text>
          </Card>
        ) : (
          cases.map((c) => (
            <Card key={c._id} onPress={() => nav.navigate('CaseDetail', { caseId: c._id, title: c.caseTitle })}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseTitle} numberOfLines={1}>{c.caseTitle}</Text>
                  <Text style={styles.caseSub}>#{c.caseNumber}</Text>
                  {c.nextHearingDate && (
                    <Text style={styles.caseSub}>
                      {t('dash_nextHearing')}: {new Date(c.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                </View>
                <StatusBadge status={c.status} />
              </View>
            </Card>
          ))
        )}

        <Text style={styles.sectionTitle}>{t('dash_recentApts')}</Text>
        {appts.length === 0 ? (
          <Card><Text style={styles.empty}>{t('dash_noApts')}</Text></Card>
        ) : (
          appts.map((a) => (
            <Card key={a._id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseTitle} numberOfLines={2}>{a.reason}</Text>
                  <Text style={styles.caseSub}>{new Date(a.proposedDate).toLocaleDateString('en-IN')}</Text>
                </View>
                <StatusBadge status={a.status} />
              </View>
            </Card>
          ))
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg },
  greet: { fontSize: 24, fontWeight: '800', color: colors.text },
  greetSub: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  actionCard: { width: '47.5%', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, position: 'relative' },
  actionDot: { width: 8, height: 8, borderRadius: 999, position: 'absolute', top: spacing.md, right: spacing.md },
  actionIcon: { fontSize: 26, marginBottom: 6 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  actionSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  caseTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  caseSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  empty: { fontSize: 13, color: colors.muted },
});
