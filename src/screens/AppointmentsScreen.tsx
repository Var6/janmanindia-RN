import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { api, getMe } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';
import { useTabBarOnScroll } from '../lib/tabBarVisibility';

interface UserRef { _id: string; name: string; role?: string }
interface Appointment {
  _id: string;
  status: string;
  reason: string;
  proposedDate: string;
  socialWorker?: UserRef | null;
  litigationMember?: UserRef | null;
  requester?: UserRef | null;
}

export function AppointmentsScreen() {
  useLocale();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showBook, setShowBook] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const r = await api<{ appointments: Appointment[] }>('/api/appointments');
    setRefreshing(false);
    if (r.ok && r.data?.appointments) setAppts(r.data.appointments);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 96 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        {...useTabBarOnScroll()}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('apts_title')}</Text>
            <Text style={styles.subtitle}>{appts.length} {appts.length === 1 ? t('apts_count_one') : t('apts_count_other')}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowBook(true)} style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>{t('apts_book')}</Text>
          </TouchableOpacity>
        </View>

        {appts.length === 0 ? (
          <Card><Text style={styles.empty}>{t('apts_empty')}</Text></Card>
        ) : (
          appts.map((a) => (
            <Card key={a._id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{a.reason}</Text>
                  <Text style={styles.itemSub}>
                    {new Date(a.proposedDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {(a.socialWorker?.name || a.litigationMember?.name) && (
                    <Text style={styles.itemSub}>{t('apts_with')}: {a.socialWorker?.name ?? a.litigationMember?.name}</Text>
                  )}
                </View>
                <StatusBadge status={a.status} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={showBook} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBook(false)}>
        <BookForm onClose={() => setShowBook(false)} onCreated={() => { setShowBook(false); load(); }} />
      </Modal>
    </SafeAreaView>
  );
}

function BookForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');   // YYYY-MM-DD
  const [time, setTime] = useState('10:00');
  const [sw, setSw] = useState<{ _id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { (async () => {
    const me = await getMe();
    const swId = me?.communityProfile?.assignedSocialWorker;
    if (!swId) return;
    const r = await api<{ user: { _id: string; name: string } }>(`/api/users/${swId}`);
    if (r.ok && r.data?.user) setSw({ _id: r.data.user._id, name: r.data.user.name });
  })(); }, []);

  async function submit() {
    if (!reason.trim() || !date || !time) {
      Alert.alert(t('book_missing'), t('book_missingMsg'));
      return;
    }
    if (!sw) {
      Alert.alert(t('book_noSw'), t('book_noSwMsg'));
      return;
    }
    const proposedDate = new Date(`${date}T${time}:00`);
    if (isNaN(proposedDate.getTime())) {
      Alert.alert(t('book_invalidDate'), t('book_invalidDateMsg'));
      return;
    }
    setSubmitting(true);
    const r = await api('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        requesteeId: sw._id,
        reason: reason.trim(),
        proposedDate: proposedDate.toISOString(),
      }),
    });
    setSubmitting(false);
    if (!r.ok) { Alert.alert(t('failed'), r.error ?? t('book_failed')); return; }
    onCreated();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.title}>{t('book_title')}</Text>
        <Text style={styles.subtitle}>{sw ? `${t('apts_with')} ${sw.name}` : t('book_loadingSw')}</Text>

        <Text style={styles.label}>{t('book_reason')}</Text>
        <TextInput value={reason} onChangeText={setReason} multiline placeholder={t('book_reasonPh')}
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholderTextColor={colors.muted} />

        <Text style={styles.label}>{t('book_date')}</Text>
        <TextInput value={date} onChangeText={setDate} placeholder="2026-05-15" style={styles.input} placeholderTextColor={colors.muted} />

        <Text style={styles.label}>{t('book_time')}</Text>
        <TextInput value={time} onChangeText={setTime} placeholder="10:00" style={styles.input} placeholderTextColor={colors.muted} />

        <TouchableOpacity onPress={submit} disabled={submitting || !sw} style={[styles.bookBtn, { marginTop: spacing.lg, opacity: submitting || !sw ? 0.6 : 1 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>{t('book_send')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', marginTop: spacing.md }}>
          <Text style={{ color: colors.muted }}>{t('cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  bookBtn: { backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.md },
  bookBtnText: { color: colors.accentText, fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  empty: { fontSize: 13, color: colors.muted },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 6, marginTop: spacing.md },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: 15 },
});
