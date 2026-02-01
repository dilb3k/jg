import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function TelegramIcon({ size = 28, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.944 2.567a1.5 1.5 0 0 0-1.513-.393L2.934 8.58a1.5 1.5 0 0 0 .01 2.836l3.799 1.278 1.685 5.053a1.5 1.5 0 0 0 2.411.611l2.503-2.224 4.106 2.97a1.5 1.5 0 0 0 2.166-.702l3.326-12.33a1.5 1.5 0 0 0-.996-1.505z"
        fill={color}
      />
    </Svg>
  );
}

export function InstagramIcon({ size = 28, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke={color}
        strokeWidth="2"
      />
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
      <Circle cx="17.5" cy="6.5" r="1" fill={color} />
    </Svg>
  );
}

export function FacebookIcon({ size = 28, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"
        fill={color}
      />
    </Svg>
  );
}

export function TikTokIcon({ size = 28, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
        fill={color}
      />
    </Svg>
  );
}

export function SnapchatIcon({ size = 28, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="#fff">
      <Path
        d="M24.012 42.27c3.827-.002 4.967-1.607 7.486-2.724 2.25-.998 5.469.509 6.137-2.162 0.086-1.38 2.513-1.158 3.874-2.1 1.242-.859 1.366-2.236.09-2.778-2.888-1.227-5.923-3.914-6.658-6.796-.458-1.798 5.279-2.351 4.084-5.74-.705-2-3.238-1.296-4.616-.848.918-7.109-2.542-13.392-10.41-13.392s-11.328 6.284-10.41 13.392c-1.378-.448-3.911-1.152-4.616.848-1.195 3.39 4.542 3.942 4.084 5.74-.735 2.882-3.77 5.57-6.658 6.796-1.276.542-1.152 1.919.09 2.778 1.361.942 3.788.72 3.874 2.1.667 2.671 3.888 1.164 6.137 2.162 2.519 1.117 3.659 2.721 7.486 2.724"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function XIcon({ size = 24, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        fill={color}
      />
    </Svg>
  );
}

export function LinkIcon({ size = 24, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShareIcon({ size = 24, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" />
      <Line
        x1="8.59"
        y1="13.51"
        x2="15.42"
        y2="17.49"
        stroke={color}
        strokeWidth="2"
      />
      <Line
        x1="15.41"
        y1="6.51"
        x2="8.59"
        y2="10.49"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}
