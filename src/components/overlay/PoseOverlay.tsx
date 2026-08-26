import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

type PoseTemplateId = 'pose_1' | 'pose_2' | 'pose_3';

export function PoseOverlay({
  templateId,
  opacity = 0.55
}: {
  templateId: PoseTemplateId;
  opacity?: number;
}) {
  const points = getTemplatePoints(templateId);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {renderSkeleton(points, opacity)}
      </Svg>
    </View>
  );
}

function renderSkeleton(points: Record<string, { x: number; y: number }>, opacity: number) {
  const stroke = `rgba(0, 92, 255, ${opacity})`;
  const strokeSoft = `rgba(0, 92, 255, ${opacity * 0.55})`;
  const strokeWidth = 2.6;

  const link = (a: string, b: string, soft = false) => (
    <Line
      key={`${a}-${b}`}
      x1={points[a].x}
      y1={points[a].y}
      x2={points[b].x}
      y2={points[b].y}
      stroke={soft ? strokeSoft : stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  );

  const node = (name: string, r = 2.2) => (
    <Circle key={name} cx={points[name].x} cy={points[name].y} r={r} fill={stroke} />
  );

  return (
    <>
      {link('head', 'neck')}
      {link('neck', 'hip')}
      {link('neck', 'l_shoulder')}
      {link('l_shoulder', 'l_elbow')}
      {link('l_elbow', 'l_wrist')}
      {link('neck', 'r_shoulder')}
      {link('r_shoulder', 'r_elbow')}
      {link('r_elbow', 'r_wrist')}
      {link('hip', 'l_knee')}
      {link('l_knee', 'l_ankle')}
      {link('hip', 'r_knee')}
      {link('r_knee', 'r_ankle')}

      {link('l_shoulder', 'r_shoulder', true)}
      {link('l_hip', 'r_hip', true)}
      {link('hip', 'l_hip', true)}
      {link('hip', 'r_hip', true)}

      {Object.keys(points).map(key => node(key, key === 'head' ? 3.1 : 2.0))}
    </>
  );
}

function getTemplatePoints(templateId: PoseTemplateId) {
  // Normalized 0..100 coordinate space so it scales with image container.
  // These are intentionally simple "pose silhouettes" as a stand-in for SnapEdit-style overlays.
  if (templateId === 'pose_2') {
    return {
      head: { x: 52, y: 18 },
      neck: { x: 52, y: 28 },
      hip: { x: 54, y: 54 },
      l_shoulder: { x: 41, y: 30 },
      l_elbow: { x: 36, y: 42 },
      l_wrist: { x: 30, y: 52 },
      r_shoulder: { x: 63, y: 30 },
      r_elbow: { x: 70, y: 40 },
      r_wrist: { x: 74, y: 50 },
      l_hip: { x: 48, y: 56 },
      r_hip: { x: 60, y: 56 },
      l_knee: { x: 46, y: 74 },
      l_ankle: { x: 42, y: 92 },
      r_knee: { x: 62, y: 72 },
      r_ankle: { x: 70, y: 90 }
    };
  }

  if (templateId === 'pose_3') {
    return {
      head: { x: 50, y: 18 },
      neck: { x: 50, y: 28 },
      hip: { x: 50, y: 55 },
      l_shoulder: { x: 38, y: 32 },
      l_elbow: { x: 30, y: 28 },
      l_wrist: { x: 22, y: 24 },
      r_shoulder: { x: 62, y: 30 },
      r_elbow: { x: 70, y: 22 },
      r_wrist: { x: 78, y: 18 },
      l_hip: { x: 44, y: 56 },
      r_hip: { x: 56, y: 56 },
      l_knee: { x: 38, y: 72 },
      l_ankle: { x: 34, y: 92 },
      r_knee: { x: 58, y: 72 },
      r_ankle: { x: 56, y: 92 }
    };
  }

  return {
    head: { x: 50, y: 18 },
    neck: { x: 50, y: 28 },
    hip: { x: 50, y: 56 },
    l_shoulder: { x: 40, y: 32 },
    l_elbow: { x: 35, y: 44 },
    l_wrist: { x: 34, y: 58 },
    r_shoulder: { x: 60, y: 32 },
    r_elbow: { x: 66, y: 44 },
    r_wrist: { x: 68, y: 58 },
    l_hip: { x: 45, y: 58 },
    r_hip: { x: 55, y: 58 },
    l_knee: { x: 44, y: 76 },
    l_ankle: { x: 42, y: 92 },
    r_knee: { x: 56, y: 76 },
    r_ankle: { x: 58, y: 92 }
  };
}

