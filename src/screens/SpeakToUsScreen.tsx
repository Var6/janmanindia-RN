import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { api, API_BASE } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing } from '../lib/theme';
import { t, useLocale } from '../lib/useLocale';
import { useTabBarOnScroll } from '../lib/tabBarVisibility';

export function SpeakToUsScreen() {
  useLocale();
  const nav = useNavigation<any>();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const tabBarScroll = useTabBarOnScroll();

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert(t('speak_perm'), t('speak_permMsg')); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setRecordedUri(null);
      setDuration(0);
    } catch (e) {
      Alert.alert('Recording failed', String(e));
    }
  }

  async function stopRecording() {
    if (!recording) return;
    try {
      const status = await recording.getStatusAsync();
      if (status.isRecording) await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setDuration(Math.round((status.durationMillis ?? 0) / 1000));
    } finally {
      setRecording(null);
    }
  }

  async function submit() {
    if (!text.trim() && !recordedUri) {
      Alert.alert(t('speak_empty'), t('speak_emptyMsg'));
      return;
    }
    setSubmitting(true);
    try {
      let audioUrl: string | undefined;
      if (recordedUri) {
        const cookie = await AsyncStorage.getItem('janmanindia.cookie');
        const form = new FormData();
        form.append('file', { uri: recordedUri, name: 'voice.m4a', type: 'audio/m4a' } as unknown as Blob);
        const upRes = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: form,
          headers: cookie ? { Cookie: cookie } : undefined,
        });
        const upData = await upRes.json().catch(() => ({}));
        if (!upRes.ok || !upData.url) {
          Alert.alert(t('failed'), upData.error ?? t('speak_uploadFailed'));
          setSubmitting(false);
          return;
        }
        audioUrl = upData.url;
      }

      const r = await api('/api/community/voice-message', {
        method: 'POST',
        body: JSON.stringify({
          text: text.trim() || undefined,
          audioUrl,
          audioDurationSec: duration || undefined,
        }),
      });
      setSubmitting(false);
      if (!r.ok) { Alert.alert(t('failed'), r.error ?? t('failed')); return; }
      setDone(true);
    } catch (e) {
      setSubmitting(false);
      Alert.alert(t('failed'), String(e));
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.donePanel}>
          <Text style={{ fontSize: 60, marginBottom: spacing.md }}>📨</Text>
          <Text style={styles.title}>{t('speak_done')}</Text>
          <Text style={styles.subtitle}>{t('speak_doneMsg')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 96 }]} keyboardShouldPersistTaps="handled" {...tabBarScroll}>
        <TouchableOpacity onPress={() => nav.navigate('SOS')} style={styles.sosCard} activeOpacity={0.85}>
          <Text style={styles.sosEmoji}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>Emergency? Send an SOS</Text>
            <Text style={styles.sosBody}>Use this only if something is happening right now. Your social worker is paged immediately.</Text>
          </View>
          <Text style={styles.sosArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => nav.navigate('Appointments')} style={styles.aptCard} activeOpacity={0.85}>
          <Text style={styles.aptEmoji}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.aptTitle}>Book an appointment</Text>
            <Text style={styles.aptBody}>Schedule a 1-on-1 with your social worker — visit, video call, or phone call.</Text>
          </View>
          <Text style={styles.aptArrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('speak_title')}</Text>
        <Text style={styles.subtitle}>{t('speak_subtitle')}</Text>

        <Text style={styles.label}>{t('speak_message')}</Text>
        <TextInput value={text} onChangeText={setText} multiline placeholder={t('speak_messagePh')}
          style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]} placeholderTextColor={colors.muted} />

        <Text style={styles.label}>{t('speak_voice')}</Text>
        {recordedUri ? (
          <View style={styles.recPanel}>
            <Text style={styles.recText}>🎤 {t('speak_recorded')} · {duration}s</Text>
            <TouchableOpacity onPress={() => { setRecordedUri(null); setDuration(0); }}>
              <Text style={{ color: colors.error, fontWeight: '600' }}>{t('discard')}</Text>
            </TouchableOpacity>
          </View>
        ) : recording ? (
          <TouchableOpacity onPress={stopRecording} style={[styles.recBtn, { backgroundColor: colors.error }]}>
            <Text style={styles.recBtnText}>{t('speak_stop')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startRecording} style={styles.recBtn}>
            <Text style={styles.recBtnText}>{t('speak_record')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={submit} disabled={submitting} style={[styles.btn, submitting && { opacity: 0.6 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('send')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 6, marginTop: spacing.md },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: 15 },
  recBtn: { backgroundColor: '#7c3aed', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  recBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  recPanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  recText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  btnText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
  donePanel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  sosCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#dc2626', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  sosEmoji: { fontSize: 28 },
  sosTitle: { fontSize: 14, fontWeight: '800', color: '#991b1b' },
  sosBody: { fontSize: 12, color: '#7f1d1d', marginTop: 2, lineHeight: 16 },
  sosArrow: { fontSize: 24, color: '#dc2626', fontWeight: '700' },
  aptCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.accent + '12', borderWidth: 1, borderColor: colors.accent + '40', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  aptEmoji: { fontSize: 28 },
  aptTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  aptBody: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 },
  aptArrow: { fontSize: 24, color: colors.accent, fontWeight: '700' },
});
