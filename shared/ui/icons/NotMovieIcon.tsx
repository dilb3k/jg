import Svg, { Path, Rect } from "react-native-svg";

interface IconProps {
  color?: string;
  size?: number;
}

export function NotMovieIcon({ color = "#888", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="1"
      />
      <Path
        d="M10 9L15 12L10 15V9Z"
        stroke={color}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <Path
        d="M4 4L20 20"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </Svg>
  );
}
