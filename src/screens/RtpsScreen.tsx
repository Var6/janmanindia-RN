import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 96 }]} {...useTabBarOnScroll()}>
        <Text style={styles.title}>Government Schemes & Rights</Text>
        <Text style={styles.subtitle}>
          Know your entitlements. Tap any scheme to apply on the official government portal.
        </Text>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Need help applying?</Text>
          <Text style={styles.helpBody}>
            Your social worker can assist you with the application process. Request an appointment from the Appointments section.
          </Text>
        </View>

        {SCHEMES.map((s) => (
          <View key={s.title} style={[styles.card, { borderColor: s.tint + '55', backgroundColor: s.tint + '10' }]}>
            <View style={[styles.badge, { backgroundColor: s.tint + '22' }]}>
              <Text style={[styles.badgeText, { color: s.tint }]}>{s.category}</Text>
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

            <TouchableOpacity onPress={() => Linking.openURL(s.link)} style={styles.linkBtn}>
              <Text style={[styles.linkText, { color: s.tint }]}>Apply at {hostnameOf(s.link)} →</Text>
            </TouchableOpacity>
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
});
