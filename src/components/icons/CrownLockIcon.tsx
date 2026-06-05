import Svg, { Path } from 'react-native-svg';

export function CrownLockIcon({ size = 32, color = '#FACC15' }: { size?: number; color?: string }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M4 18h16"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
      <Path
        d="M5 8l4 4 3-6 3 6 4-4-1.5 10h-11L5 8z"
        fill={color}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}
