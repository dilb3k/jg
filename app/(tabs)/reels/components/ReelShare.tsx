import { useI18n } from "@/shared/i18n/useI18n";
import { Reel } from "@/shared/types/reel";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Share as RNShare,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  FacebookIcon,
  InstagramIcon,
  LinkIcon,
  ShareIcon,
  SnapchatIcon,
  TelegramIcon,
  TikTokIcon,
  XIcon,
} from "@/shared/ui/icons/SocialIcons";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  visible: boolean;
  onClose: () => void;
  reel: Reel;
};

export default function ReelShare({ visible, onClose, reel }: Props) {
  const { t } = useI18n();
  const { height: screenHeight } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const shareUrl = `https://yourapp.com/reel/${reel.id}`;
  const shareText =
    (reel.title_uz || reel.title_ru || reel.title_en || t("reels.defaultTitle")) +
    " - AlloPlay";

  useEffect(() => {
    const animations = visible
      ? [
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 70,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
        ]
      : [
          Animated.spring(slideAnim, {
            toValue: screenHeight,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ];

    Animated.parallel(animations).start();
  }, [fadeAnim, screenHeight, slideAnim, visible]);

  const copyLink = useCallback(async () => {
    await Clipboard.setStringAsync(shareUrl);
    onClose();
  }, [onClose, shareUrl]);

  const nativeShare = useCallback(async () => {
    try {
      await RNShare.share({
        message: `${shareText}\n${shareUrl}`,
        url: shareUrl,
      });
      onClose();
    } catch (e) {
      console.error(e);
    }
  }, [onClose, shareText, shareUrl]);

  const open = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
    onClose();
  }, [onClose]);

  const openApp = useCallback((scheme: string, msg: string) => {
    Linking.openURL(scheme).catch(() => Alert.alert(t("common.error"), msg));
    onClose();
  }, [onClose, t]);

  const socials = useMemo(
    () => [
    {
      Icon: LinkIcon,
      label: t("reels.copyLink"),
      action: copyLink,
      bg: "#404040",
    },
    {
      Icon: ShareIcon,
      label: t("reels.shareAction"),
      action: nativeShare,
      bg: "#404040",
    },
    {
      Icon: TelegramIcon,
      label: "Telegram",
      action: () =>
        open(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        ),
      bg: "#0088CC",
    },
    {
      Icon: InstagramIcon,
      label: "Instagram",
      action: () => openApp("instagram://", `${t("reels.appNotInstalled")}: Instagram`),
      gradientColors: ["#feda75", "#d62976", "#8134af", "#515bd4"],
    },
    {
      Icon: FacebookIcon,
      label: "Facebook",
      action: () =>
        open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        ),
      bg: "#1877F2",
    },
    {
      Icon: TikTokIcon,
      label: "TikTok",
      action: () => openApp("tiktok://", `${t("reels.appNotInstalled")}: TikTok`),
      bg: "black",
      border: true,
    },
    {
      Icon: SnapchatIcon,
      label: "Snapchat",
      action: () => openApp("snapchat://", `${t("reels.appNotInstalled")}: Snapchat`),
      bg: "#FFFC00",
      color: "#000",
    },
    {
      Icon: XIcon,
      label: "X",
      action: () =>
        open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        ),
      bg: "black",
      border: true,
    },
    ],
    [copyLink, nativeShare, open, openApp, shareText, shareUrl, t],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, justifyContent: "flex-end" }}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={{ opacity: fadeAnim }}
          pointerEvents="none"
          className="absolute inset-0 bg-black"
        />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: "hidden",
            backgroundColor: "transparent",
          }}
        >
          <BlurView
            intensity={100}
            tint="dark"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          >
            <View className="items-center py-4">
              <View className="w-12 h-1.5 rounded-full bg-white/40" />
            </View>

            <Text className="text-white text-2xl font-bold text-center mb-7">
              {t("reels.share")}
            </Text>

            <View className="flex-row flex-wrap justify-between px-4 mb-8">
              {socials.map(
                (
                  { Icon, label, action, bg, border, color, gradientColors },
                  i,
                ) => (
                  <TouchableOpacity
                    key={i}
                    className="items-center w-1/4 mb-5"
                    onPress={action}
                    activeOpacity={0.75}
                  >
                    <View
                      className={`w-16 h-16 rounded-full items-center justify-center mb-2 shadow-xl overflow-hidden ${
                        border ? "border border-white/30" : ""
                      }`}
                    >
                      {gradientColors ? (
                        <LinearGradient
                          colors={gradientColors as unknown as readonly [string, string, ...string[]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ flex: 1, width: "100%", height: "100%" }}
                        >
                          <View className="flex-1 items-center justify-center">
                            <Icon size={28} color="#fff" />
                          </View>
                        </LinearGradient>
                      ) : (
                        <View
                          style={{
                            backgroundColor: bg,
                            width: "100%",
                            height: "100%",
                          }}
                          className="items-center justify-center"
                        >
                          <Icon size={28} color={color ?? "#fff"} />
                        </View>
                      )}
                    </View>

                    <Text className="text-white text-xs font-medium text-center">
                      {label}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
