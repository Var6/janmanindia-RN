import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  Image, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { register, uploadFile } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';

const ID_TYPES = [
  { value: 'Aadhar',         label: 'Aadhaar (आधार)' },
  { value: 'VoterId',        label: 'Voter ID (मतदाता पहचान पत्र)' },
  { value: 'RationCard',     label: 'Ration card (राशन कार्ड)' },
  { value: 'DrivingLicense', label: 'Driving license (ड्राइविंग लाइसेंस)' },
  { value: 'Passport',       label: 'Passport (पासपोर्ट)' },
  { value: 'Other',          label: 'Other' },
];

const LANGUAGES = ['Hindi', 'Maithili', 'Bhojpuri', 'Urdu', 'English', 'Other'];

export function SignupScreen({
  onRegistered,
  onBackToLogin,
}: {
  onRegistered: (email: string) => void;
  onBackToLogin: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [govtIdType, setGovtIdType] = useState('');

  const [idDocUrl, setIdDocUrl] = useState('');
  const [idDocLabel, setIdDocLabel] = useState('');
  const [uploadingId, setUploadingId] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [voiceUrl, setVoiceUrl] = useState('');
  const [voiceDur, setVoiceDur] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function pickIdImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to attach an ID.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    await doUpload(asset.uri, asset.fileName ?? `id-${Date.now()}.jpg`, asset.mimeType ?? 'image/jpeg');
  }

  async function pickIdDoc() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    await doUpload(asset.uri, asset.name ?? `id-${Date.now()}`, asset.mimeType ?? 'application/pdf');
  }

  async function doUpload(uri: string, name: string, mimeType: string) {
    setUploadingId(true);
    setErr('');
    const r = await uploadFile(uri, name, mimeType);
    setUploadingId(false);
    if (!r.ok || !r.data) {
      setErr(r.error ?? 'ID upload failed.');
      return;
    }
    setIdDocUrl(r.data.url);
    setIdDocLabel(name);
  }

  async function startRecording() {
    try {
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
      setUploadingVoice(true);
      setErr('');
      const r = await uploadFile(uri, `voice-intro-${Date.now()}.m4a`, 'audio/m4a');
      setUploadingVoice(false);
      if (!r.ok || !r.data) {
        setErr(r.error ?? 'Voice upload failed.');
        return;
      }
      setVoiceUrl(r.data.url);
      setVoiceDur(dur);
    } catch (e) {
      setRecording(null);
      setUploadingVoice(false);
      Alert.alert('Recording failed', String(e));
    }
  }

  async function submit() {
    setErr('');
    if (!name.trim() || !email.trim() || !password) {
      setErr('Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    if (!idDocUrl && !voiceUrl) {
      setErr('Attach an ID document OR record a short voice intro so a social worker can verify you.');
      return;
    }
    setLoading(true);
    const r = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      district: district.trim() || undefined,
      village: village.trim() || undefined,
      preferredLanguage: preferredLanguage || undefined,
      govtIdType: idDocUrl ? (govtIdType || 'Other') : undefined,
      govtIdUrl: idDocUrl || undefined,
      voiceIntroUrl: voiceUrl || undefined,
      voiceIntroDurationSec: voiceUrl ? voiceDur : undefined,
    });
    setLoading(false);
    if (!r.ok) {
      setErr(r.error ?? 'Registration failed.');
      return;
    }
    onRegistered(email.trim());
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.title}>Welcome to Janman</Text>
            <Text style={styles.subtitle}>आप अकेले नहीं हैं — हम आपके साथ हैं।</Text>
            <Text style={styles.intro}>
              Free legal aid · Bihar. A social worker reviews your registration within 48 hours and calls you back.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>New community member</Text>
            <Text style={styles.sectionHint}>Fields marked * are required.</Text>

            {err ? <Text style={styles.err}>{err}</Text> : null}

            <Field label="Full name (पूरा नाम) *">
              <TextInput value={name} onChangeText={setName} placeholder="Your name as on ID" placeholderTextColor={colors.muted} style={styles.input} />
            </Field>

            <Field label="Phone (मोबाइल) *">
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 9999999999" placeholderTextColor={colors.muted} style={styles.input} />
            </Field>

            <Field label="Email *">
              <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.muted} style={styles.input} />
            </Field>

            <Field label="Password (8+ characters) *">
              <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.muted} style={styles.input} />
            </Field>

            <Field label="Preferred language">
              <ChipRow options={LANGUAGES} value={preferredLanguage} onChange={setPreferredLanguage} />
            </Field>

            <Field label="District (ज़िला)">
              <TextInput value={district} onChangeText={setDistrict} placeholder="e.g. Patna / Purnia" placeholderTextColor={colors.muted} style={styles.input} />
            </Field>

            <Field label="Village / area (गाँव / मोहल्ला)">
              <TextInput value={village} onChangeText={setVillage} placeholder="optional" placeholderTextColor={colors.muted} style={styles.input} />
            </Field>

            <View style={styles.fieldset}>
              <Text style={styles.legend}>ID document (or skip and record voice below)</Text>
              <ChipRow options={ID_TYPES.map(t => t.value)} labels={ID_TYPES.map(t => t.label)} value={govtIdType} onChange={setGovtIdType} />
              {idDocUrl ? (
                <View style={styles.attached}>
                  <Text style={styles.attachedText}>✓ {idDocLabel || 'ID attached'}</Text>
                  <TouchableOpacity onPress={() => { setIdDocUrl(''); setIdDocLabel(''); }}>
                    <Text style={styles.replace}>Replace</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} disabled={uploadingId} onPress={pickIdImage}>
                    <Text style={styles.secondaryBtnText}>{uploadingId ? 'Uploading…' : '🖼️ Photo'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} disabled={uploadingId} onPress={pickIdDoc}>
                    <Text style={styles.secondaryBtnText}>{uploadingId ? 'Uploading…' : '📎 PDF / file'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.fieldset}>
              <Text style={styles.legend}>Voice introduction (आवाज़ में परिचय)</Text>
              <Text style={styles.helpText}>Can't read or write? Just record a short message — your name, where you live, and what happened. A social worker will listen and call you back.</Text>
              {voiceUrl ? (
                <View style={styles.attached}>
                  <Text style={styles.attachedText}>🎤 Voice recorded · {voiceDur}s</Text>
                  <TouchableOpacity onPress={() => { setVoiceUrl(''); setVoiceDur(0); }}>
                    <Text style={styles.replace}>Re-record</Text>
                  </TouchableOpacity>
                </View>
              ) : recording ? (
                <TouchableOpacity onPress={stopRecording} style={[styles.recBtn, { backgroundColor: colors.error }]}>
                  <Text style={styles.recBtnText}>⏹ Stop recording</Text>
                </TouchableOpacity>
              ) : uploadingVoice ? (
                <View style={[styles.recBtn, { opacity: 0.7 }]}><ActivityIndicator color="#fff" /></View>
              ) : (
                <TouchableOpacity onPress={startRecording} style={styles.recBtn}>
                  <Text style={styles.recBtnText}>🎤 Record voice introduction</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity onPress={submit} disabled={loading || uploadingId || uploadingVoice} style={[styles.btn, (loading || uploadingId || uploadingVoice) && { opacity: 0.6 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit registration</Text>}
            </TouchableOpacity>

            <Text style={styles.privacy}>
              By registering you agree that a Janman social worker may contact you. Your information stays private.
            </Text>

            <Text style={styles.hint} onPress={onBackToLogin}>
              Already have an account? <Text style={styles.link}>Sign in</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow({ options, labels, value, onChange }: { options: string[]; labels?: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt, i) => {
        const active = value === opt;
        return (
          <TouchableOpacity key={opt} onPress={() => onChange(active ? '' : opt)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{labels?.[i] ?? opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
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
  intro: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: spacing.md, lineHeight: 19, paddingHorizontal: spacing.md },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionHint: { fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: spacing.sm },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: 15 },
  fieldset: { marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bg },
  legend: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  helpText: { fontSize: 12, color: colors.muted, lineHeight: 17, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.accentText },
  attached: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  attachedText: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },
  replace: { fontSize: 12, color: colors.error, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', backgroundColor: colors.surface },
  secondaryBtnText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  recBtn: { backgroundColor: '#7c3aed', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  recBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  btnText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
  err: { color: colors.error, backgroundColor: colors.errorBg, padding: spacing.sm, borderRadius: radius.sm, fontSize: 13, marginTop: spacing.sm },
  privacy: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: spacing.md, lineHeight: 16 },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: spacing.lg },
  link: { color: colors.accent, fontWeight: '700' },
});
