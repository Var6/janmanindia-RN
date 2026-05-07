import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

const STYLES: Record<string, { bg: string; color: string }> = {
  Open:        { bg: colors.infoBg,    color: colors.infoText },
  Pending:     { bg: colors.warningBg, color: colors.warning },
  Escalated:   { bg: colors.errorBg,   color: colors.error },
  Closed:      { bg: '#f1f5f9',        color: colors.muted },
  Dismissed:   { bg: colors.errorBg,   color: colors.error },
  Disposal:    { bg: colors.successBg, color: colors.success },
  Withdrawn:   { bg: '#f1f5f9',        color: colors.muted },
  confirmed:           { bg: colors.successBg, color: colors.success },
  confirmed_litigation:{ bg: colors.successBg, color: colors.success },
  approved_sw:         { bg: colors.infoBg,    color: colors.infoText },
  pending:             { bg: colors.warningBg, color: colors.warning },
  pending_sw:          { bg: colors.warningBg, color: colors.warning },
  rejected:            { bg: colors.errorBg,   color: colors.error },
  cancelled:           { bg: '#f1f5f9',        color: colors.muted },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? { bg: '#f1f5f9', color: colors.muted };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.color }]}>{status.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
