import React from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import { getDebugContext, getRecentLogs, logger } from '../utils/logger';

function levelColor(level) {
  if (level === 'error') return '#ef4444';
  if (level === 'warn') return '#6b7280';
  if (level === 'info') return '#2563eb';
  return '#6b7280';
}

function tagColor(tag) {
  const t = String(tag || '').toLowerCase();
  // Reuse colors already present throughout the app.
  // UI interactions: dark
  // API/network: blue
  // App/auth lifecycle: gray
  // Error surfaces: red
  if (t === 'press' || t === 'ui' || t === 'nav') return '#111827';
  if (t === 'api') return '#2563eb';
  if (t === 'app' || t === 'auth') return '#6b7280';
  if (t === 'boundary' || t === 'global' || t === 'promise') return '#ef4444';
  return '#6b7280';
}

function formatLine(entry) {
  const t = entry?.t ? entry.t : '';
  const lvl = entry?.level ? String(entry.level).toUpperCase() : 'LOG';
  const tag = entry?.tag ? entry.tag : 'app';
  const msg = entry?.message ? entry.message : '';
  return `${t} ${lvl} ${tag} — ${msg}`;
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  componentDidCatch(error, info) {
    // Save to state so we can render a friendly error screen
    this.setState({ error, info });
    // Also log to console so it appears in device logs
    logger.error('boundary', 'Unhandled error caught by ErrorBoundary', {
      message: error?.message || String(error),
      stack: error?.stack,
      componentStack: info?.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      const { error, info } = this.state;
      const ctx = getDebugContext();
      const logs = getRecentLogs(60);
      return (
        <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Something went wrong</Text>
            <Text style={{ marginBottom: 8, color: '#333' }}>{error && error.toString()}</Text>
            <Text style={{ color: '#666', marginBottom: 12 }}>{info && info.componentStack}</Text>
            <Text style={{ color: '#999', marginBottom: 8 }}>Check device logs or paste this output to debug.</Text>

            {typeof __DEV__ !== 'undefined' && __DEV__ ? (
              <View style={{ marginTop: 16, width: '100%' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Debug context</Text>
                <Text style={{ color: '#444', marginBottom: 12 }}>{JSON.stringify(ctx, null, 2)}</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Recent logs</Text>
                {(logs || []).map((entry, idx) => (
                  <Text key={idx} style={{ color: '#111827', marginBottom: 8 }}>
                    <Text style={{ color: '#6b7280' }}>{entry?.t ? `${entry.t} ` : ''}</Text>
                    <Text style={{ color: levelColor(entry?.level), fontWeight: '700' }}>
                      {entry?.level ? String(entry.level).toUpperCase() : 'LOG'}
                    </Text>
                    <Text style={{ color: '#6b7280' }}> </Text>
                    <Text style={{ color: tagColor(entry?.tag), fontWeight: '700' }}>
                      {entry?.tag ? String(entry.tag) : 'app'}
                    </Text>
                    <Text style={{ color: '#6b7280' }}> — </Text>
                    <Text>{entry?.message ? String(entry.message) : ''}</Text>
                    {entry?.data != null ? (
                      <Text style={{ color: '#6b7280' }}>{`\n${JSON.stringify(entry.data, null, 2)}`}</Text>
                    ) : null}
                  </Text>
                ))}
              </View>
            ) : null}

            <Button title="Reload app" onPress={() => { try { global.location.reload(); } catch (e) { /* ignore */ } }} />
          </View>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
