import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

interface IconProps {
  size?: number;
  color: string;
}

/** Outline camera — avoids @expo/vector-icons / expo-font native modules (Expo Go safe). */
export function CameraOutlineIcon({ size = 26, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Outline download arrow — same rationale as {@link CameraOutlineIcon}. */
export function DownloadOutlineIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="7 10 12 15 17 10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={12} y1={15} x2={12} y2={3} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="15 18 9 12 15 6"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShareOutlineIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={18} cy={5} r={3} fill="none" stroke={color} strokeWidth={2} />
      <Circle cx={6} cy={12} r={3} fill="none" stroke={color} strokeWidth={2} />
      <Circle cx={18} cy={19} r={3} fill="none" stroke={color} strokeWidth={2} />
      <Line x1="8.6" y1="10.6" x2="15.4" y2="7.4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="8.6" y1="13.4" x2="15.4" y2="16.6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function MoreHorizontalIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5} cy={12} r={1.75} fill={color} />
      <Circle cx={12} cy={12} r={1.75} fill={color} />
      <Circle cx={19} cy={12} r={1.75} fill={color} />
    </Svg>
  );
}

export function XIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={18} y1={6} x2={6} y2={18} stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={6} y1={6} x2={18} y2={18} stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SparklesIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M20 3v4M22 5h-4M4 17v2M5 18H3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function SlidersIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" x2="20" y1="21" y2="21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="4" x2="20" y1="14" y2="14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="4" x2="20" y1="7" y2="7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Polyline points="9 11 9 14 9 17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Polyline points="15 4 15 7 15 10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function DocumentIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CircleIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
