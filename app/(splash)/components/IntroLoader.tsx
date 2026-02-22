import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

export default function IntroLoader() {
  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(14)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const dots = useRef([
    new Animated.Value(0.4),
    new Animated.Value(0.4),
    new Animated.Value(0.4),
  ]).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin1, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(spin2, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 450,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.timing(brandTranslateY, {
        toValue: 0,
        duration: 450,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2500,
        delay: 450,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    const createDotLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.45,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(650),
        ]),
      );

    createDotLoop(dots[0], 0).start();
    createDotLoop(dots[1], 180).start();
    createDotLoop(dots[2], 360).start();
  }, [brandOpacity, brandTranslateY, dots, logoScale, progress, spin1, spin2]);

  const spin1Rotate = spin1.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const spin2Rotate = spin2.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: ["0%", "70%", "100%"],
  });

  return (
    <View className="flex-1 bg-[#101010] items-center justify-center">
      <View style={{ width: 120, height: 120, marginBottom: 28 }}>
        <Animated.View
          style={{
            position: "absolute",
            top: -15,
            left: -15,
            width: 150,
            height: 150,
            borderRadius: 75,
            borderWidth: 3,
            borderTopColor: "#d40000",
            borderRightColor: "#d40000",
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            transform: [{ rotate: spin1Rotate }],
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            top: -8,
            left: -8,
            width: 136,
            height: 136,
            borderRadius: 68,
            borderWidth: 2,
            borderBottomColor: "#ff3333",
            borderLeftColor: "#ff3333",
            borderTopColor: "transparent",
            borderRightColor: "transparent",
            transform: [{ rotate: spin2Rotate }],
          }}
        />

        <Animated.Image
          source={require("../../../assets/images/logo.png")}
          style={{
            width: 120,
            height: 120,
            resizeMode: "contain",
            transform: [{ scale: logoScale }],
          }}
        />
      </View>

      <Animated.View
        style={{
          opacity: brandOpacity,
          transform: [{ translateY: brandTranslateY }],
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: "700", color: "#fff", letterSpacing: 1 }}>
          <Text style={{ color: "#d40000" }}>Allo</Text> play
        </Text>
      </Animated.View>

      <View
        style={{
          width: 200,
          height: 3,
          backgroundColor: "#f0f0f0",
          borderRadius: 3,
          marginTop: 24,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width: progressWidth,
            height: "100%",
            backgroundColor: "#d40000",
            borderRadius: 3,
          }}
        />
      </View>

      <View className="flex-row mt-5" style={{ gap: 6 }}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#d40000",
              opacity: dot,
              transform: [{ scale: dot }],
            }}
          />
        ))}
      </View>
    </View>
  );
}
