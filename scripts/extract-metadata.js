#!/usr/bin/env node

/**
 * Deterministic Animation Metadata Extractor
 *
 * Automatically extracts metadata from animation source code using AST parsing.
 * No AI involved - purely static code analysis.
 *
 * Usage:
 *   node scripts/extract-metadata.js [animation-slug]
 *   node scripts/extract-metadata.js --all
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const crypto = require('crypto');
const { syncDemos, DEMOS_DIR } = require('./sync-demos');

const META_DIR = path.join(__dirname, '..', 'public', 'data', 'meta');
const HASH_ALGORITHM = 'sha256';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Get all TypeScript/JavaScript files in a directory recursively
 * (for AST parsing - excludes JSON)
 */
function getAllTsFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllTsFiles(fullPath, arrayOfFiles);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Get all code files including JSON in a directory recursively
 * (for hash calculation)
 */
function getAllCodeFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);

    // Skip system files
    if (file === '.DS_Store') {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllCodeFiles(fullPath, arrayOfFiles);
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(file)) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Parse a TypeScript file and extract all imports
 */
function extractImports(sourceFile) {
  const imports = {
    packages: new Set(),
    namedImports: {},
    defaultImports: {},
    namespaceImports: {},
    typeImports: {},
  };

  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier.text;

      // Track package
      imports.packages.add(moduleSpecifier);

      // Extract named imports
      if (node.importClause) {
        const { name, namedBindings } = node.importClause;

        // Default import
        if (name) {
          if (!imports.defaultImports[moduleSpecifier]) {
            imports.defaultImports[moduleSpecifier] = [];
          }
          imports.defaultImports[moduleSpecifier].push(name.text);
        }

        // Named imports or namespace imports
        if (namedBindings) {
          if (ts.isNamedImports(namedBindings)) {
            // Named imports: import { foo, bar } from 'pkg'
            namedBindings.elements.forEach(element => {
              const importName = element.name.text;
              const isTypeOnly = element.isTypeOnly || node.importClause.isTypeOnly;

              if (isTypeOnly) {
                if (!imports.typeImports[moduleSpecifier]) {
                  imports.typeImports[moduleSpecifier] = [];
                }
                imports.typeImports[moduleSpecifier].push(importName);
              } else {
                if (!imports.namedImports[moduleSpecifier]) {
                  imports.namedImports[moduleSpecifier] = [];
                }
                imports.namedImports[moduleSpecifier].push(importName);
              }
            });
          } else if (ts.isNamespaceImport(namedBindings)) {
            // Namespace import: import * as Foo from 'pkg'
            const namespaceName = namedBindings.name.text;
            if (!imports.namespaceImports[moduleSpecifier]) {
              imports.namespaceImports[moduleSpecifier] = [];
            }
            imports.namespaceImports[moduleSpecifier].push(namespaceName);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    packages: Array.from(imports.packages),
    namedImports: imports.namedImports,
    defaultImports: imports.defaultImports,
    namespaceImports: imports.namespaceImports,
    typeImports: imports.typeImports,
  };
}

/**
 * Extract function and hook calls from the AST
 */
function extractCalls(sourceFile) {
  const calls = {
    hooks: new Set(),
    functions: new Set(),
    components: new Set(),
    namespaceCalls: new Map(), // Maps namespace identifier to called functions
  };

  // Blocklist of boring utility functions to exclude
  const EXCLUDED_FUNCTIONS = new Set([
    'create', // StyleSheet.create
    'map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every', 'includes',
    'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat',
    'floor', 'ceil', 'round', 'abs', 'min', 'max', 'sqrt', 'pow', 'random',
    'get', 'set', 'has', 'delete', 'clear',
    'log', 'warn', 'error', 'info', 'debug',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'require', 'import', 'export',
    'toString', 'valueOf', 'toJSON',
    'length', 'size', 'count',
    'memo', 'forwardRef', 'lazy', 'render',
    'flatten', 'entries', 'keys', 'values',
    'onPress', 'onChange', 'onLayout', 'onSubmit', 'renderItem',
  ]);

  function visit(node) {
    // Hook calls (useXxx)
    if (ts.isCallExpression(node)) {
      const expr = node.expression;

      if (ts.isIdentifier(expr)) {
        const name = expr.text;

        if (name.startsWith('use')) {
          calls.hooks.add(name);
        } else if (name.startsWith('with')) {
          calls.functions.add(name);
        } else if (!EXCLUDED_FUNCTIONS.has(name)) {
          calls.functions.add(name);
        }
      }

      // Property access like Gesture.Pan() or StyleSheet.create()
      if (ts.isPropertyAccessExpression(expr)) {
        const left = expr.expression;
        const right = expr.name.text;

        if (ts.isIdentifier(left)) {
          const namespace = left.text;
          const fullName = `${namespace}.${right}`;

          // Track namespace calls for mapping later (e.g., Haptics.selectionAsync)
          if (!calls.namespaceCalls.has(namespace)) {
            calls.namespaceCalls.set(namespace, new Set());
          }
          calls.namespaceCalls.get(namespace).add(right);

          // Detect Animated.View, Animated.Text, etc.
          if (namespace === 'Animated') {
            calls.components.add(fullName);
          } else if (!EXCLUDED_FUNCTIONS.has(right)) {
            // Track as function call with full name (e.g., Gesture.Pan)
            calls.functions.add(fullName);
          }
        }
      }
    }

    // JSX Elements (components)
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName;

      if (ts.isIdentifier(tagName)) {
        calls.components.add(tagName.text);
      } else if (ts.isPropertyAccessExpression(tagName)) {
        const left = tagName.expression;
        const right = tagName.name.text;
        if (ts.isIdentifier(left)) {
          calls.components.add(`${left.text}.${right}`);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Convert namespaceCalls Map to object
  const namespaceCalls = {};
  calls.namespaceCalls.forEach((funcs, namespace) => {
    namespaceCalls[namespace] = Array.from(funcs).sort();
  });

  return {
    hooks: Array.from(calls.hooks).sort(),
    functions: Array.from(calls.functions).sort(),
    components: Array.from(calls.components).sort(),
    namespaceCalls: namespaceCalls,
  };
}

/**
 * Analyze file structure
 */
function analyzeFileStructure(animationPath) {
  const structure = {
    entry: null,
    components: [],
    hooks: [],
    utils: [],
    types: [],
    constants: [],
    assets: [],
    other: [],
  };

  const files = getAllTsFiles(animationPath);
  const basePath = animationPath;

  files.forEach(file => {
    const relativePath = path.relative(basePath, file);
    const fileName = path.basename(file);
    const dirName = path.dirname(relativePath);

    // Categorize files
    if (fileName === 'index.tsx' || fileName === 'index.ts') {
      structure.entry = relativePath;
    } else if (dirName.includes('components') || dirName === '.') {
      structure.components.push(relativePath);
    } else if (dirName.includes('hooks')) {
      structure.hooks.push(relativePath);
    } else if (dirName.includes('utils')) {
      structure.utils.push(relativePath);
    } else if (dirName.includes('types') || fileName.includes('types.ts')) {
      structure.types.push(relativePath);
    } else if (dirName.includes('constants') || fileName.includes('constants.ts')) {
      structure.constants.push(relativePath);
    } else {
      structure.other.push(relativePath);
    }
  });

  return structure;
}

/**
 * Calculate hash for animation folder
 */
function calculateAnimationHash(animationPath) {
  const allFiles = getAllCodeFiles(animationPath);

  // Sort files for consistent hashing
  allFiles.sort();

  // Create hash from all file contents
  const hash = crypto.createHash(HASH_ALGORITHM);

  allFiles.forEach(file => {
    const relativePath = path.relative(animationPath, file);
    const content = fs.readFileSync(file, 'utf8');

    // Include filename in hash to detect renames
    hash.update(relativePath);
    hash.update(content);
  });

  return hash.digest('hex');
}

/**
 * Aggregate data from all files in an animation
 */
function analyzeAnimation(animationPath, slug) {
  const files = getAllTsFiles(animationPath);

  const aggregatedData = {
    packages: new Set(),
    namedImports: {},
    namespaceImports: {},
    hooks: new Set(),
    functions: new Set(),
    components: new Set(),
    namespaceCalls: {},
  };

  console.log(`  ${colors.gray}Analyzing ${files.length} files...${colors.reset}`);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Extract imports
    const imports = extractImports(sourceFile);
    imports.packages.forEach(pkg => aggregatedData.packages.add(pkg));

    // Merge named imports
    Object.keys(imports.namedImports).forEach(pkg => {
      if (!aggregatedData.namedImports[pkg]) {
        aggregatedData.namedImports[pkg] = new Set();
      }
      imports.namedImports[pkg].forEach(item => {
        aggregatedData.namedImports[pkg].add(item);
      });
    });

    // Merge namespace imports
    Object.keys(imports.namespaceImports).forEach(pkg => {
      if (!aggregatedData.namespaceImports[pkg]) {
        aggregatedData.namespaceImports[pkg] = new Set();
      }
      imports.namespaceImports[pkg].forEach(item => {
        aggregatedData.namespaceImports[pkg].add(item);
      });
    });

    // Extract calls
    const calls = extractCalls(sourceFile);
    calls.hooks.forEach(hook => aggregatedData.hooks.add(hook));
    calls.functions.forEach(fn => aggregatedData.functions.add(fn));
    calls.components.forEach(comp => aggregatedData.components.add(comp));

    // Merge namespace calls
    Object.keys(calls.namespaceCalls).forEach(namespace => {
      if (!aggregatedData.namespaceCalls[namespace]) {
        aggregatedData.namespaceCalls[namespace] = new Set();
      }
      calls.namespaceCalls[namespace].forEach(fn => {
        aggregatedData.namespaceCalls[namespace].add(fn);
      });
    });
  });

  // Convert Sets to sorted arrays, filter out relative imports
  const allPackages = Array.from(aggregatedData.packages);
  const packages = allPackages.filter(pkg => !pkg.startsWith('.') && !pkg.startsWith('/')).sort();
  const hooks = Array.from(aggregatedData.hooks).sort();
  const functions = Array.from(aggregatedData.functions).sort();
  const components = Array.from(aggregatedData.components).sort();

  // Convert namedImports Sets to arrays, filter out relative imports
  const namedImports = {};
  Object.keys(aggregatedData.namedImports).forEach(pkg => {
    // Skip relative imports
    if (pkg.startsWith('.') || pkg.startsWith('/')) {
      return;
    }
    namedImports[pkg] = Array.from(aggregatedData.namedImports[pkg]).sort();
  });

  // Convert namespaceImports Sets to arrays, filter out relative imports
  const namespaceImports = {};
  Object.keys(aggregatedData.namespaceImports).forEach(pkg => {
    // Skip relative imports
    if (pkg.startsWith('.') || pkg.startsWith('/')) {
      return;
    }
    namespaceImports[pkg] = Array.from(aggregatedData.namespaceImports[pkg]).sort();
  });

  // Convert namespaceCalls Sets to arrays
  const namespaceCalls = {};
  Object.keys(aggregatedData.namespaceCalls).forEach(namespace => {
    namespaceCalls[namespace] = Array.from(aggregatedData.namespaceCalls[namespace]).sort();
  });

  // Categorize by package
  const packageData = categorizeByPackage(
    packages,
    namedImports,
    namespaceImports,
    namespaceCalls,
    hooks,
    functions,
    components
  );

  // Analyze file structure
  const fileStructure = analyzeFileStructure(animationPath);

  // Detect patterns
  const { patterns, techniques } = detectPatterns(hooks, functions, components);

  // Get package versions
  const packageVersions = getPackageVersions(packages);

  // Calculate content hash
  const contentHash = calculateAnimationHash(animationPath);

  return {
    animation_slug: slug,
    content_hash: contentHash,
    hash_algorithm: HASH_ALGORITHM,
    extracted_at: new Date().toISOString(),
    file_structure: fileStructure,
    packages: packages,
    packages_with_versions: packageVersions,
    packages_detail: packageData,
    hooks: hooks,
    functions: functions,
    components: components,
    patterns: patterns,
    techniques: techniques,
    stats: {
      total_files: files.length,
      total_packages: packages.length,
      total_hooks: hooks.length,
      total_functions: functions.length,
      total_components: components.length,
      total_patterns: patterns.length,
      total_techniques: techniques.length,
    },
  };
}

/**
 * Categorize imports by package
 * Automatically detects which package each hook/function/component came from
 * by building a reverse lookup from the actual imports (both named and namespace)
 */
function categorizeByPackage(
  packages,
  namedImports,
  namespaceImports,
  namespaceCalls,
  hooks,
  functions,
  components
) {
  const packageData = {};

  packages.forEach(pkg => {
    if (pkg.startsWith('.') || pkg.startsWith('/')) {
      return;
    }

    packageData[pkg] = {
      imports: namedImports[pkg] || [],
      hooks: [],
      functions: [],
      components: [],
    };
  });

  // Build reverse lookups
  // 1. item name -> package (for named imports)
  const itemToPackage = {};
  Object.entries(namedImports).forEach(([pkg, imports]) => {
    imports.forEach(item => {
      if (!itemToPackage[item]) {
        itemToPackage[item] = pkg;
      }
    });
  });

  // 2. namespace identifier -> package (for namespace imports like Haptics)
  const namespaceToPackage = {};
  Object.entries(namespaceImports).forEach(([pkg, namespaces]) => {
    namespaces.forEach(namespace => {
      if (!namespaceToPackage[namespace]) {
        namespaceToPackage[namespace] = pkg;
      }
    });
  });

  // Categorize hooks based on their import source
  hooks.forEach(hook => {
    const pkg = itemToPackage[hook];
    if (pkg && packageData[pkg]) {
      packageData[pkg].hooks.push(hook);
    }
  });

  // Categorize functions based on their import source
  functions.forEach(fn => {
    const pkg = itemToPackage[fn];
    if (pkg && packageData[pkg]) {
      packageData[pkg].functions.push(fn);
    }
  });

  // Categorize namespace calls (e.g., Haptics.selectionAsync)
  Object.entries(namespaceCalls).forEach(([namespace, calls]) => {
    const pkg = namespaceToPackage[namespace];
    if (pkg && packageData[pkg]) {
      calls.forEach(fn => {
        if (!packageData[pkg].functions.includes(fn)) {
          packageData[pkg].functions.push(fn);
        }
      });
    }
  });

  // Categorize components based on their import source
  components.forEach(comp => {
    // Handle special cases like Animated.View (property access components)
    if (comp.startsWith('Animated.')) {
      if (packageData['react-native-reanimated']) {
        packageData['react-native-reanimated'].components.push(comp);
      }
    } else {
      const pkg = itemToPackage[comp];
      if (pkg && packageData[pkg]) {
        packageData[pkg].components.push(comp);
      }
    }
  });

  return packageData;
}

/**
 * Detect common animation patterns and techniques
 */
function detectPatterns(hooks, functions, components) {
  const patterns = [];
  const techniques = [];

  // Basic patterns
  if (hooks.includes('useSharedValue')) {
    patterns.push('shared-value-state');
  }

  if (hooks.includes('useAnimatedStyle')) {
    patterns.push('animated-styling');
  }

  if (hooks.includes('useDerivedValue')) {
    patterns.push('derived-computation');
  }

  if (hooks.includes('useAnimatedScrollHandler')) {
    patterns.push('scroll-animation');
    techniques.push('scroll-based-animation');
  }

  if (hooks.includes('useAnimatedGestureHandler')) {
    patterns.push('gesture-animation');
    techniques.push('gesture-based-animation');
  }

  if (hooks.includes('useAnimatedReaction')) {
    patterns.push('animated-reaction');
    techniques.push('reactive-side-effects');
  }

  if (functions.includes('withTiming')) {
    patterns.push('timing-animation');
    techniques.push('timing-based-transitions');
  }

  if (functions.includes('withSpring')) {
    patterns.push('spring-animation');
    techniques.push('spring-physics');
  }

  if (functions.includes('withDelay')) {
    patterns.push('delayed-animation');
    techniques.push('staggered-timing');
  }

  if (functions.includes('withRepeat')) {
    patterns.push('repeating-animation');
    techniques.push('loop-animations');
  }

  if (functions.includes('withSequence')) {
    patterns.push('sequence-animation');
    techniques.push('sequential-animations');
  }

  if (functions.includes('interpolate')) {
    patterns.push('value-interpolation');
    techniques.push('value-mapping');
  }

  if (functions.includes('interpolateColor')) {
    patterns.push('color-interpolation');
    techniques.push('color-transitions');
  }

  // Complex patterns
  if (hooks.includes('useSharedValue') && hooks.includes('useAnimatedStyle')) {
    patterns.push('reactive-styling-pattern');
  }

  if (hooks.includes('useDerivedValue') && functions.includes('withDelay')) {
    patterns.push('staggered-derived-values');
    techniques.push('character-level-staggering');
  }

  if (hooks.includes('useImperativeHandle')) {
    patterns.push('imperative-animation-api');
    techniques.push('ref-based-control');
  }

  // Technology-specific patterns
  if (components.some(c => c.includes('Canvas'))) {
    patterns.push('skia-graphics');
    techniques.push('canvas-rendering');
  }

  if (components.some(c => c.includes('Blur'))) {
    techniques.push('blur-effects');
  }

  if (components.some(c => c.includes('MaskedView'))) {
    techniques.push('masking-effects');
  }

  if (hooks.includes('useAnimatedStyle')) {
    techniques.push('transform-animations');
  }

  return { patterns, techniques };
}

/**
 * Get package versions from package.json
 */
function getPackageVersions(packages) {
  const packageJsonPath = path.join(DEMOS_DIR, 'package.json');
  let packageJson = {};

  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.warn(`${colors.yellow}Warning: Could not read package.json${colors.reset}`);
    return {};
  }

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const versions = {};
  packages.forEach(pkg => {
    if (pkg.startsWith('.')) return;

    if (allDeps[pkg]) {
      versions[pkg] = allDeps[pkg];
    }
  });

  return versions;
}

/**
 * Get animation directories
 */
function getAnimationDirectories() {
  const animationsDir = path.join(DEMOS_DIR, 'src', 'animations');

  if (!fs.existsSync(animationsDir)) {
    console.error(`${colors.yellow}✗${colors.reset} Animations directory not found: ${animationsDir}`);
    return [];
  }

  const entries = fs.readdirSync(animationsDir, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .filter(entry => !entry.name.startsWith('.'))
    .map(entry => ({
      slug: entry.name,
      path: path.join(animationsDir, entry.name),
    }));
}

/**
 * Extract metadata for a single animation
 */
function extractAnimation(slug) {
  const animationsDir = path.join(DEMOS_DIR, 'src', 'animations');
  const animationPath = path.join(animationsDir, slug);

  if (!fs.existsSync(animationPath)) {
    console.error(`${colors.yellow}✗${colors.reset} Animation not found: ${slug}`);
    return false;
  }

  console.log(`${colors.cyan}→${colors.reset} Extracting: ${colors.bright}${slug}${colors.reset}`);

  try {
    const metadata = analyzeAnimation(animationPath, slug);

    // Ensure meta directory exists
    if (!fs.existsSync(META_DIR)) {
      fs.mkdirSync(META_DIR, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(META_DIR, `${slug}.json`);
    fs.writeFileSync(
      outputPath,
      JSON.stringify(metadata, null, 2) + '\n',
      'utf8'
    );

    console.log(`${colors.green}✓${colors.reset} ${slug} - extracted successfully`);
    console.log(`  ${colors.gray}Files: ${metadata.stats.total_files}, Packages: ${metadata.stats.total_packages}, Hooks: ${metadata.stats.total_hooks}${colors.reset}`);

    return true;
  } catch (error) {
    console.error(`${colors.yellow}✗${colors.reset} Error extracting ${slug}: ${error.message}`);
    return false;
  }
}

/**
 * Extract metadata for all animations
 */
async function extractAll() {
  // First sync the demos repo
  console.log(`${colors.bright}Step 1: Syncing demos repository${colors.reset}\n`);
  await syncDemos();
  console.log();

  const animations = getAnimationDirectories();

  console.log(
    `${colors.bright}Step 2: Extracting metadata for ${animations.length} animations...${colors.reset}\n`
  );

  let successCount = 0;
  let failCount = 0;

  animations.forEach(animation => {
    if (extractAnimation(animation.slug)) {
      successCount++;
    } else {
      failCount++;
    }
    console.log();
  });

  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  ${colors.green}${successCount} extracted${colors.reset}`);
  if (failCount > 0) {
    console.log(`  ${colors.yellow}${failCount} failed${colors.reset}`);
  }
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
${colors.bright}Deterministic Animation Metadata Extractor${colors.reset}

${colors.bright}Usage:${colors.reset}
  ${colors.cyan}node scripts/extract-metadata.js <animation-slug>${colors.reset}   Extract single animation
  ${colors.cyan}node scripts/extract-metadata.js --all${colors.reset}               Extract all animations

${colors.bright}Examples:${colors.reset}
  node scripts/extract-metadata.js everybody-can-cook
  node scripts/extract-metadata.js --all

${colors.bright}Output:${colors.reset}
  Writes to ${colors.cyan}data/meta/{animation-slug}.json${colors.reset}

${colors.bright}Extracted Data:${colors.reset}
  - File structure (entry, components, hooks, utils, types)
  - All packages used
  - All hooks called
  - All functions called
  - All components used
  - Detected patterns
  - Statistics
    `);
    return;
  }

  if (command === '--all' || command === '-a') {
    await extractAll();
  } else {
    await syncDemos();
    console.log();
    extractAnimation(command);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeAnimation,
  extractImports,
  extractCalls,
};
