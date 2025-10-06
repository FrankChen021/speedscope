#!/usr/bin/env tsx

/**
 * Build script for creating a library distribution of speedscope
 * that can be consumed by other projects
 */

import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'
import {execSync} from 'child_process'

const outdir = path.join(process.cwd(), 'dist', 'lib')

// Clean output directory
if (fs.existsSync(outdir)) {
  // Use rm -rf for cross-platform compatibility
  execSync(`rm -rf "${outdir}"`)
}
fs.mkdirSync(outdir, {recursive: true})

console.log('Building speedscope library...')

// Common build options
const commonOptions: esbuild.BuildOptions = {
  bundle: true,
  platform: 'browser',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  sourcemap: true,
  target: ['es2015'],
}

async function buildLib() {
  // Build main index (CommonJS)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/index.tsx'],
    outfile: path.join(outdir, 'index.js'),
    format: 'cjs',
  })
  console.log('✓ Built CommonJS bundle')

  // Build main index (ESM)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/index.tsx'],
    outfile: path.join(outdir, 'index.esm.js'),
    format: 'esm',
  })
  console.log('✓ Built ESM bundle')

  // Build standalone component (CommonJS)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/standalone-flamegraph.tsx'],
    outfile: path.join(outdir, 'standalone.js'),
    format: 'cjs',
  })
  console.log('✓ Built standalone CommonJS bundle')

  // Build standalone component (ESM)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/standalone-flamegraph.tsx'],
    outfile: path.join(outdir, 'standalone.esm.js'),
    format: 'esm',
  })
  console.log('✓ Built standalone ESM bundle')

  // Generate TypeScript declarations - minimal self-contained versions
  console.log('Generating TypeScript declarations...')

  // Create standalone.d.ts with self-contained types
  const standaloneDts = `import * as React from 'react';

export type ViewMode = 'time-order' | 'left-heavy' | 'sandwich';

export interface StandaloneFlamegraphProps {
  profileData?: any;
  width?: number | string;
  height?: number | string;
  fileName?: string;
  theme?: 'light' | 'dark';
  viewMode?: ViewMode;
  onProfileLoad?: (profile: any) => void;
  onError?: (error: Error) => void;
}

export declare function StandaloneFlamegraph(props: StandaloneFlamegraphProps): React.JSX.Element;
`
  fs.writeFileSync(path.join(outdir, 'standalone.d.ts'), standaloneDts)

  // Create index.d.ts with self-contained types
  const indexDts = `import * as React from 'react';

// View mode type
export type ViewMode = 'time-order' | 'left-heavy' | 'sandwich';

// Main component
export interface StandaloneFlamegraphProps {
  profileData?: any;
  width?: number | string;
  height?: number | string;
  fileName?: string;
  theme?: 'light' | 'dark';
  viewMode?: ViewMode;
  onProfileLoad?: (profile: any) => void;
  onError?: (error: Error) => void;
}

export declare function StandaloneFlamegraph(props: StandaloneFlamegraphProps): React.JSX.Element;

// Standalone Sandwich component
export interface StandaloneSandwichProps {
  profileData?: any;
  width?: number | string;
  height?: number | string;
  fileName?: string;
  theme?: 'light' | 'dark';
  onProfileLoad?: (profile: any) => void;
  onError?: (error: Error) => void;
}

export declare function StandaloneSandwich(props: StandaloneSandwichProps): React.JSX.Element;

// Flamechart components
export declare const ChronoFlamechartView: React.FC<any>;
export declare const LeftHeavyFlamechartView: React.FC<any>;
export declare const SandwichViewContainer: React.FC<any>;
export declare const FlamechartView: React.FC<any>;
export declare const FlamechartPanZoomView: React.FC<any>;
export declare const FlamechartMinimapView: React.FC<any>;
export declare const FlamechartDetailView: React.FC<any>;

// Search context providers
export declare const FlamechartSearchContextProvider: React.FC<{children?: React.ReactNode}>;
export declare const ProfileSearchContextProvider: React.FC<{children?: React.ReactNode}>;

// Theme system
export interface Theme {
  fgPrimaryColor: string;
  fgSecondaryColor: string;
  bgPrimaryColor: string;
  bgSecondaryColor: string;
  selectionPrimaryColor: string;
  selectionSecondaryColor: string;
  weightColor: string;
}

export declare const ThemeProvider: React.FC<{children?: React.ReactNode; theme?: Theme}>;
export declare function useTheme(): Theme;
export declare const lightTheme: Theme;
export declare const darkTheme: Theme;

// Utility hooks and functions
export declare function useAtom<T>(atom: Atom<T>): T;

// Core types
export interface Atom<T> {
  get(): T;
  set(value: T): void;
  subscribe(callback: () => void): () => void;
}

export interface Profile {
  getName(): string;
  getTotalWeight(): number;
  getTotalNonIdleWeight(): number;
  getAppendOrderCalltreeRoot(): CallTreeNode;
  getGroupedCalltreeRoot(): CallTreeNode;
  formatValue(v: number): string;
  getWeightUnit(): string;
}

export interface ProfileGroup {
  name: string;
  indexToView: number;
  profiles: Profile[];
}

export interface Frame {
  key: string | number;
  name: string;
  file?: string;
  line?: number;
  col?: number;
}

export interface CallTreeNode {
  frame: Frame;
  getTotalWeight(): number;
  getSelfWeight(): number;
  children: CallTreeNode[];
}

// Import utilities
export declare function importProfileGroupFromText(fileName: string, contents: string): Promise<ProfileGroup | null>;
export declare function importProfilesFromArrayBuffer(fileName: string, buffer: ArrayBuffer): Promise<ProfileGroup | null>;
export declare function importProfileGroupFromBase64(fileName: string, b64contents: string): Promise<ProfileGroup | null>;

// GL rendering
export interface CanvasContext {
  gl: WebGLRenderingContext;
  rectangleBatchRenderer: any;
}

export declare function getCanvasContext(canvas: HTMLCanvasElement): CanvasContext | null;

// Math utilities
export declare class Vec2 {
  readonly x: number;
  readonly y: number;
  constructor(x: number, y: number);
}

export declare class Rect {
  readonly origin: Vec2;
  readonly size: Vec2;
  constructor(origin: Vec2, size: Vec2);
}

export declare class AffineTransform {
  constructor(m00?: number, m01?: number, m02?: number, m10?: number, m11?: number, m12?: number);
}

// View mode
export declare enum ViewMode {
  CHRONO_FLAME_CHART = 'CHRONO_FLAME_CHART',
  LEFT_HEAVY_FLAME_GRAPH = 'LEFT_HEAVY_FLAME_GRAPH',
  SANDWICH_VIEW = 'SANDWICH_VIEW',
}
`
  fs.writeFileSync(path.join(outdir, 'index.d.ts'), indexDts)
  console.log('✓ Generated TypeScript declarations')

  // Copy CSS files
  const cssFiles = ['assets/reset.css', 'assets/source-code-pro.css']
  const assetsDir = path.join(outdir, 'assets')
  fs.mkdirSync(assetsDir, {recursive: true})

  for (const cssFile of cssFiles) {
    if (fs.existsSync(cssFile)) {
      fs.copyFileSync(cssFile, path.join(outdir, cssFile))
    }
  }

  // Copy font files
  const fontDir = 'assets/source-code-pro'
  if (fs.existsSync(fontDir)) {
    const fontOutDir = path.join(outdir, fontDir)
    fs.mkdirSync(fontOutDir, {recursive: true})

    const fontFiles = fs.readdirSync(fontDir)
    for (const file of fontFiles) {
      fs.copyFileSync(path.join(fontDir, file), path.join(fontOutDir, file))
    }
  }
  console.log('✓ Copied assets')

  console.log('\n✅ Library build complete!')
  console.log(`Output: ${outdir}`)
  console.log('\nTo use in another project:')
  console.log('  1. npm link (in this directory)')
  console.log('  2. npm link speedscope (in your project)')
  console.log('  3. import { StandaloneFlamegraph } from "speedscope"')
}

buildLib().catch(err => {
  console.error('Build failed:', err)
  process.exit(1)
})
