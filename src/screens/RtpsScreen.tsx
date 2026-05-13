import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Modal, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { useTabBarOnScroll } from '../lib/tabBarVisibility';

const SCHEMES: { category: string; title: string; description: string; steps: string[]; link: string; tint: string }[] = [
  {
    category: 'Right to Information',
    title: 'RTI Act, 2005',
    description:
      'Every community has the right to request information from public authorities within 30 days. File online at rtionline.gov.in or submit a written application with ₹10 fee.',
    steps: ['Identify the public authority', 'Draft your application clearly', 'Pay ₹10 fee (BPL applicants exempt)', 'Submit and track at rtionline.gov.in'],
    link: 'https://rtionline.gov.in',
    tint: '#3b82f6',
  },
  {
    category: 'Employment',
    title: 'MGNREGA',
    description:
      'Mahatma Gandhi National Rural Employment Guarantee Act guarantees 100 days of wage employment per year to rural households.',
    steps: ['Register at your local Gram Panchayat', 'Get Job Card issued within 15 days', 'Apply for work — must be provided within 15 days', 'Wages deposited directly to bank account'],
    link: 'https://nrega.nic.in',
    tint: '#10b981',
  },
  {
    category: 'Housing',
    title: 'PM Awas Yojana (PMAY)',
    description:
      'Affordable housing for economically weaker sections (EWS), low-income groups (LIG), and middle-income groups (MIG) with interest subsidy.',
    steps: ['Check eligibility on pmaymis.gov.in', 'Apply via Common Service Centre (CSC) or online', 'Income verification and survey', 'Subsidy credited to loan account'],
    link: 'https://pmaymis.gov.in',
    tint: '#f59e0b',
  },
  {
    category: 'Health',
    title: 'Ayushman Bharat (PMJAY)',
    description:
      'Health insurance cover of ₹5 lakh per family per year for secondary and tertiary hospitalisation. Covers 10.74 crore families.',
    steps: ['Check eligibility at pmjay.gov.in', 'Get Ayushman Card at CSC or hospital', 'Visit any empanelled hospital', 'Cashless treatment up to ₹5 lakh'],
    link: 'https://pmjay.gov.in',
    tint: '#f43f5e',
  },
  {
    category: 'Pension',
    title: 'PM Shram Yogi Maandhan',
    description:
      'Monthly pension of ₹3000 after age 60 for unorganised workers. Contribution ranges from ₹55–₹200 per month depending on age of entry.',
    steps: ['Visit nearest CSC with Aadhar and savings account', 'Enrol and start monthly contribution', 'Contribution matched by Central Government', 'Receive pension at 60'],
    link: 'https://maandhan.in',
    tint: '#8b5cf6',
  },
  {
    category: 'Education',
    title: 'PM Poshan Shakti Nirman',
    description:
      'Free mid-day meals for students in Classes 1–8 in government schools. Over 11.8 crore children covered.',
    steps: ['Enrol child in government school', 'Meals served on all working school days', 'Nutritional standards set by government', 'Complaints via helpline 1800-180-5500'],
    link: 'https://pmposhan.education.gov.in',
    tint: '#14b8a6',
  },
];

