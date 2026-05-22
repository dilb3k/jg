import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SPACING } from "../constants";

const { width, height } = Dimensions.get("window");

const C = {
  bg: "#070512",
  bgMid: "#0F0A2E",
  bgDeep: "#0C0820",
  primary: "#7C3AED",
  mid: "#5B21B6",
  deep: "#4C1D95",
  accent: "#A78BFA",
  accentDim: "rgba(167,139,250,0.65)",
  white: "#FFFFFF",
  glass: "rgba(124,58,237,0.12)",
  glassB: "rgba(124,58,237,0.35)",
} as const;

// ─── Sparkle dot ────────────────────────────────────────────────────────────
function Sparkle({
  x,
  y,
  delay,
  size = 5,
}: {
  x: number;
  y: number;
  delay: number;
  size?: number;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(op, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(sc, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(op, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(sc, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.accent,
        opacity: op,
        transform: [{ scale: sc }],
      }}
    />
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function HisvexSplashScreen({
  onFinish,
}: {
  onFinish?: () => void;
}) {
  const screenOpacity = useRef(new Animated.Value(0)).current;

  // Logo
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;

  // Brand text
  const brandY = useRef(new Animated.Value(30)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;

  // Tagline
  const tagY = useRef(new Animated.Value(15)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  // Badge
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.8)).current;

  // Progress
  const barWidth = useRef(new Animated.Value(0)).current;

  // Orbs
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ambient orb float
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1X, {
            toValue: 18,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Y, {
            toValue: -14,
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb1X, {
            toValue: 0,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Y, {
            toValue: 0,
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb2X, {
            toValue: -14,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Y, {
            toValue: 18,
            duration: 5500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb2X, {
            toValue: 0,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Y, {
            toValue: 0,
            duration: 5500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

    // Intro sequence
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      // Logo spin-in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 36,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Logo idle pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoPulse, {
              toValue: 1.06,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(logoPulse, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ).start();

        // Brand name
        Animated.parallel([
          Animated.timing(brandOpacity, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.spring(brandY, {
            toValue: 0,
            tension: 90,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Tagline
          Animated.parallel([
            Animated.timing(tagOpacity, {
              toValue: 1,
              duration: 320,
              useNativeDriver: true,
            }),
            Animated.spring(tagY, {
              toValue: 0,
              tension: 80,
              friction: 9,
              useNativeDriver: true,
            }),
          ]).start();

          // Badge
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(badgeOpacity, {
                toValue: 1,
                duration: 280,
                useNativeDriver: true,
              }),
              Animated.spring(badgeScale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
            ]).start();
          }, 150);

          // Progress bar
          setTimeout(() => {
            Animated.timing(barWidth, {
              toValue: 1,
              duration: 1600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }).start();
          }, 250);

          // Fade out
          setTimeout(() => {
            Animated.timing(screenOpacity, {
              toValue: 0,
              duration: 420,
              useNativeDriver: true,
            }).start(() => onFinish?.());
          }, 2800);
        });
      });
    });
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressW = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} translucent />

      {/* Base gradient */}
      <LinearGradient
        colors={[C.bg, C.bgMid, C.bgDeep, C.bg]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Grid overlay */}
      <View style={styles.grid} pointerEvents="none" />

      {/* Ambient orbs */}
      <Animated.View
        style={[
          styles.orb1,
          { transform: [{ translateX: orb1X }, { translateY: orb1Y }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(124,58,237,0.28)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.orb2,
          { transform: [{ translateX: orb2X }, { translateY: orb2Y }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(167,139,250,0.18)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={styles.orb3}>
        <LinearGradient
          colors={["rgba(91,33,182,0.22)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Sparkles */}
      <Sparkle x={width * 0.14} y={height * 0.18} delay={500} />
      <Sparkle x={width * 0.82} y={height * 0.23} delay={1000} size={4} />
      <Sparkle x={width * 0.08} y={height * 0.58} delay={200} size={4} />
      <Sparkle x={width * 0.88} y={height * 0.67} delay={1500} />
      <Sparkle x={width * 0.06} y={height * 0.4} delay={800} size={3} />
      <Sparkle x={width * 0.92} y={height * 0.44} delay={300} size={3} />

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.Image
          source={require("../../assets/Hisvex.png")}
          style={[
            styles.logoImage,
            {
              transform: [
                { scale: Animated.multiply(logoScale, logoPulse) },
                { rotate: spin },
              ],
            },
          ]}
          resizeMode="contain"
        />

        {/* Brand name */}
        <Animated.View
          style={{
            opacity: brandOpacity,
            transform: [{ translateY: brandY }],
            flexDirection: "row",
            marginBottom: 10,
            marginTop: -16,
          }}
        >
          <Text style={styles.brandHis}>His</Text>
          <Text style={styles.brandVex}>vex</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: tagOpacity, transform: [{ translateY: tagY }] },
          ]}
        >
          Hisobni aniq boshqar
        </Animated.Text>

        {/* Badge */}
        <Animated.View
          style={[
            styles.badge,
            {
              opacity: badgeOpacity,
              transform: [{ scale: badgeScale }],
            },
          ]}
        >
          <Text style={styles.badgeText}>MOLIYAVIY BOSHQARUV</Text>
        </Animated.View>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressW }]}>
            <LinearGradient
              colors={[C.primary, C.accent, C.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Background ──
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
  },

  orb1: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    top: -80,
    left: -70,
    overflow: "hidden",
  },
  orb2: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: 90,
    right: -60,
    overflow: "hidden",
  },
  orb3: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: "48%",
    left: "50%",
    marginLeft: -100,
    marginTop: -100,
    overflow: "hidden",
  },

  // ── Content ──
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // ── Logo ──
  logoImage: {
    width: 220,
    height: 220,
    marginBottom: -SPACING.xxxl,
  },

  // ── Brand ──
  brandHis: {
    fontSize: 54,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -1,
  },
  brandVex: {
    fontSize: 54,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -1,
  },

  // ── Tagline ──
  tagline: {
    fontSize: 16,
    color: "rgba(196,181,253,0.65)",
    letterSpacing: 0.7,
    marginBottom: 20,
  },

  // ── Badge ──
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.4)",
    backgroundColor: "rgba(124,58,237,0.1)",
  },
  badgeText: {
    fontSize: 11,
    color: "rgba(167,139,250,0.75)",
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    width: 160,
    height: 2,
    backgroundColor: "rgba(167,139,250,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  version: {
    fontSize: 10,
    color: "rgba(167,139,250,0.22)",
    letterSpacing: 2,
  },
});
