import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TrendMiniChart({ title, items = [], color = '#2563eb', emptyText = 'No trend data recorded yet.' }) {
  const values = Array.isArray(items) ? items : [];
  const max = Math.max(1, ...values.map((item) => Number(item?.value || 0)));
  const min = Math.min(0, ...values.map((item) => Number(item?.value || 0)));
  const range = Math.max(1, max - min);
  const chartHeight = 110;
  const usableWidth = Math.max(values.length - 1, 1);
  const points = values.map((item, index) => {
    const numericValue = Number(item?.value || 0);
    const xPercent = values.length === 1 ? 50 : (index / usableWidth) * 100;
    const yPercent = 100 - (((numericValue - min) / range) * 100);
    return {
      key: `${item.label}-${index}`,
      label: item.label,
      value: item.value,
      xPercent,
      yPercent,
      xPx: values.length === 1 ? 0 : (index / usableWidth) * 100,
      yPx: chartHeight - (((numericValue - min) / range) * chartHeight),
    };
  });
  const lineSegments = points.slice(1).map((point, index) => {
    const previousPoint = points[index];
    const dx = point.xPx - previousPoint.xPx;
    const dy = point.yPx - previousPoint.yPx;
    const stepCount = Math.max(Math.round(Math.sqrt((dx * dx) + (dy * dy)) / 4), 1);
    return {
      key: `${previousPoint.key}-${point.key}`,
      dots: Array.from({ length: stepCount + 1 }, (_, dotIndex) => {
        const progress = dotIndex / stepCount;
        return {
          key: `${previousPoint.key}-${point.key}-${dotIndex}`,
          xPercent: previousPoint.xPx + (dx * progress),
          yPx: previousPoint.yPx + (dy * progress),
        };
      }),
    };
  });
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {values.length ? (
        <>
          <View style={styles.chartWrap}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, styles.gridLineMiddle]} />
            <View style={[styles.gridLine, styles.gridLineBottom]} />
            {lineSegments.flatMap((segment) => segment.dots).map((dot) => (
              <View
                key={dot.key}
                style={[
                  styles.lineDot,
                  {
                    backgroundColor: color,
                    left: `${dot.xPercent}%`,
                    top: dot.yPx,
                  },
                ]}
              />
            ))}
            {points.map((point) => (
              <View
                key={point.key}
                style={[
                  styles.point,
                  {
                    backgroundColor: color,
                    left: `${point.xPercent}%`,
                    top: point.yPx,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.row}>
            {points.map((point) => (
              <View key={point.key} style={styles.pointMeta}>
                <Text style={styles.label}>{point.label}</Text>
                <Text style={styles.value}>{point.value}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.empty}>{emptyText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', padding: 14 },
  title: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  chartWrap: { height: 110, position: 'relative', justifyContent: 'center' },
  gridLine: { position: 'absolute', left: 0, right: 0, top: 0, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  gridLineMiddle: { top: '50%' },
  gridLineBottom: { top: undefined, bottom: 0 },
  lineDot: { position: 'absolute', width: 4, height: 4, borderRadius: 999, marginLeft: -2, marginTop: -2 },
  point: { position: 'absolute', width: 10, height: 10, borderRadius: 999, marginLeft: -5, marginTop: -5, borderWidth: 2, borderColor: '#ffffff' },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 10 },
  pointMeta: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  label: { marginTop: 8, fontSize: 11, color: '#475569', fontWeight: '700' },
  value: { marginTop: 4, fontSize: 11, color: '#64748b' },
  empty: { color: '#64748b', lineHeight: 20 },
});