export function RtpsScreen() {
  const [askOpen, setAskOpen] = useState(false);
  const [askScheme, setAskScheme] = useState<string>('');
  const [askText, setAskText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function openAsk(schemeTitle: string) {
    setAskScheme(schemeTitle);
    setAskText('');
    setAskOpen(true);
  }

  async function submitAsk() {
    if (!askText.trim() && !askScheme) return;
    setSubmitting(true);
    const message = `Eligibility query — ${askScheme}\n\n${askText.trim() || '(I think I might be eligible — please review.)'}`;
    const r = await api('/api/community/voice-message', {
      method: 'POST',
      body: JSON.stringify({ text: message }),
    });
    setSubmitting(false);
    setAskOpen(false);
    if (!r.ok) {
      const msg = r.error ?? 'Could not send your question. Please try again.';
      if (Platform.OS === 'web') (typeof window !== 'undefined') && window.alert(msg);
      else Alert.alert('Failed', msg);
      return;
    }
    if (Platform.OS === 'web') (typeof window !== 'undefined') && window.alert('Sent. Your social worker will reach out about your eligibility.');
    else Alert.alert('Sent', 'Your social worker will reach out about your eligibility for this scheme.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 96 }]} {...useTabBarOnScroll()}>
        <Text style={styles.title}>Government Schemes & Rights</Text>
        <Text style={styles.subtitle}>
          Know your entitlements. Tap any scheme to apply on the official government portal.
        </Text>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerIcon}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.disclaimerTitle}>Not a government app</Text>
            <Text style={styles.disclaimerBody}>
              This app is operated by <Text style={{ fontWeight: '700' }}>Janman People's Foundation</Text>, an independent
              non-profit. It is not affiliated with, endorsed by, or operated by any government entity. Information below is
              summarised from official sources — always verify on the linked .gov.in portals before applying.
            </Text>
          </View>
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Need help applying?</Text>
          <Text style={styles.helpBody}>
            Your social worker can assist you with the application process. Request an appointment from the Appointments section.
          </Text>
        </View>

        {SCHEMES.map((s) => (
          <View key={s.title} style={[styles.card, { borderColor: s.tint + '55', backgroundColor: s.tint + '10' }]}>
            <View style={styles.cardTopRow}>
              <View style={[styles.badge, { backgroundColor: s.tint + '22' }]}>
                <Text style={[styles.badgeText, { color: s.tint }]}>{s.category}</Text>
              </View>
              <TouchableOpacity
                onPress={() => openAsk(s.title)}
                style={[styles.askBtn, { borderColor: s.tint }]}
                accessibilityLabel={`Ask if I'm eligible for ${s.title}`}>
                <Text style={[styles.askBtnText, { color: s.tint }]}>?</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardDesc}>{s.description}</Text>

            <Text style={styles.stepsHeader}>How to apply:</Text>
            {s.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: s.tint }]} />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => Linking.openURL(s.link)} style={styles.linkBtn}>
                <Text style={[styles.linkText, { color: s.tint }]}>Apply at {hostnameOf(s.link)} →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openAsk(s.title)} style={[styles.askInline, { borderColor: s.tint + '88' }]}>
                <Text style={[styles.askInlineText, { color: s.tint }]}>❓ Am I eligible?</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't see the scheme you need?{' '}
            <Text style={styles.footerLink} onPress={() => Linking.openURL('https://services.india.gov.in')}>
              Browse all schemes on India.gov.in
            </Text>
          </Text>
        </View>
      </ScrollView>

      <Modal visible={askOpen} animationType="slide" transparent onRequestClose={() => setAskOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ask about eligibility</Text>
            <Text style={styles.modalSchemeLabel}>{askScheme}</Text>
            <Text style={styles.modalHelp}>
              Tell us a little about your situation. Your social worker will check whether you qualify and call you back.
            </Text>
            <TextInput
              value={askText}
              onChangeText={setAskText}
              multiline
              placeholder="e.g. I am a daily-wage worker in Patna, my family of 4 has no health insurance — am I eligible?"
              placeholderTextColor={colors.muted}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAskOpen(false)} style={[styles.modalBtn, styles.modalBtnGhost]} disabled={submitting}>
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitAsk} style={[styles.modalBtn, styles.modalBtnPrimary, submitting && { opacity: 0.6 }]} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Send to social worker</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function hostnameOf(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: spacing.lg, lineHeight: 18 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  disclaimerIcon: { fontSize: 22, marginTop: 2 },
  disclaimerTitle: { fontSize: 13, fontWeight: '800', color: '#92400e', marginBottom: 4 },
  disclaimerBody: { fontSize: 12, color: '#78350f', lineHeight: 17 },
  helpCard: { backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '40', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  helpTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  helpBody: { fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 17 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, marginBottom: spacing.sm },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cardDesc: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 },
  stepsHeader: { fontSize: 11, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  stepDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginRight: spacing.sm },
  stepText: { fontSize: 12, color: colors.muted, flex: 1, lineHeight: 17 },
  linkBtn: { marginTop: spacing.md },
  linkText: { fontSize: 12, fontWeight: '700' },
  footer: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.lg },
  footerText: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  footerLink: { color: colors.accent, fontWeight: '700' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  askBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  askBtnText: { fontSize: 16, fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.sm },
  askInline: { paddingHorizontal: spacing.md, paddingVertical: 8, borderWidth: 1, borderRadius: radius.md },
  askInlineText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, padding: spacing.lg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, gap: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSchemeLabel: { fontSize: 13, fontWeight: '700', color: colors.accent },
  modalHelp: { fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: spacing.sm },
  modalInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: 14, minHeight: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  modalBtnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  modalBtnGhostText: { fontSize: 14, fontWeight: '700', color: colors.text },
  modalBtnPrimary: { backgroundColor: colors.accent },
  modalBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
});
