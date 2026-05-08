import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';

type Ctx = {
  translateY: Animated.Value;
  show: () => void;
  hide: () => void;
  bumpIdle: () => void;
};

const TabBarCtx = createContext<Ctx | null>(null);

const HIDE_OFFSET = 120;       // how far below the screen the bar slides
const ANIM_MS = 180;
const IDLE_MS = 500;           // re-show after this many ms of no scrolling
const SCROLL_THRESHOLD = 4;    // ignore micro-jitter under this delta
const PEEK_OFFSET = 50;        // don't hide while still near the top

// Native driver isn't available in the browser; only enable on iOS/Android.
const USE_NATIVE = Platform.OS !== 'web';

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const hidden = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const animateTo = useCallback((to: number) => {
    if (animationRef.current) animationRef.current.stop();
    animationRef.current = Animated.timing(translateY, {
      toValue: to,
      duration: ANIM_MS,
      useNativeDriver: USE_NATIVE,
    });
    animationRef.current.start();
  }, [translateY]);

  const show = useCallback(() => {
    if (!hidden.current) return;
    hidden.current = false;
    animateTo(0);
  }, [animateTo]);

  const hide = useCallback(() => {
    if (hidden.current) return;
    hidden.current = true;
    animateTo(HIDE_OFFSET);
  }, [animateTo]);

  const bumpIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      hidden.current = true; // force show() to actually run regardless of state drift
      show();
    }, IDLE_MS);
  }, [show]);

  const value = useMemo(() => ({ translateY, show, hide, bumpIdle }), [translateY, show, hide, bumpIdle]);

  useEffect(() => () => { if (idleTimer.current) clearTimeout(idleTimer.current); }, []);

  return <TabBarCtx.Provider value={value}>{children}</TabBarCtx.Provider>;
}

export function useTabBarTranslateY(): Animated.Value | null {
  return useContext(TabBarCtx)?.translateY ?? null;
}

/**
 * Returns props to spread onto a ScrollView / FlatList. Hides the tab bar on
 * downward scroll, shows it on upward scroll, and brings it back after 2s
 * of idle time.
 */
export function useTabBarOnScroll() {
  const ctx = useContext(TabBarCtx);
  const lastY = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!ctx) return;
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;

    // Always reset the idle timer on any scroll event so it fires after the
    // user genuinely stops moving.
    ctx.bumpIdle();

    if (Math.abs(dy) < SCROLL_THRESHOLD) return;
    if (y < PEEK_OFFSET || dy < 0) ctx.show();
    else ctx.hide();
  }, [ctx]);

  return { onScroll, scrollEventThrottle: 16 };
}
