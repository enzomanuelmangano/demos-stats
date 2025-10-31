import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import type { AnimationSummary } from '../types/metadata';

interface AnimationCardProps {
  animation: AnimationSummary;
  onPress?: () => void;
}

export function AnimationCard({ animation, onPress }: AnimationCardProps) {
  const handleOpenGitHub = () => {
    const url = `https://github.com/enzomanuelmangano/demos/tree/main/src/animations/${animation.slug}`;
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{animation.slug}</Text>
        <TouchableOpacity onPress={handleOpenGitHub} style={styles.linkButton}>
          <Text style={styles.linkText}>View on GitHub →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{animation.total_files}</Text>
          <Text style={styles.statLabel}>Files</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{animation.total_packages}</Text>
          <Text style={styles.statLabel}>Packages</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{animation.total_hooks}</Text>
          <Text style={styles.statLabel}>Hooks</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{animation.total_patterns}</Text>
          <Text style={styles.statLabel}>Patterns</Text>
        </View>
      </View>
      <Text style={styles.date}>
        Updated: {new Date(animation.extracted_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  linkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});
