import Svg, { Path, Text as SvgText } from "react-native-svg";

interface IconProps {
  color?: string;
  size?: number;
}

export function SkipBackIcon({ color = "#fff", size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 3v5h5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgText
        x="12.5"
        y="15.5"
        textAnchor="middle"
        fill={color}
        fontSize="6"
        fontWeight="bold"
      >
        10
      </SvgText>
    </Svg>
  );
}
