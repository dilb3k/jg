import Svg, { Rect } from "react-native-svg";

interface IconProps {
  color?: string;
  size?: number;
}

export function PauseIcon({ color = "#fff", size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3" width="4" height="18" rx="1.5" fill={color} />
      <Rect x="15" y="3" width="4" height="18" rx="1.5" fill={color} />
    </Svg>
  );
}
