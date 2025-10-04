# 🏗️ Speedscope Build Guide

Complete guide for building the speedscope project.

---

## 📦 Quick Reference

| Command | Purpose | Output |
|---------|---------|--------|
| `npm run serve` | Development server | http://localhost:8000 |
| `npm run build` | Production build (standalone app) | `dist/release/` |
| `npm run build:lib` | Library build (for npm) | `dist/lib/` |
| `npm run typecheck` | Type checking only | No output |
| `npm test` | Run all tests | Test results |

---

## 🚀 Build Commands

### 1. **Development Build**

Start the development server with hot reload:

```bash
npm run serve
```

**What it does:**
- Starts dev server at http://localhost:8000
- Watches for file changes
- Auto-reloads on save
- No minification (faster builds)

**When to use:** During development

---

### 2. **Production Build (Standalone App)**

Build the complete speedscope application:

```bash
npm run build
# or
npm run prepack
```

**What it does:**
- Cleans `dist/release/` directory
- Bundles with esbuild
- Minifies JavaScript and CSS
- Generates `index.html`
- Creates release info (git commit, date, version)
- Generates JSON schema for file format
- Copies licenses

**Output:** `dist/release/` containing:
- `index.html` - Main HTML file
- `speedscope-[hash].js` - Bundled JavaScript
- `speedscope-[hash].css` - Bundled CSS
- `release.txt` - Build metadata
- `file-format-schema.json` - Format schema
- License files

**When to use:** 
- Deploying to a website
- Creating a release
- Packaging for distribution

**Custom output:**
```bash
# Build for web deployment
./scripts/prepack.sh --outdir dist/web --protocol http

# Build for local file:// usage
./scripts/prepack.sh --outdir dist/local --protocol file
```

---

### 3. **Library Build (For NPM Package)** ⭐ NEW

Build speedscope as a library for use in other projects:

```bash
npm run build:lib
```

**What it does:**
- Builds CommonJS bundle (`index.js`)
- Builds ES Module bundle (`index.esm.js`)
- Builds standalone component (`standalone.js`, `standalone.esm.js`)
- Copies CSS and font assets
- Externalizes React/ReactDOM (peer dependencies)

**Output:** `dist/lib/` containing:
- `index.js` - CommonJS main export
- `index.esm.js` - ESM main export
- `standalone.js` - Standalone component (CommonJS)
- `standalone.esm.js` - Standalone component (ESM)
- `assets/` - CSS and fonts

**When to use:**
- Publishing to npm
- Using in another React project
- Integrating flamegraph into existing apps

**How to use the built library:**

```bash
# In speedscope directory
npm run build:lib
npm link

# In your project
npm link speedscope
```

Then in your code:
```tsx
import {StandaloneFlamegraph} from 'speedscope'
// or
import {ChronoFlamechartView} from 'speedscope'
```

---

## 🔧 Other Build Commands

### Type Checking

Check TypeScript types without building:

```bash
npm run typecheck
```

### Code Formatting

Format all TypeScript files:

```bash
npm run prettier
```

### Linting

Lint all TypeScript files:

```bash
npm run lint
```

### Testing

Run tests:

```bash
# Run all tests
npm test

# Run only unit tests
npm run jest

# Run tests with coverage
npm run coverage
```

---

## 📁 Build Output Structure

### After `npm run build`:
```
dist/release/
├── index.html
├── speedscope-[hash].js
├── speedscope-[hash].css
├── speedscope-[hash].js.map
├── [other-chunk]-[hash].js
├── assets/
│   ├── SourceCodePro-Regular-[hash].woff2
│   └── favicon-[hash].png
├── release.txt
├── file-format-schema.json
└── source-code-pro.LICENSE.md
```

### After `npm run build:lib`:
```
dist/lib/
├── index.js                  # CommonJS main
├── index.esm.js             # ESM main
├── standalone.js            # Standalone CommonJS
├── standalone.esm.js        # Standalone ESM
├── index.js.map
├── index.esm.js.map
├── standalone.js.map
├── standalone.esm.js.map
└── assets/
    ├── reset.css
    ├── source-code-pro.css
    └── source-code-pro/
        ├── LICENSE.md
        └── SourceCodePro-Regular.ttf.woff2
```

---

## 🛠️ Build Technologies

- **Bundler:** esbuild (fast JavaScript bundler)
- **TypeScript:** For type checking
- **React:** UI framework
- **Aphrodite:** CSS-in-JS for styling
- **WebGL:** For flamegraph rendering

---

## 🔍 Build Options Explained

### Protocol Option

When building, you can specify `--protocol`:

**`--protocol http`** (for web deployment):
- Uses ES modules
- Enables code splitting
- Supports `import` statements
- **Use when:** Deploying to web server

**`--protocol file`** (for local files):
- Uses IIFE (Immediately Invoked Function Expression)
- No code splitting
- Works with `file://` URLs
- **Use when:** Opening `index.html` directly from filesystem

---

## 📦 Publishing as NPM Package

To publish speedscope as a library:

### Step 1: Update package.json

```json
{
  "name": "speedscope",
  "version": "1.23.1",
  "main": "dist/lib/index.js",
  "module": "dist/lib/index.esm.js",
  "types": "dist/lib/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/lib/index.esm.js",
      "require": "./dist/lib/index.js"
    },
    "./standalone": {
      "import": "./dist/lib/standalone.esm.js",
      "require": "./dist/lib/standalone.js"
    }
  },
  "files": [
    "dist/lib/**/*",
    "bin/cli.mjs"
  ],
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Step 2: Build and Generate Types

```bash
# Build the library
npm run build:lib

# Generate TypeScript declarations
npx tsc --declaration --emitDeclarationOnly --outDir dist/lib
```

### Step 3: Test Locally

```bash
# In speedscope directory
npm link

# In your test project
npm link speedscope
```

### Step 4: Publish

```bash
npm publish
```

---

## 🐛 Troubleshooting

### Build fails with "Cannot find module"
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Run type check to see all errors
npm run typecheck
```

### Build is slow
```bash
# Use development build instead
npm run serve
```

### Library build missing files
```bash
# Check if assets exist
ls -la assets/

# Rebuild
npm run build:lib
```

---

## 💡 Tips

1. **Development:** Always use `npm run serve` for faster iteration
2. **Testing builds:** Use `npm run build` before committing
3. **Library changes:** Run `npm run build:lib` after modifying exports
4. **Type safety:** Run `npm run typecheck` frequently
5. **Clean builds:** Delete `dist/` if you encounter caching issues

---

## 🔗 Related Files

- `scripts/build-release.ts` - Production build script
- `scripts/build-lib.ts` - Library build script
- `scripts/esbuild-shared.ts` - Shared esbuild configuration
- `scripts/prepack.sh` - Build orchestration script
- `tsconfig.json` - TypeScript configuration

