import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function formatTrendValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value || '0');
  if (Math.abs(numericValue) >= 10 || Number.isInteger(numericValue)) return String(Math.round(numericValue));
  return numericValue.toFixed(1);
}

export default function TrendMiniChart({ title, items = [], color = '#2563eb', emptyText = 'No trend data recorded yet.' }) {
  const [chartWidth, setChartWidth] = React.useState(0);
  const values = Array.isArray(items) ? items : [];
  const numericValues = values.map((item) => Number(item?.value || 0)).filter((value) => Number.isFinite(value));
  const max = Math.max(1, ...numericValues);
  const min = Math.min(0, ...numericValues);
  const range = Math.max(1, max - min);
  const chartHeight = 168;
  const topPadding = 22;
  const bottomPadding = 34;
  const leftPadding = 14;
  const rightPadding = 14;
  const plotHeight = chartHeight - topPadding - bottomPadding;
  const effectiveChartWidth = Math.max(chartWidth, 220);
  const plotWidth = Math.max(effectiveChartWidth - leftPadding - rightPadding, 1);
  const usableWidth = Math.max(values.length - 1, 1);
  const valueSlotWidth = Math.max(28, Math.min(60, (plotWidth / Math.max(values.length, 1)) + 8));
  const yAxisTicks = [max, min + (range / 2), min];
  const points = values.map((item, index) => {
    const numericValue = Number(item?.value || 0);
    const x = leftPadding + (values.length === 1 ? plotWidth / 2 : (index / usableWidth) * plotWidth);
    const y = topPadding + (1 - ((numericValue - min) / range)) * plotHeight;
    return {
      key: `${item.label}-${index}`,
      label: item.label,
      value: formatTrendValue(item.value),
      x,
      y,
    };
  });
  const lineSegments = points.slice(0, -1).map((point, index) => {
    const nextPoint = points[index + 1];
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    return {
      key: `${point.key}-${nextPoint.key}`,
      left: point.x + (dx / 2) - (Math.sqrt((dx * dx) + (dy * dy)) / 2),
      top: point.y + (dy / 2) - 1.5,
      width: Math.sqrt((dx * dx) + (dy * dy)),
      rotate: `${Math.atan2(dy, dx)}rad`,
    };
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {values.length ? (
        <View style={styles.chartWrap} onLayout={(event) => setChartWidth(Math.max(0, event?.nativeEvent?.layout?.width || 0))}>
          <View style={[styles.chartSurface, { height: chartHeight, width: effectiveChartWidth }]}> 
            {yAxisTicks.map((tick, index) => {
              const top = topPadding + (plotHeight / Math.max(yAxisTicks.length - 1, 1)) * index;
              return (
                <React.Fragment key={`tick-${tick}-${index}`}>
                  <View style={[styles.gridLine, { top, left: leftPadding, right: rightPadding }]} />
                  <Text style={[styles.tickLabel, { top: top - 8 }]}>{formatTrendValue(tick)}</Text>
                </React.Fragment>
              );
            })}
            {lineSegments.map((segment) => (
              <View
                key={segment.key}
                style={[
                  styles.segment,
                  {
                    backgroundColor: color,
                    left: segment.left,
                    top: segment.top,
                    width: segment.width,
                    transform: [{ rotate: segment.rotate }],
                  },
                ]}
              />
            ))}
            {points.map((point) => (
              <View key={point.key} style={[styles.pointColumn, { left: point.x - (valueSlotWidth / 2), width: valueSlotWidth, height: chartHeight }]}> 
                <View style={[styles.valueChip, { top: Math.max(0, point.y - 24) }]}> 
                  <Text style={styles.valueChipText}>{point.value}</Text>
                </View>
                <View style={[styles.point, { borderColor: color, top: point.y - 6 }]}> 
                  <View style={[styles.pointInner, { backgroundColor: color }]} />
                </View>
                <Text numberOfLines={1} style={styles.label}>{point.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text style={styles.empty}>{emptyText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', padding: 14 },
  title: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  chartWrap: { overflow: 'hidden', width: '100%' },
  chartSurface: { position: 'relative' },
  gridLine: { position: 'absolute', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  tickLabel: { position: 'absolute', left: 0, width: 28, fontSize: 10, fontWeight: '700', color: '#94a3b8', textAlign: 'left' },
  segment: { position: 'absolute', height: 3, borderRadius: 999 },
  pointColumn: { position: 'absolute', top: 0, alignItems: 'center' },
  valueChip: { position: 'absolute', minWidth: 30, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  valueChipText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  point: { position: 'absolute', width: 12, height: 12, borderRadius: 999, borderWidth: 2, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  pointInner: { width: 4, height: 4, borderRadius: 999 },
  label: { marginTop: 'auto', fontSize: 10, color: '#475569', fontWeight: '700', textAlign: 'center' },
  empty: { color: '#64748b', lineHeight: 20 },
});