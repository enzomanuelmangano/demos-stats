export interface AnimationMetadata {
  animation_slug: string;
  content_hash: string;
  hash_algorithm: string;
  extracted_at: string;
  file_structure: FileStructure;
  packages: string[];
  packages_with_versions: Record<string, string>;
  packages_detail: Record<string, PackageDetail>;
  hooks: string[];
  functions: string[];
  components: string[];
  patterns: string[];
  techniques: string[];
  stats: Stats;
}

export interface FileStructure {
  entry: string | null;
  components: string[];
  hooks: string[];
  utils: string[];
  types: string[];
  constants: string[];
  assets: string[];
  other: string[];
}

export interface PackageDetail {
  imports: string[];
  hooks: string[];
  functions: string[];
  components: string[];
}

export interface Stats {
  total_files: number;
  total_packages: number;
  total_hooks: number;
  total_functions: number;
  total_components: number;
  total_patterns: number;
  total_techniques: number;
}

export interface AggregateStats {
  total_animations: number;
  generated_at: string;
  packages: Record<string, number>;
  hooks: Record<string, number>;
  functions: Record<string, number>;
  components: Record<string, number>;
  patterns: Record<string, number>;
  techniques: Record<string, number>;
  packages_index: Record<string, string[]>;
  hooks_index: Record<string, string[]>;
  patterns_index: Record<string, string[]>;
  techniques_index: Record<string, string[]>;
  components_by_package: Record<string, Record<string, number>>;
  hooks_by_package: Record<string, Record<string, number>>;
  functions_by_package: Record<string, Record<string, number>>;
  animations: AnimationSummary[];
}

export interface AnimationSummary {
  slug: string;
  total_files: number;
  total_packages: number;
  total_hooks: number;
  total_patterns: number;
  extracted_at: string;
  packages: string[];
  hooks: string[];
  patterns: string[];
  techniques: string[];
  components: string[];
  functions: string[];
  packages_detail: Record<string, PackageDetail>;
}
