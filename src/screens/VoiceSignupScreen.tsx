import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Image, KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { register, uploadFile } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';

export function VoiceSignupScreen({
  onRegistered,
  onBackToLogin,
  onUseEmailSignup,
}: {
  onRegistered: () => void;
  onBackToLogin: () => void;
  onUseEmailSignup: () => void;
}) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [voiceUrl, setVoiceUrl] = useState('');
  const [voiceDur, setVoiceDur] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  async function startRecording() {
    try {
      setErr('');
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert('Microphone needed', 'Please allow microphone access to record.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setVoiceUrl(''); setVoiceDur(0);
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
      const dur = Math.round((status.durationMillis ?? 0) / 1000);
      setRecording(null);
      if (!uri) return;
      setUploading(true);
      const r = await uploadFile(uri, `voice-intro-${Date.now()}.m4a`, 'audio/m4a');
      setUploading(false);
      if (!r.ok || !r.data) {
        setErr(r.error ?? 'Voice upload failed.');
        return;
      }
      setVoiceUrl(r.data.url);
      setVoiceDur(dur);
    } catch (e) {
      setRecording(null);
      setUploading(false);
      Alert.alert('Recording failed', String(e));
    }
  }

  async function submit() {
    setErr('');
    if (!voiceUrl) {
      setErr('Please record your voice introduction first.');
      return;
    }
    if (!phone.trim() || phone.trim().replace(/\D/g, '').length < 7) {
      setErr('Please enter a valid phone number so a social worker can call you.');
      return;
    }
    setSubmitting(true);
    const cleanPhone = phone.trim();
    const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const stubEmail = `voice-${stamp}@noreply.janmanindia.local`;
    const stubPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const r = await register({
      name: 'Voice signup',
      email: stubEmail,
      password: stubPassword,
      phone: cleanPhone,
      voiceIntroUrl: voiceUrl,
      voiceIntroDurationSec: voiceDur,
    });
    setSubmitting(false);
    if (!r.ok) {
      setErr(r.error ?? 'Registration failed.');
      return;
    }
    onRegistered();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.title}>Tell us who you are</Text>
            <Text style={styles.subtitle}>आप अकेले नहीं हैं — हम आपके साथ हैं।</Text>
          </View>

          <View style={styles.promptCard}>
            <Text style={styles.promptHeader}>Please say your name and phone number</Text>
            <Text style={styles.promptHi}>कृपया अपना नाम और मोबाइल नंबर बताएं</Text>
            <Text style={styles.promptOther}>अहाँ अपन नाम आ मोबाइल नंबर कहू   ·   अपन नाम आ मोबाइल नंबर बतावल जाव   ·   اپنا نام اور موبائل نمبر بتائیں</Text>
            <Text style={styles.promptHelp}>
              You can speak in Hindi, Maithili, Bhojpuri, Urdu, or any language you’re comfortable with. A social worker will listen and call you back within 48 hours.
            </Text>
          </View>

          <View style={styles.recordWrap}>
            {voiceUrl ? (
              <View style={styles.attached}>
                <Text style={styles.attachedText}>🎤 Voice recorded · {voiceDur}s</Text>
                <TouchableOpacity onPress={() => { setVoiceUrl(''); setVoiceDur(0); }}>
                  <Text style={styles.replace}>Re-record</Text>
                </TouchableOpacity>
              </View>
            ) : recording ? (
              <TouchableOpacity onPress={stopRecording} style={[styles.bigMic, { backgroundColor: colors.error }]}>
                <Text style={styles.bigMicEmoji}>⏹</Text>
                <Text style={styles.bigMicLabel}>Tap to stop</Text>
              </TouchableOpacity>
            ) : uploading ? (
              <View style={[styles.bigMic, { opacity: 0.7 }]}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.bigMicLabel}>Uploading…</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={startRecording} style={styles.bigMic}>
                <Text style={styles.bigMicEmoji}>🎤</Text>
                <Text style={styles.bigMicLabel}>Tap to record</Text>
              </TouchableOpacity>
            )}
          </View>

          {voiceUrl ? (
            <View style={styles.phoneCard}>
              <Text style={styles.label}>Phone number (मोबाइल नंबर)</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 9999999999"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <Text style={styles.phoneHint}>So our social worker can call you back.</Text>
            </View>
          ) : null}

          {err ? <Text style={styles.err}>{err}</Text> : null}

          <TouchableOpacity
            onPress={submit}
            disabled={submitting || !voiceUrl}
            style={[styles.submitBtn, (submitting || !voiceUrl) && { opacity: 0.5 }]}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send to social worker</Text>}
          </TouchableOpacity>

          <Text style={styles.altLink} onPress={onUseEmailSignup}>
            Prefer to type? <Text style={styles.link}>Sign up with email instead</Text>
          </Text>

          <Text style={styles.altLink} onPress={onBackToLogin}>
            Already have an account? <Text style={styles.link}>Sign in</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  logo: { width: 64, height: 64, marginBottom: spacing.sm, resizeMode: 'contain' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  promptCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg },
  promptHeader: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  promptHi: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 6 },
  promptOther: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 19 },
  promptHelp: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
  recordWrap: { alignItems: 'center', marginVertical: spacing.lg },
  bigMic: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 8 },
  bigMicEmoji: { fontSize: 64 },
  bigMicLabel: { color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 8 },
  attached: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, width: '100%' },
  attachedText: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  replace: { fontSize: 12, color: colors.error, fontWeight: '700' },
  phoneCard: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: 15 },
  phoneHint: { fontSize: 12, color: colors.muted, marginTop: 6 },
  submitBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg },
  submitBtnText: { color: colors.accentText, fontWeight: '700', fontSize: 16 },
  err: { color: colors.error, backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: radius.sm, fontSize: 13, marginTop: spacing.md, textAlign: 'center' },
  altLink: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: spacing.lg },
  link: { color: colors.accent, fontWeight: '700' },
});
