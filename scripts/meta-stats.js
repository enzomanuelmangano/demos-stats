#!/usr/bin/env node

/**
 * Generate Aggregate Statistics
 *
 * Analyzes all metadata files and generates aggregate statistics
 * for the dashboard.
 */

const fs = require('fs');
const path = require('path');

const META_DIR = path.join(__dirname, '..', 'data', 'meta');
const STATS_FILE = path.join(__dirname, '..', 'data', 'stats.json');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Normalize component names by stripping common prefixes
 * - Touchable.Canvas -> Canvas
 * - Animated.View -> View
 * - Other.Namespaced.Component -> Component (last part)
 */
function normalizeComponentName(component) {
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
    return component.split('.').pop();
  }
  return component;
}

function generateStats() {
  console.log(`${colors.bright}Generating Aggregate Statistics${colors.reset}\n`);

  if (!fs.existsSync(META_DIR)) {
    console.error('Meta directory not found. Run extract-metadata.js first.');
    return;
  }

  const metaFiles = fs.readdirSync(META_DIR).filter(f => f.endsWith('.json'));

  console.log(`${colors.gray}Found ${metaFiles.length} animation metadata files${colors.reset}`);

  const stats = {
    total_animations: metaFiles.length,
    packages: {},
    hooks: {},
    functions: {},
    components: {},
    patterns: {},
    techniques: {},
    // Reverse indexes for filtering
    packages_index: {},
    hooks_index: {},
    patterns_index: {},
    techniques_index: {},
    // Package-specific breakdowns
    components_by_package: {},
    hooks_by_package: {},
    functions_by_package: {},
    animations: [],
  };

  metaFiles.forEach(file => {
    const filePath = path.join(META_DIR, file);
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Track animation summary with full metadata for filtering
    stats.animations.push({
      slug: metadata.animation_slug,
      total_files: metadata.stats.total_files,
      total_packages: metadata.stats.total_packages,
      total_hooks: metadata.stats.total_hooks,
      total_patterns: metadata.stats.total_patterns,
      extracted_at: metadata.extracted_at,
      packages: metadata.packages,
      hooks: metadata.hooks,
      patterns: metadata.patterns,
      techniques: metadata.techniques,
      components: metadata.components,
      functions: metadata.functions,
      packages_detail: metadata.packages_detail,
    });

    // Count packages and build reverse index
    metadata.packages.forEach(pkg => {
      stats.packages[pkg] = (stats.packages[pkg] || 0) + 1;
      if (!stats.packages_index[pkg]) {
        stats.packages_index[pkg] = [];
      }
      stats.packages_index[pkg].push(metadata.animation_slug);
    });

    // Count hooks and build reverse index
    metadata.hooks.forEach(hook => {
      stats.hooks[hook] = (stats.hooks[hook] || 0) + 1;
      if (!stats.hooks_index[hook]) {
        stats.hooks_index[hook] = [];
      }
      stats.hooks_index[hook].push(metadata.animation_slug);
    });

    // Count functions
    metadata.functions.forEach(fn => {
      stats.functions[fn] = (stats.functions[fn] || 0) + 1;
    });

    // Count components with normalization (unique components per animation)
    const uniqueComponents = new Set();
    metadata.components.forEach(comp => {
      const baseComponent = normalizeComponentName(comp);
      uniqueComponents.add(baseComponent);
    });

    // Increment count for each unique component in this animation
    uniqueComponents.forEach(comp => {
      stats.components[comp] = (stats.components[comp] || 0) + 1;
    });

    // Count patterns and build reverse index
    metadata.patterns.forEach(pattern => {
      stats.patterns[pattern] = (stats.patterns[pattern] || 0) + 1;
      if (!stats.patterns_index[pattern]) {
        stats.patterns_index[pattern] = [];
      }
      stats.patterns_index[pattern].push(metadata.animation_slug);
    });

    // Count techniques and build reverse index
    metadata.techniques.forEach(technique => {
      stats.techniques[technique] = (stats.techniques[technique] || 0) + 1;
      if (!stats.techniques_index[technique]) {
        stats.techniques_index[technique] = [];
      }
      stats.techniques_index[technique].push(metadata.animation_slug);
    });

    // Build package-specific component/hook/function mappings using packages_detail
    if (metadata.packages_detail) {
      Object.entries(metadata.packages_detail).forEach(([pkg, detail]) => {
        // Initialize package entries if needed
        if (!stats.components_by_package[pkg]) {
          stats.components_by_package[pkg] = {};
        }
        if (!stats.hooks_by_package[pkg]) {
          stats.hooks_by_package[pkg] = {};
        }
        if (!stats.functions_by_package[pkg]) {
          stats.functions_by_package[pkg] = {};
        }

        // Track components FROM this package
        if (detail.components) {
          detail.components.forEach(comp => {
            const baseComponent = normalizeComponentName(comp);
            stats.components_by_package[pkg][baseComponent] =
              (stats.components_by_package[pkg][baseComponent] || 0) + 1;
          });
        }

        // Track hooks FROM this package
        if (detail.hooks) {
          detail.hooks.forEach(hook => {
            stats.hooks_by_package[pkg][hook] = (stats.hooks_by_package[pkg][hook] || 0) + 1;
          });
        }

        // Track functions FROM this package
        if (detail.functions) {
          detail.functions.forEach(fn => {
            stats.functions_by_package[pkg][fn] = (stats.functions_by_package[pkg][fn] || 0) + 1;
          });
        }
      });
    }

    // Wrapped components are now handled in package-specific sections below

    // Handle Touchable.* wrappers for Skia components
    // Touchable.Canvas should count as Canvas for Skia, etc.
    if (metadata.packages.includes('@shopify/react-native-skia')) {
      if (!stats.components_by_package['@shopify/react-native-skia']) {
        stats.components_by_package['@shopify/react-native-skia'] = {};
      }

      const skiaDetail = metadata.packages_detail?.['@shopify/react-native-skia'];
      const skiaDetailComponents = new Set(skiaDetail?.components || []);

      // Check global components for Touchable.* versions
      const touchableAdded = new Set();
      metadata.components.forEach(comp => {
        if (comp.startsWith('Touchable.')) {
          const normalized = normalizeComponentName(comp);

          // Only count if Canvas/Circle/etc is NOT already in packages_detail
          // This avoids double-counting when both Canvas and Touchable.Canvas exist
          if (!skiaDetailComponents.has(normalized)) {
            stats.components_by_package['@shopify/react-native-skia'][normalized] =
              (stats.components_by_package['@shopify/react-native-skia'][normalized] || 0) + 1;
            touchableAdded.add(normalized);
          }
        }
      });

      // Handle react-native-qrcode-skia (uses Canvas internally)
      if (metadata.packages.includes('react-native-qrcode-skia') &&
          !skiaDetailComponents.has('Canvas') &&
          !touchableAdded.has('Canvas')) {
        stats.components_by_package['@shopify/react-native-skia']['Canvas'] =
          (stats.components_by_package['@shopify/react-native-skia']['Canvas'] || 0) + 1;
      }
    }
  });

  // Sort by frequency
  stats.packages = Object.fromEntries(
    Object.entries(stats.packages).sort((a, b) => b[1] - a[1])
  );
  stats.hooks = Object.fromEntries(
    Object.entries(stats.hooks).sort((a, b) => b[1] - a[1])
  );
  stats.functions = Object.fromEntries(
    Object.entries(stats.functions).sort((a, b) => b[1] - a[1])
  );
  stats.components = Object.fromEntries(
    Object.entries(stats.components).sort((a, b) => b[1] - a[1])
  );
  stats.patterns = Object.fromEntries(
    Object.entries(stats.patterns).sort((a, b) => b[1] - a[1])
  );
  stats.techniques = Object.fromEntries(
    Object.entries(stats.techniques).sort((a, b) => b[1] - a[1])
  );

  // Sort package-specific breakdowns
  Object.keys(stats.components_by_package).forEach(pkg => {
    stats.components_by_package[pkg] = Object.fromEntries(
      Object.entries(stats.components_by_package[pkg]).sort((a, b) => b[1] - a[1])
    );
  });
  Object.keys(stats.hooks_by_package).forEach(pkg => {
    stats.hooks_by_package[pkg] = Object.fromEntries(
      Object.entries(stats.hooks_by_package[pkg]).sort((a, b) => b[1] - a[1])
    );
  });
  Object.keys(stats.functions_by_package).forEach(pkg => {
    stats.functions_by_package[pkg] = Object.fromEntries(
      Object.entries(stats.functions_by_package[pkg]).sort((a, b) => b[1] - a[1])
    );
  });

  // Top items
  const top = (obj, n = 10) => Object.entries(obj).slice(0, n);

  console.log(`\n${colors.bright}Top 10 Most Used:${colors.reset}`);
  console.log(`\n${colors.cyan}Packages:${colors.reset}`);
  top(stats.packages).forEach(([pkg, count]) => {
    console.log(`  ${pkg}: ${colors.green}${count}${colors.reset}`);
  });

  console.log(`\n${colors.cyan}Hooks:${colors.reset}`);
  top(stats.hooks).forEach(([hook, count]) => {
    console.log(`  ${hook}: ${colors.green}${count}${colors.reset}`);
  });

  console.log(`\n${colors.cyan}Patterns:${colors.reset}`);
  top(stats.patterns).forEach(([pattern, count]) => {
    console.log(`  ${pattern}: ${colors.green}${count}${colors.reset}`);
  });

  // Write stats file
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2) + '\n', 'utf8');

  console.log(`\n${colors.green}✓${colors.reset} Stats generated: ${STATS_FILE}`);
}

// Run if called directly
if (require.main === module) {
  generateStats();
}

module.exports = { generateStats };
