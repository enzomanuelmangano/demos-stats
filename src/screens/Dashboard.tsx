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

/**
 * Normalize component names by stripping common prefixes
 * - Touchable.Canvas -> Canvas
 * - Animated.View -> View
 * - Other.Namespaced.Component -> Component (last part)
 */
function normalizeComponentName(component: string): string {
  // Strip Touchable. prefix
  if (component.startsWith('Touchable.')) {
    return component.substring('Touchable.'.length);
  }
  // Strip Animated. prefix
  if (component.startsWith('Animated.')) {
    return component.substring('Animated.'.length);
  }
  // For other cases with dots, take the last part
  if (component.includes('.')) {
    const parts = component.split('.');
    return parts[parts.length - 1];
  }
  return component;
}

export function Dashboard() {
  const { stats, loading, error } = useAggregateStats();
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const filteredAnimations = useMemo(() => {
    if (!stats) return [];

    let filtered = stats.animations;

    // Package filter - animation must have ANY selected package (OR logic)
    if (selectedPackages.length > 0) {
      filtered = filtered.filter((anim) =>
        selectedPackages.some((pkg) => anim.packages.includes(pkg))
      );
    }

    return filtered;
  }, [stats, selectedPackages]);

  // Calculate insights from filtered animations
  const insights = useMemo(() => {
    if (!stats) {
      return { patterns: {}, techniques: {}, components: {}, hooks: {}, packages: {}, functions: {} };
    }

    // If exactly one package is selected, show package-specific data IF available
    const singlePackageFilter = selectedPackages.length === 1 ? selectedPackages[0] : null;

    // Check if this package has detailed tracking data
    const hasPackageDetail = singlePackageFilter &&
                             stats.components_by_package?.[singlePackageFilter] &&
                             Object.keys(stats.components_by_package[singlePackageFilter]).length > 0;

    if (hasPackageDetail && singlePackageFilter) {
      // Get the package-specific items from the global stats
      const packageComponents = stats.components_by_package[singlePackageFilter] || {};
      const packageHooks = stats.hooks_by_package[singlePackageFilter] || {};
      const packageFunctions = stats.functions_by_package[singlePackageFilter] || {};

      // Now count only these items in the filtered animations
      const components: Record<string, number> = {};
      const hooks: Record<string, number> = {};
      const functions: Record<string, number> = {};

      // Count occurrences in filtered animations only
      filteredAnimations.forEach((anim) => {
        // Use packages_detail from this specific animation to know which components are from which package
        const animPackageDetail = (anim as any).packages_detail?.[singlePackageFilter];

        if (animPackageDetail) {
          // Count components FROM this package in this specific animation
          const uniqueComponents = new Set<string>();
          if (animPackageDetail.components) {
            animPackageDetail.components.forEach((component: string) => {
              const baseComponent = normalizeComponentName(component);
              uniqueComponents.add(baseComponent);
            });
          }

          // Also check for Touchable.* and Animated.* wrapped versions in global components
          // For Skia specifically, check if global components has Touchable.Canvas, Touchable.Circle, etc.
          if (singlePackageFilter === '@shopify/react-native-skia') {
            const skiaComponents = ['Canvas', 'Circle', 'Group', 'Path', 'Rect', 'Image', 'Text', 'Blur'];
            anim.components.forEach((comp: string) => {
              if (comp.startsWith('Touchable.') || comp.startsWith('Animated.')) {
                const normalized = normalizeComponentName(comp);
                // Only add if it's a known Skia component and not already counted
                if (skiaComponents.includes(normalized) && !uniqueComponents.has(normalized)) {
                  uniqueComponents.add(normalized);
                }
              }
            });

            // Handle third-party packages built on Skia (e.g., react-native-qrcode-skia)
            if (anim.packages.includes('react-native-qrcode-skia')) {
              // react-native-qrcode-skia is built on Canvas and Path
              if (!uniqueComponents.has('Canvas')) {
                uniqueComponents.add('Canvas');
              }
              if (!uniqueComponents.has('Path')) {
                uniqueComponents.add('Path');
              }
            }
          }

          uniqueComponents.forEach((comp) => {
            components[comp] = (components[comp] || 0) + 1;
          });

          // Count hooks FROM this package in this specific animation
          if (animPackageDetail.hooks) {
            animPackageDetail.hooks.forEach((hook: string) => {
              hooks[hook] = (hooks[hook] || 0) + 1;
            });
          }

          // Count functions FROM this package in this specific animation
          if (animPackageDetail.functions) {
            animPackageDetail.functions.forEach((fn: string) => {
              functions[fn] = (functions[fn] || 0) + 1;
            });
          }
        }
      });

      // Still compute patterns and techniques normally (not package-specific)
      const patterns: Record<string, number> = {};
      const techniques: Record<string, number> = {};
      const packages: Record<string, number> = {};

      filteredAnimations.forEach((anim) => {
        anim.patterns.forEach((pattern) => {
          patterns[pattern] = (patterns[pattern] || 0) + 1;
        });
        anim.techniques.forEach((technique) => {
          techniques[technique] = (techniques[technique] || 0) + 1;
        });
        anim.packages.forEach((pkg) => {
          packages[pkg] = (packages[pkg] || 0) + 1;
        });
      });

      return { patterns, techniques, components, hooks, packages, functions };
    }

    // Default: calculate from all filtered animations
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

      // Count components with normalization (unique per animation)
      const uniqueComponents = new Set<string>();
      anim.components.forEach((component) => {
        const baseComponent = normalizeComponentName(component);
        uniqueComponents.add(baseComponent);
      });

      // Increment count for each unique component
      uniqueComponents.forEach((comp) => {
        components[comp] = (components[comp] || 0) + 1;
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
  }, [filteredAnimations, selectedPackages, stats]);

  const toggleFilter = (list: string[], item: string, setter: (items: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const clearAllFilters = () => {
    setSelectedPackages([]);
  };

  const totalActiveFilters = selectedPackages.length;

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

      {/* Filters */}
      <View style={styles.controlsSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterHeaderTitle}>Filters</Text>
          {totalActiveFilters > 0 && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>✕ Clear all ({totalActiveFilters})</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>📦 Packages</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {Object.entries(stats.packages)
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
      </View>

      {/* Insights */}
      <View style={styles.insightsSection}>
        <View style={styles.insightsHeader}>
          <Text style={styles.insightsTitle}>Analysis</Text>
          <View style={styles.matchedBadge}>
            <Text style={styles.matchedCount}>{filteredAnimations.length}</Text>
            <Text style={styles.matchedLabel}>matched</Text>
          </View>
        </View>

        <View style={styles.insightsGrid}>
          <View style={styles.insightColumn}>
            <ProgressBarChart
              title="🎨 Patterns"
              items={insights.patterns}
              total={filteredAnimations.length}
              color="#00D9FF"
              limit={10}
            />

            <ProgressBarChart
              title="⚡ Techniques"
              items={insights.techniques}
              total={filteredAnimations.length}
              color="#FFD60A"
              limit={10}
            />

            <ProgressBarChart
              title="🔧 Functions"
              items={insights.functions}
              total={filteredAnimations.length}
              color="#FF9500"
              limit={10}
            />
          </View>

          <View style={styles.insightColumn}>
            <ProgressBarChart
              title="🧩 Components"
              items={insights.components}
              total={filteredAnimations.length}
              color="#AF52DE"
              limit={10}
            />

            <ProgressBarChart
              title="🎣 Hooks"
              items={insights.hooks}
              total={filteredAnimations.length}
              color="#FF375F"
              limit={10}
            />

            <ProgressBarChart
              title="📦 Packages"
              items={insights.packages}
              total={filteredAnimations.length}
              color="#34C759"
              limit={10}
            />
          </View>
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
    marginBottom: 48,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  clearAllButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearAllText: {
    color: '#888',
    fontSize: 12,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
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
    marginBottom: 60,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  insightsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  matchedCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  matchedLabel: {
    fontSize: 13,
    color: '#666',
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 32,
  },
  insightColumn: {
    flex: 1,
  },
});
