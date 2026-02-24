import Svg, { Path } from "react-native-svg";

interface IconProps {
  color?: string;
  size?: number;
  filled?: boolean;
}

export function ForwardIcon({ color = "#000", size = 24, filled = true }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5L16 12L9 19"
        stroke={color}
        strokeWidth={filled ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
