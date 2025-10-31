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
import { useAggregateStats, useAnimationMetadata } from '../hooks/useAnalytics';
import { StatCard } from '../components/StatCard';
import { FilterSection } from '../components/FilterSection';
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
        <Text style={styles.headerTitle}>React Native Demos Analytics</Text>
        <Text style={styles.headerSubtitle}>
          Last updated: {new Date(stats.generated_at).toLocaleString()}
        </Text>
      </View>

      {/* Stats Overview */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsRow}
        contentContainerStyle={styles.statsContent}
      >
        <StatCard
          title="Total Animations"
          value={stats.total_animations}
          subtitle="Analyzed demos"
        />
        <StatCard
          title="Unique Packages"
          value={Object.keys(stats.packages).length}
          subtitle="Dependencies used"
        />
        <StatCard
          title="Unique Hooks"
          value={Object.keys(stats.hooks).length}
          subtitle="React hooks"
        />
        <StatCard
          title="Patterns"
          value={Object.keys(stats.patterns).length}
          subtitle="Animation patterns"
        />
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search animations..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.sectionTitle}>Filter by</Text>
          {totalActiveFilters > 0 && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>
                Clear all ({totalActiveFilters})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <FilterSection
          title="Packages"
          items={stats.packages}
          selectedItems={selectedPackages}
          onToggle={(item) => toggleFilter(selectedPackages, item, setSelectedPackages)}
          limit={20}
        />

        <FilterSection
          title="Hooks"
          items={stats.hooks}
          selectedItems={selectedHooks}
          onToggle={(item) => toggleFilter(selectedHooks, item, setSelectedHooks)}
          limit={20}
        />
      </View>

      {/* Insights from filtered animations */}
      <View style={styles.insightsSection}>
        <Text style={styles.insightsHeader}>
          📊 Insights from {filteredAnimations.length} animation{filteredAnimations.length !== 1 ? 's' : ''}
        </Text>
        {totalActiveFilters > 0 && (
          <Text style={styles.filterContext}>
            Filtered by: {[...selectedPackages, ...selectedHooks].join(', ')}
          </Text>
        )}

        <ProgressBarChart
          title="🎨 Most Used Patterns"
          items={insights.patterns}
          total={filteredAnimations.length}
          color="#00D9FF"
        />

        <ProgressBarChart
          title="⚡ Animation Techniques"
          items={insights.techniques}
          total={filteredAnimations.length}
          color="#FFD60A"
        />

        <ProgressBarChart
          title="🎣 Most Used Hooks"
          subtitle={selectedHooks.length > 0 ? '(filtered)' : undefined}
          items={insights.hooks}
          total={filteredAnimations.length}
          color="#FF375F"
        />

        <ProgressBarChart
          title="📦 Most Used Packages"
          subtitle={selectedPackages.length > 0 ? '(filtered)' : undefined}
          items={insights.packages}
          total={filteredAnimations.length}
          color="#34C759"
        />

        <ProgressBarChart
          title="🧩 Components Used"
          items={insights.components}
          total={filteredAnimations.length}
          color="#AF52DE"
        />

        <ProgressBarChart
          title="🔧 Animation Functions"
          items={insights.functions}
          total={filteredAnimations.length}
          color="#FF9500"
        />
      </View>

      {/* Animation List */}
      <View style={styles.animationsSection}>
        <Text style={styles.sectionTitle}>
          Animations ({filteredAnimations.length})
        </Text>
        {filteredAnimations.map((animation) => (
          <AnimationCard key={animation.slug} animation={animation} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
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
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    marginBottom: 32,
  },
  statsContent: {
    gap: 16,
    paddingRight: 16,
  },
  searchContainer: {
    marginBottom: 32,
  },
  searchInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  filtersSection: {
    marginBottom: 32,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  insightsSection: {
    marginBottom: 32,
    backgroundColor: '#0d0d0d',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  insightsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  filterContext: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  animationsSection: {
    marginBottom: 32,
  },
});
