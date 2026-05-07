import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

interface Props {
  title?: string;
  subtitle?: string;
  icon?: string;
  accent?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ title, subtitle, icon, accent, onPress, children, style }: Props) {
  const content = (
    <View style={[styles.card, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null, style]}>
      {(icon || title) && (
        <View style={styles.header}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      )}
      {children}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1 },
  icon: { fontSize: 24 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
