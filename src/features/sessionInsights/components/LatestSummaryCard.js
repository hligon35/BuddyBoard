import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import SessionSummarySnapshot from '../../../components/SessionSummarySnapshot';

export default function LatestSummaryCard({ summary, subtitle = '', onOpenInsights, onOpenArtifact, artifactDisabled = false, metricsTwoByTwo = false }) {
  return (
    <View style={styles.wrap}>
      {onOpenArtifact ? (
        <TouchableOpacity
          accessibilityLabel="Open SessionSummary.txt"
          style={[styles.artifactIconButton, artifactDisabled ? styles.artifactIconButtonDisabled : null]}
          onPress={onOpenArtifact}
          disabled={artifactDisabled}
        >
          <MaterialIcons name="description" size={18} color={artifactDisabled ? '#94a3b8' : '#1d4ed8'} />
        </TouchableOpacity>
      ) : null}
      <SessionSummarySnapshot summary={summary} subtitle={subtitle} title="Latest Session Summary" emptyText="No approved session summary has been recorded yet." metricsTwoByTwo={metricsTwoByTwo} />
      {onOpenInsights ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={onOpenInsights}>
            <Text style={styles.primaryActionText}>View full insights</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, position: 'relative' },
  artifactIconButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artifactIconButtonDisabled: {
    backgroundColor: '#e5e7eb',
    borderColor: '#d1d5db',
  },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  primaryAction: { borderRadius: 12, backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 14, marginRight: 10, marginBottom: 10 },
  primaryActionText: { color: '#ffffff', fontWeight: '800' },
});