import React from 'react';
import { View, Text, ScrollView, Button } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  componentDidCatch(error, info) {
    // Save to state so we can render a friendly error screen
    this.setState({ error, info });
    // Also log to console so it appears in device logs
    console.error('Unhandled error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      const { error, info } = this.state;
      return (
        <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Something went wrong</Text>
            <Text style={{ marginBottom: 8, color: '#333' }}>{error && error.toString()}</Text>
            <Text style={{ color: '#666', marginBottom: 12 }}>{info && info.componentStack}</Text>
            <Text style={{ color: '#999', marginBottom: 8 }}>Check device logs or paste this output to debug.</Text>
            <Button title="Reload app" onPress={() => { try { global.location.reload(); } catch (e) { /* ignore */ } }} />
          </View>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
