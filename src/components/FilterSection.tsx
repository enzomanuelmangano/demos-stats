import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface FilterSectionProps {
  title: string;
  items: Record<string, number>;
  selectedItems: string[];
  onToggle: (item: string) => void;
  limit?: number;
}

export function FilterSection({
  title,
  items,
  selectedItems,
  onToggle,
  limit = 20,
}: FilterSectionProps) {
  const entries = Object.entries(items).slice(0, limit);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {entries.map(([item, count]) => {
          const isSelected = selectedItems.includes(item);
          return (
            <TouchableOpacity
              key={item}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(item)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {item}
              </Text>
              <Text style={[styles.chipCount, isSelected && styles.chipCountSelected]}>
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#fff',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  chipCount: {
    fontSize: 12,
    color: '#666',
  },
  chipCountSelected: {
    color: '#ccc',
  },
});
