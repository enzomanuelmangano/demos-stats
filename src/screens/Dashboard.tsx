import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAggregateStats } from '../hooks/useAnalytics';
import { ProgressBarChart } from '../components/ProgressBarChart';
import { AnimationCard } from '../components/AnimationCard';

export function Dashboard() {
  const { stats, loading, error } = useAggregateStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedHooks, setSelectedHooks] = useState<string[]>([]);

  const filteredAnimations = useMemo(() => {
    if (!stats) return [];

    let filtered = stats.animations;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((anim) =>
        anim.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Package filter - animation must have ALL selected packages
    if (selectedPackages.length > 0) {
      filtered = filtered.filter((anim) =>
        selectedPackages.every((pkg) => anim.packages.includes(pkg))
      );
    }

    // Hook filter - animation must have ALL selected hooks
    if (selectedHooks.length > 0) {
      filtered = filtered.filter((anim) =>
        selectedHooks.every((hook) => anim.hooks.includes(hook))
      );
    }

    return filtered;
  }, [stats, searchQuery, selectedPackages, selectedHooks]);

  // Calculate insights from filtered animations
  const insights = useMemo(() => {
    const patterns: Record<string, number> = {};
    const techniques: Record<string, number> = {};
    const components: Record<string, number> = {};
    const hooks: Record<string, number> = {};
    const packages: Record<string, number> = {};
    const functions: Record<string, number> = {};

    filteredAnimations.forEach((anim) => {
      // Count patterns
      anim.patterns.forEach((pattern) => {
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      });

      // Count techniques
      anim.techniques.forEach((technique) => {
        techniques[technique] = (techniques[technique] || 0) + 1;
      });

      // Count components
      anim.components.forEach((component) => {
        components[component] = (components[component] || 0) + 1;
      });

      // Count hooks (for insight, not filtering)
      anim.hooks.forEach((hook) => {
        hooks[hook] = (hooks[hook] || 0) + 1;
      });

      // Count packages (for insight)
      anim.packages.forEach((pkg) => {
        packages[pkg] = (packages[pkg] || 0) + 1;
      });

      // Count functions
      anim.functions.forEach((fn) => {
        functions[fn] = (functions[fn] || 0) + 1;
      });
    });

    return { patterns, techniques, components, hooks, packages, functions };
  }, [filteredAnimations]);

  const toggleFilter = (list: string[], item: string, setter: (items: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const clearAllFilters = () => {
    setSelectedPackages([]);
    setSelectedHooks([]);
    setSearchQuery('');
  };

  const totalActiveFilters = selectedPackages.length + selectedHooks.length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Failed to load analytics data'}
        </Text>
        <Text style={styles.errorHint}>
          Run `npm run extract` to generate analytics data
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Demos Analytics</Text>
        <View style={styles.statsOverview}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{filteredAnimations.length}</Text>
            <Text style={styles.statLabel}>animations</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{Object.keys(insights.patterns).length}</Text>
            <Text style={styles.statLabel}>patterns</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{Object.keys(insights.components).length}</Text>
            <Text style={styles.statLabel}>components</Text>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.controlsSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search animations..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {totalActiveFilters > 0 && (
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>✕ Clear filters</Text>
          </TouchableOpacity>
        )}

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Packages</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {Object.entries(stats.packages)
              .slice(0, 12)
              .map(([pkg, count]) => {
                const isSelected = selectedPackages.includes(pkg);
                return (
                  <TouchableOpacity
                    key={pkg}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleFilter(selectedPackages, pkg, setSelectedPackages)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {pkg}
                    </Text>
                    <Text style={[styles.chipCount, isSelected && styles.chipCountSelected]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Hooks</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {Object.entries(stats.hooks)
              .slice(0, 12)
              .map(([hook, count]) => {
                const isSelected = selectedHooks.includes(hook);
                return (
                  <TouchableOpacity
                    key={hook}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleFilter(selectedHooks, hook, setSelectedHooks)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {hook}
                    </Text>
                    <Text style={[styles.chipCount, isSelected && styles.chipCountSelected]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.insightsTitle}>Insights</Text>

        <View style={styles.insightsGrid}>
          <View style={styles.insightColumn}>
            <ProgressBarChart
              title="🎨 Patterns"
              items={insights.patterns}
              total={filteredAnimations.length}
              color="#00D9FF"
              limit={8}
            />

            <ProgressBarChart
              title="🧩 Components"
              items={insights.components}
              total={filteredAnimations.length}
              color="#AF52DE"
              limit={8}
            />
          </View>

          <View style={styles.insightColumn}>
            <ProgressBarChart
              title="⚡ Techniques"
              items={insights.techniques}
              total={filteredAnimations.length}
              color="#FFD60A"
              limit={8}
            />

            <ProgressBarChart
              title="🔧 Functions"
              items={insights.functions}
              total={filteredAnimations.length}
              color="#FF9500"
              limit={8}
            />
          </View>
        </View>
      </View>

      {/* Animation List */}
      <View style={styles.animationsSection}>
        <Text style={styles.sectionTitle}>
          {filteredAnimations.length} Animation{filteredAnimations.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.animationGrid}>
          {filteredAnimations.map((animation) => (
            <AnimationCard key={animation.slug} animation={animation} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: -1,
  },
  statsOverview: {
    flexDirection: 'row',
    gap: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  controlsSection: {
    marginBottom: 40,
  },
  searchInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },
  clearAllButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  clearAllText: {
    color: '#888',
    fontSize: 13,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChips: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    color: '#fff',
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  chipCount: {
    fontSize: 12,
    color: '#666',
  },
  chipCountSelected: {
    color: '#ccc',
  },
  insightsSection: {
    marginBottom: 40,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  insightColumn: {
    flex: 1,
  },
  animationsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  animationGrid: {
    gap: 12,
  },
});
