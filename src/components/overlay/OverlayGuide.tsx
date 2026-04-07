import Svg, { Defs, Line, Marker, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors } from '../../constants/theme';
import { OverlayData } from '../../models/analysis';

interface Props {
  width: number;
  height: number;
  overlayData?: OverlayData;
}

export function OverlayGuide({ width, height, overlayData }: Props) {
  if (!overlayData || width <= 0 || height <= 0) return null;

  const crop = overlayData.cropRect;

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <Marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <Path d="M0,0 L8,4 L0,8 Z" fill={colors.cyan} />
        </Marker>
      </Defs>

      {overlayData.grid && (
        <>
          <Line x1={width / 3} y1={0} x2={width / 3} y2={height} stroke="white" strokeOpacity={0.55} strokeWidth={1} />
          <Line x1={(width * 2) / 3} y1={0} x2={(width * 2) / 3} y2={height} stroke="white" strokeOpacity={0.55} strokeWidth={1} />
          <Line x1={0} y1={height / 3} x2={width} y2={height / 3} stroke="white" strokeOpacity={0.55} strokeWidth={1} />
          <Line x1={0} y1={(height * 2) / 3} x2={width} y2={(height * 2) / 3} stroke="white" strokeOpacity={0.55} strokeWidth={1} />
        </>
      )}

      {crop && (
        <Rect
          x={crop.x * width}
          y={crop.y * height}
          width={crop.w * width}
          height={crop.h * height}
          stroke={colors.warning}
          strokeWidth={3}
          fill="transparent"
        />
      )}

      {overlayData.arrows?.map((arrow, index) => (
        <Line
          key={`arrow-${index}`}
          x1={arrow.from[0] * width}
          y1={arrow.from[1] * height}
          x2={arrow.to[0] * width}
          y2={arrow.to[1] * height}
          stroke={colors.cyan}
          strokeWidth={4}
          markerEnd="url(#arrowhead)"
        />
      ))}

      {overlayData.notes?.map((note, index) => (
        <SvgText
          key={`note-${index}`}
          x={note.x * width}
          y={note.y * height}
          fill={colors.white}
          fontSize="14"
          fontWeight="700"
          stroke="#000000"
          strokeWidth={0.25}
        >
          {note.text}
        </SvgText>
      ))}
    </Svg>
  );
}
