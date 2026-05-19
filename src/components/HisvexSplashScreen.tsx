import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const C = {
  bg: "#0A0718",
  bgMid: "#110D2E",
  primary: "#7C3AED",
  primaryDark: "#4C1D95",
  accent: "#A78BFA",
  accentLight: "#C4B5FD",
  white: "#FFFFFF",
  green: "#34D399",
  cardBg: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(167,139,250,0.2)",
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SplashLogoProps {
  scale: Animated.Value;
  opacity: Animated.Value;
}

function SplashLogo({ scale, opacity }: SplashLogoProps) {
  return (
    <Animated.View
    >
      <Image
        source={require("../../assets/logo-splash.png")}
        style={styles.logoImage}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  change: string;
}

function StatCard({ value, label, change }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statChange}>{change}</Text>
    </View>
  );
}

interface ParticleProps {
  x: number;
  startY: number;
  size: number;
  duration: number;
  delay: number;
}

function Particle({ x, startY, size, duration, delay }: ParticleProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Reset instantly before looping
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    // ✅ FIX: stop loop on unmount to prevent memory leak
    return () => animation.stop();
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -130],
  });

  const particleOpacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 0.5, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.accent,
        transform: [{ translateY }],
        opacity: particleOpacity,
      }}
    />
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

interface HisvexSplashScreenProps {
  onFinish?: () => void;
}

export default function HisvexSplashScreen({ onFinish }: HisvexSplashScreenProps) {
  const iconScale    = useRef(new Animated.Value(0.2)).current;
  const iconOpacity  = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY       = useRef(new Animated.Value(30)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsY       = useRef(new Animated.Value(20)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  // ✅ FIX: useNativeDriver:false animation — kept on JS thread (correct for width layout prop)
  const progressWidth = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // ✅ FIX: Store dot loop refs so we can stop them on unmount
  const dotLoops = useRef<Animated.CompositeAnimation[]>([]);
  // ✅ FIX: Store timer IDs to clear on unmount
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const pulseDot = (dot: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0.3,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    );

  useEffect(() => {
    // Phase 1: Logo pop-in
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 55,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Brand name slide up
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(brandY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Phase 3: Tagline fade
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Phase 4: Stat cards
        const t1 = setTimeout(() => {
          Animated.parallel([
            Animated.timing(cardsOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(cardsY, {
              toValue: 0,
              tension: 70,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        }, 200);
        timers.current.push(t1);

        // Phase 5: Loader + progress
        const t2 = setTimeout(() => {
          Animated.timing(loaderOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();

          // Store loops so we can stop them
          const l1 = pulseDot(dot1, 0);
          const l2 = pulseDot(dot2, 200);
          const l3 = pulseDot(dot3, 400);
          dotLoops.current = [l1, l2, l3];
          l1.start();
          l2.start();
          l3.start();

          Animated.timing(progressWidth, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false, // ✅ Must be false — animating layout `width`
          }).start();
        }, 500);
        timers.current.push(t2);

        // Phase 6: Fade out and finish
        const t3 = setTimeout(() => {
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }).start(() => onFinish?.());
        }, 2900);
        timers.current.push(t3);
      });
    });

    // ✅ FIX: Full cleanup on unmount
    return () => {
      timers.current.forEach(clearTimeout);
      dotLoops.current.forEach((loop) => loop.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ^ deps intentionally empty: all Animated.Values are stable refs;
  //   including them would cause stale-closure lint noise without benefit.

  const barW = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  const PARTICLES: ParticleProps[] = [
    { x: width * 0.18, startY: height * 0.55, size: 3, duration: 3200, delay: 0 },
    { x: width * 0.60, startY: height * 0.60, size: 2, duration: 2800, delay: 500 },
    { x: width * 0.42, startY: height * 0.50, size: 2, duration: 3800, delay: 1100 },
    { x: width * 0.78, startY: height * 0.58, size: 3, duration: 2500, delay: 800 },
    { x: width * 0.12, startY: height * 0.65, size: 2, duration: 4000, delay: 300 },
  ];

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} translucent />

      <LinearGradient
        colors={[C.bg, C.bgMid, "#0D0B22"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Center content */}
      <View style={styles.center}>
        <SplashLogo scale={iconScale} opacity={iconOpacity} />

        <Animated.Text
          style={[
            styles.brandName,
            { opacity: brandOpacity, transform: [{ translateY: brandY }] },
          ]}
        >
          Hisvex
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Hisobni aniq boshqar
        </Animated.Text>

        <Animated.View
          style={[
            styles.statsRow,
            { opacity: cardsOpacity, transform: [{ translateY: cardsY }] },
          ]}
        >
          <StatCard value="2.45M" label="Bugungi foyda" change="↑ 12%" />
          <StatCard value="21"    label="Dalollar"       change="↑ 3"   />
          <StatCard value="+350K" label="Savdo"          change="↑ 8%"  />
        </Animated.View>
      </View>

      {/* Bottom loader */}
      <Animated.View style={[styles.loaderSection, { opacity: loaderOpacity }]}>
        <View style={styles.dotsRow}>
          {([dot1, dot2, dot3] as Animated.Value[]).map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { opacity: dot, transform: [{ scale: dot }] }]}
            />
          ))}
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barW }]} />
        </View>
        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ✅ FIX: removed `boxShadow` (web-only, not valid in RN StyleSheet)
  //    Use `elevation` (Android) + `shadowColor/Offset/Opacity/Radius` (iOS)
  orb1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.primary,
    opacity: 0.18,
    top: -80,
    left: -80,
  },
  orb2: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: C.accent,
    opacity: 0.1,
    bottom: 80,
    right: -60,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  // ✅ FIX: removed `boxShadow` (invalid in RN); replaced with cross-platform shadow
  // ✅ FIX: removed `inset` (CSS shorthand, not valid in RN)
  // ✅ FIX: logoImage is now 100% of box (120×120) to avoid overflow
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 32,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(167,139,250,0.35)",
    overflow: "hidden",          // clip image to rounded corners
    // Cross-platform glow approximation
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  // ✅ FIX: exact fit inside logoBox (was 126×126 overflowing 120×120 container)
  logoImage: {
    width: 120,
    height: 120,
  },

  brandName: {
    fontSize: 42,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(196,181,253,0.8)",
    letterSpacing: 0.4,
    marginBottom: 40,
  },

  // ✅ FIX: `gap` requires RN ≥ 0.71. Added marginRight fallback for older versions.
  statsRow: {
    flexDirection: "row",
    width: "100%",
  },
  statCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 5, // replaces `gap: 10` for compatibility
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(196,181,253,0.55)",
    marginTop: 2,
    textAlign: "center",
  },
  statChange: {
    fontSize: 11,
    color: C.green,
    fontWeight: "600",
    marginTop: 3,
  },

  loaderSection: {
    alignItems: "center",
    paddingBottom: 52,
  },
  dotsRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.accent,
    marginHorizontal: 4, // replaces `gap: 8`
  },
  progressTrack: {
    width: 160,
    height: 3,
    backgroundColor: "rgba(167,139,250,0.15)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  versionText: {
    fontSize: 10,
    color: "rgba(167,139,250,0.3)",
    letterSpacing: 1,
  },
});