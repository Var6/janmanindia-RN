import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

const NATIVE = Platform.OS !== 'web';

export function Skeleton({
  width,
  height = 14,
  rounded = 6,
  style,
}: {
  width: number | `${number}%`;
  height?: number;
  rounded?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.border, opacity }, style]}
    />
  );
}

/** A list-row skeleton — title line + meta line + a small pill on the right. */
export function SkeletonRow() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
      }}>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width={'70%'} height={16} />
        <Skeleton width={'50%'} height={11} />
        <Skeleton width={'40%'} height={11} />
      </View>
      <Skeleton width={70} height={20} rounded={999} />
    </View>
  );
}

/** Title block + N skeleton rows. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View>
      <Skeleton width={'45%'} height={22} />
      <View style={{ height: 6 }} />
      <Skeleton width={'25%'} height={11} />
      <View style={{ height: spacing.lg }} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}
