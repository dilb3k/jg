import Svg, { Path } from 'react-native-svg'

export function HomeIcon({ color = '#888', size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10L12 3L21 10V21H3V10Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  )
}
