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
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  linkButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#007AFF',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 11,
    color: '#444',
    marginTop: 6,
  },
});
