import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { TideMinute, TidePrediction } from '../types';
import { parseNoaaTime } from '../services/noaa';

interface TideChartProps {
  minuteData: TideMinute[];
  predictions: TidePrediction[];
  date: string;
}

const CHART_HEIGHT = 180;
const PADDING = { top: 16, bottom: 32, left: 40, right: 16 };

export function TideChart({ minuteData, predictions, date }: TideChartProps) {
  const width = Dimensions.get('window').width - 32; // 16px margin each side

  const chartData = useMemo(() => {
    if (minuteData.length === 0) return null;

    const heights = minuteData.map((d) => d.height);
    const minH = Math.min(...heights);
    const maxH = Math.max(...heights);
    const rangeH = maxH - minH || 1;

    const chartW = width - PADDING.left - PADDING.right;
    const chartH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    const points = minuteData.map((d, i) => {
      const x = PADDING.left + (i / (minuteData.length - 1)) * chartW;
      const y = PADDING.top + (1 - (d.height - minH) / rangeH) * chartH;
      return { x, y, height: d.height, time: d.time };
    });

    // Build SVG path
    const pathD = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      // Smooth curve using cubic bezier
      const prev = points[i - 1];
      const cpX = (prev.x + p.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
    }, '');

    // Fill path (close to bottom)
    const lastX = points[points.length - 1].x;
    const bottomY = PADDING.top + chartH;
    const fillD = `${pathD} L ${lastX} ${bottomY} L ${PADDING.left} ${bottomY} Z`;

    // Y-axis grid lines (3 levels)
    const yLines = [0, 0.33, 0.67, 1].map((f) => ({
      y: PADDING.top + (1 - f) * chartH,
      label: (minH + f * rangeH).toFixed(1),
    }));

    // X-axis time labels (every 6 hours)
    const totalPoints = minuteData.length;
    const xLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const idx = Math.min(Math.floor(f * (totalPoints - 1)), totalPoints - 1);
      const timeStr = minuteData[idx].time;
      const hour = timeStr.split(' ')[1]?.split(':')[0] ?? '00';
      const x = PADDING.left + f * chartW;
      return { x, label: `${parseInt(hour)}h` };
    });

    // Hi/Lo marker positions
    const hiLoMarkers = predictions.map((p) => {
      const timeDate = parseNoaaTime(p.time);
      const dayStart = new Date(date + 'T00:00:00');
      const dayMs = 24 * 60 * 60 * 1000;
      const fraction = (timeDate.getTime() - dayStart.getTime()) / dayMs;
      const x = PADDING.left + Math.max(0, Math.min(1, fraction)) * chartW;
      const y = PADDING.top + (1 - (p.height - minH) / rangeH) * chartH;
      return { x, y, type: p.type, time: p.time.split(' ')[1] ?? '', height: p.height };
    });

    return { pathD, fillD, yLines, xLabels, hiLoMarkers, minH, maxH };
  }, [minuteData, predictions, width, date]);

  if (!chartData || minuteData.length === 0) {
    return (
      <View className="bg-ocean-800 rounded-xl p-4 items-center justify-center" style={{ height: CHART_HEIGHT }}>
        <Text className="text-ocean-300 text-sm">No tide data available</Text>
      </View>
    );
  }

  return (
    <View className="bg-ocean-800 rounded-xl overflow-hidden">
      <Svg width={width} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#3a7fbe" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#3a7fbe" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {chartData.yLines.map((l, i) => (
          <React.Fragment key={i}>
            <Line
              x1={PADDING.left}
              y1={l.y}
              x2={width - PADDING.right}
              y2={l.y}
              stroke="#1a3558"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <SvgText
              x={PADDING.left - 4}
              y={l.y + 4}
              fill="#5ba3e0"
              fontSize="9"
              textAnchor="end"
            >
              {l.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Fill */}
        <Path d={chartData.fillD} fill="url(#tideGradient)" />

        {/* Tide curve */}
        <Path
          d={chartData.pathD}
          fill="none"
          stroke="#3a7fbe"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Hi/Lo markers */}
        {chartData.hiLoMarkers.map((m, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={m.x}
              cy={m.y}
              r={5}
              fill={m.type === 'H' ? '#3a7fbe' : '#d97706'}
              stroke="#0c1a2e"
              strokeWidth="1.5"
            />
            <SvgText
              x={m.x}
              y={m.y - 10}
              fill={m.type === 'H' ? '#8cc4f0' : '#fbbf24'}
              fontSize="9"
              textAnchor="middle"
              fontWeight="bold"
            >
              {m.type === 'H' ? 'H' : 'L'} {m.height.toFixed(1)}ft
            </SvgText>
            <SvgText
              x={m.x}
              y={m.y - 1}
              fill="#c2e2f9"
              fontSize="8"
              textAnchor="middle"
            >
              {m.time}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X-axis labels */}
        {chartData.xLabels.map((l, i) => (
          <SvgText
            key={i}
            x={l.x}
            y={CHART_HEIGHT - 4}
            fill="#5ba3e0"
            fontSize="9"
            textAnchor="middle"
          >
            {l.label}
          </SvgText>
        ))}

        {/* Y-axis label */}
        <SvgText
          x={8}
          y={CHART_HEIGHT / 2}
          fill="#5ba3e0"
          fontSize="9"
          textAnchor="middle"
          rotation="-90"
          originX={8}
          originY={CHART_HEIGHT / 2}
        >
          ft MLLW
        </SvgText>
      </Svg>
    </View>
  );
}
