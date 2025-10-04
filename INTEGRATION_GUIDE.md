# Speedscope Flamegraph Integration Guide

This guide explains how to use the speedscope flamegraph component in your own React application.

## 📦 Component Architecture

### Core Components (in order of abstraction):

1. **`FlamechartPanZoomView`** - Low-level rendering component

   - File: `src/views/flamechart-pan-zoom-view.tsx`
   - Uses WebGL for efficient rendering
   - Handles all mouse interactions, zooming, panning
   - **Most complex** - not recommended for direct use

2. **`FlamechartView`** - Mid-level wrapper

   - File: `src/views/flamechart-view.tsx`
   - Adds minimap, search bar, detail view
   - Still requires manual setup

3. **`ChronoFlamechartView`** - High-level container (RECOMMENDED)

   - File: `src/views/flamechart-view-container.tsx`
   - **Lines 112-150**: Main flamegraph component
   - Handles data processing and rendering
   - **This is what renders the flamegraph after file upload**

4. **`StandaloneFlamegraph`** - Easiest integration (NEW)
   - File: `src/standalone-flamegraph.tsx`
   - Pre-configured, batteries-included component
   - **Best for external projects**

---

## 🚀 Quick Start: Using in Another Project

### Step 1: Update `package.json`

Add the following to make speedscope work as a library:

```json
{
  "name": "speedscope",
  "version": "1.23.1",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./standalone": {
      "import": "./dist/standalone-flamegraph.esm.js",
      "require": "./dist/standalone-flamegraph.js",
      "types": "./dist/standalone-flamegraph.d.ts"
    }
  },
  "files": ["dist", "bin/cli.mjs"]
}
```

### Step 2: Build Script for Library

Create `scripts/build-lib.ts`:

```typescript
import * as esbuild from 'esbuild'
import * as fs from 'fs'

// Build main library
await esbuild.build({
  entryPoints: ['src/index.tsx'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  external: ['react', 'react-dom'],
  sourcemap: true,
})

// Build ESM version
await esbuild.build({
  entryPoints: ['src/index.tsx'],
  outfile: 'dist/index.esm.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  external: ['react', 'react-dom'],
  sourcemap: true,
})

// Build standalone component
await esbuild.build({
  entryPoints: ['src/standalone-flamegraph.tsx'],
  outfile: 'dist/standalone-flamegraph.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  external: ['react', 'react-dom'],
  sourcemap: true,
})

console.log('Library built successfully!')
```

Add to `package.json`:

```json
{
  "scripts": {
    "build:lib": "tsx scripts/build-lib.ts && tsc --emitDeclarationOnly --declaration --outDir dist"
  }
}
```

---

## 💻 Usage Examples

### Example 1: Standalone Component (Easiest)

```tsx
import {StandaloneFlamegraph} from 'speedscope/standalone'

function MyApp() {
  const [profileData, setProfileData] = useState(null)

  const handleFileUpload = async (file: File) => {
    const text = await file.text()
    setProfileData(text)
  }

  return (
    <div>
      <input type="file" onChange={e => handleFileUpload(e.target.files[0])} />

      {profileData && (
        <StandaloneFlamegraph
          profileData={profileData}
          fileName="profile.json"
          width="100%"
          height="600px"
          theme="dark"
          onProfileLoad={profile => console.log('Loaded:', profile)}
          onError={err => console.error('Error:', err)}
        />
      )}
    </div>
  )
}
```

### Example 2: Using ChronoFlamechartView Directly

```tsx
import {ChronoFlamechartView, ThemeProvider, ProfileSearchContextProvider} from 'speedscope'
import {useState, useRef, useEffect} from 'react'

function MyFlamegraph({activeProfileState}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <ThemeProvider>
      <ProfileSearchContextProvider>
        <div style={{position: 'relative', width: '100%', height: '600px'}}>
          <canvas ref={canvasRef} style={{position: 'absolute', width: '100%', height: '100%'}} />
          {canvasRef.current && (
            <ChronoFlamechartView
              activeProfileState={activeProfileState}
              glCanvas={canvasRef.current}
            />
          )}
        </div>
      </ProfileSearchContextProvider>
    </ThemeProvider>
  )
}
```

### Example 3: Importing and Parsing Profile Data

```tsx
import {importProfileGroupFromText, Profile} from 'speedscope'

async function loadProfile(fileContent: string, fileName: string): Promise<Profile> {
  const profileGroup = await importProfileGroupFromText(fileName, fileContent)

  if (!profileGroup || profileGroup.profiles.length === 0) {
    throw new Error('No profiles found')
  }

  return profileGroup.profiles[0].profile
}

// Usage
const profile = await loadProfile(jsonContent, 'my-profile.json')
```

---

## 🔧 Required Dependencies

Your project needs these peer dependencies:

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "aphrodite": "^2.1.0"
  }
}
```

---

## 📝 Key Points

### Where the Flamegraph Renders:

1. **File Upload Page** → `src/views/application.tsx` (lines 469-541)

   - Shows "Browse" button
   - Handles drag & drop

2. **After File Load** → `src/views/application.tsx` (lines 566-594)

   - Switches based on `viewMode`
   - Renders `ChronoFlamechartView` (line 583)
   - Or `LeftHeavyFlamechartView` (line 587)
   - Or `SandwichViewContainer` (line 591)

3. **Actual Rendering** → `FlamechartPanZoomView`
   - The WebGL canvas that draws the bars
   - Handles all interactions

### Component Hierarchy:

```
Application (application.tsx)
  └─> ChronoFlamechartView (flamechart-view-container.tsx)
       └─> FlamechartView (flamechart-view.tsx)
            ├─> FlamechartMinimapView (minimap)
            ├─> FlamechartPanZoomView (main chart)
            ├─> FlamechartSearchView (search bar)
            └─> FlamechartDetailView (details panel)
```

---

## 🎨 Customization

### Custom Theme:

```tsx
import { ThemeProvider } from 'speedscope'

const myTheme = {
  fgPrimaryColor: '#ffffff',
  bgPrimaryColor: '#1a1a1a',
  selectionPrimaryColor: '#ff6b6b',
  // ... see src/views/themes/theme.tsx for all options
}

<ThemeProvider theme={myTheme}>
  <ChronoFlamechartView {...props} />
</ThemeProvider>
```

### Control View Mode:

```tsx
// Three available modes:
// 1. CHRONO_FLAME_CHART - Time-ordered (what you see by default)
// 2. LEFT_HEAVY_FLAME_GRAPH - Sorted by weight
// 3. SANDWICH_VIEW - Table + callers/callees

import {LeftHeavyFlamechartView} from 'speedscope'

;<LeftHeavyFlamechartView activeProfileState={activeProfileState} glCanvas={canvas} />
```

---

## ⚠️ Important Notes

1. **WebGL Required**: The flamegraph uses WebGL for rendering. Ensure the browser supports it.

2. **Canvas Element**: Must provide a `<canvas>` element with WebGL context.

3. **Profile Data Format**: Speedscope supports multiple formats (Chrome, Firefox, Node.js, etc.)

   - See `src/import/index.ts` for all supported formats

4. **State Management**: The component uses internal atoms for state
   - For full control, you may need to fork and modify `src/app-state/`

---

## 📦 Publishing as NPM Package

```bash
# 1. Build the library
npm run build:lib

# 2. Test locally in another project
cd ../my-other-project
npm link ../speedscope

# 3. Publish
npm publish
```

Then use in other projects:

```bash
npm install speedscope
```

```tsx
import {StandaloneFlamegraph} from 'speedscope/standalone'
```
