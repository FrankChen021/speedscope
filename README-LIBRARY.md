# @frankchen029/speedscope - React Flamegraph Component

Interactive flamegraph visualization component for React applications. This is a React conversion of the original Preact-based speedscope.

[![npm version](https://img.shields.io/npm/v/@frankchen029/speedscope.svg)](https://www.npmjs.com/package/@frankchen029/speedscope)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @frankchen029/speedscope
```

**Peer Dependencies**: Requires React ≥16.8.0 and ReactDOM ≥16.8.0

```bash
npm install react react-dom
```

## Quick Start

### Using the Standalone Component

The easiest way to get started is with the pre-configured `StandaloneFlamegraph` component:

```tsx
import React from 'react'
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

// Import required CSS files for proper styling
import '@frankchen029/speedscope/assets/reset.css'
import '@frankchen029/speedscope/assets/source-code-pro.css'

function App() {
  // Your profile data (JSON string, ArrayBuffer, Profile, or ProfileGroup)
  const profileData = fetchYourProfileData()

  return (
    <div style={{width: '100%', height: '100vh'}}>
      <StandaloneFlamegraph
        profileData={profileData}
        width="100%"
        height="100%"
        fileName="profile.json"
      />
    </div>
  )
}
```

**Important**:

- Always wrap the component in a container with defined dimensions
- Import the CSS files for proper font rendering and styling
- Set explicit `width` and `height` props or ensure the parent container has defined dimensions

### Supported Profile Formats

The component automatically detects and imports profiles from:

- **Chrome/V8**: `.cpuprofile`, `.heapprofile`, Chrome Timeline JSON
- **Firefox**: Firefox Profiler JSON
- **Safari**: Safari Timeline JSON
- **Node.js**: `--prof` output, V8 log files
- **Linux**: `perf script` output
- **Instruments**: `.trace` files (macOS)
- **Callgrind**: Valgrind/Cachegrind output
- **pprof**: Go pprof format
- **Stackprof**: Ruby stackprof JSON
- **And many more...**

### Props

#### `StandaloneFlamegraph`

| Prop            | Type                                               | Required | Description                                        |
| --------------- | -------------------------------------------------- | -------- | -------------------------------------------------- |
| `profileData`   | `Profile \| ProfileGroup \| string \| ArrayBuffer` | Yes      | Profile data to visualize                          |
| `width`         | `number \| string`                                 | No       | Width of the component (default: '100%')           |
| `height`        | `number \| string`                                 | No       | Height of the component (default: '100%')          |
| `fileName`      | `string`                                           | No       | Name of the profile file (default: 'profile.json') |
| `onProfileLoad` | `(profile: Profile) => void`                       | No       | Callback when profile is loaded                    |
| `onError`       | `(error: Error) => void`                           | No       | Callback when an error occurs                      |

## Advanced Usage

### Using Individual Components

For more control, you can use the individual components:

```tsx
import React from 'react'
import {
  ChronoFlamechartView,
  ThemeProvider,
  ProfileSearchContextProvider,
} from '@frankchen029/speedscope'

function App() {
  return (
    <ThemeProvider>
      <ProfileSearchContextProvider>
        <ChronoFlamechartView
          activeProfileState={myActiveProfileState}
          // ... other props
        />
      </ProfileSearchContextProvider>
    </ThemeProvider>
  )
}
```

### Available Components

- `StandaloneFlamegraph` - Pre-configured component (recommended)
- `ChronoFlamechartView` - Timeline view (chronological order)
- `LeftHeavyFlamechartView` - Left-heavy view (sorted by weight)
- `SandwichViewContainer` - Sandwich view (caller/callee analysis)
- `FlamechartView` - Base flamechart component
- `FlamechartPanZoomView` - Interactive pan/zoom flamechart
- `FlamechartMinimapView` - Minimap overview
- `FlamechartDetailView` - Detail view for selected nodes

### Context Providers

- `ThemeProvider` - Provides light/dark theme support
- `ProfileSearchContextProvider` - Enables search functionality
- `FlamechartSearchContextProvider` - Flamechart-specific search

### Utilities

```tsx
import {
  importProfileGroupFromText,
  importProfilesFromArrayBuffer,
  importProfileGroupFromBase64,
} from '@frankchen029/speedscope'

// Import from text
const profileGroup = await importProfileGroupFromText('profile.json', jsonText)

// Import from ArrayBuffer
const profileGroup = await importProfilesFromArrayBuffer('profile.bin', buffer)
```

## Examples

### Loading from File Input

```tsx
import React, {useState} from 'react'
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

function ProfileViewer() {
  const [profileData, setProfileData] = useState<ArrayBuffer | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const buffer = await file.arrayBuffer()
      setProfileData(buffer)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {profileData && <StandaloneFlamegraph profileData={profileData} width="100%" height={600} />}
    </div>
  )
}
```

### Loading from URL

```tsx
import React, {useEffect, useState} from 'react'
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

function RemoteProfileViewer() {
  const [profileData, setProfileData] = useState<string | null>(null)

  useEffect(() => {
    fetch('https://example.com/profile.json')
      .then(res => res.text())
      .then(setProfileData)
  }, [])

  if (!profileData) return <div>Loading...</div>

  return <StandaloneFlamegraph profileData={profileData} width={1200} height={800} />
}
```

### Custom Error Handling

```tsx
import React, {useState} from 'react'
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

function ProfileWithErrorHandling() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      {error && <div style={{color: 'red'}}>Error: {error}</div>}
      <StandaloneFlamegraph
        profileData={myData}
        onError={err => setError(err.message)}
        onProfileLoad={profile => {
          console.log('Profile loaded:', profile.getName())
          setError(null)
        }}
      />
    </div>
  )
}
```

## TypeScript Support

Full TypeScript definitions are included:

```tsx
import {
  Profile,
  ProfileGroup,
  Frame,
  CallTreeNode,
  FlamechartViewState,
  ActiveProfileState,
} from '@frankchen029/speedscope'

// Type-safe profile manipulation
function analyzeProfile(profile: Profile) {
  const totalWeight = profile.getTotalWeight()
  const frames = profile.getFrames()
  // ...
}
```

## Styling

The component includes its own styles via CSS-in-JS (Aphrodite). No additional CSS imports needed.

For custom theming:

```tsx
import {ThemeProvider, lightTheme, darkTheme} from '@frankchen029/speedscope'

function App() {
  const [theme, setTheme] = useState(lightTheme)

  return (
    <ThemeProvider theme={theme}>
      <StandaloneFlamegraph profileData={data} />
    </ThemeProvider>
  )
}
```

## Performance

The component uses WebGL for rendering, providing smooth performance even with large profiles containing thousands of stack frames.

**Recommended**:

- Profile size: < 100MB
- Stack depth: < 500 levels
- Total samples: < 1M samples

## Browser Support

- Chrome/Edge: ≥65
- Firefox: ≥59
- Safari: ≥11.1

Requires WebGL support.

## Contributing

This is a React conversion of the original [speedscope](https://github.com/jlfwong/speedscope) project.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Credits

- Original speedscope: [jlfwong/speedscope](https://github.com/jlfwong/speedscope)
- React conversion: [FrankChen021](https://github.com/FrankChen021)

## Links

- [GitHub Repository](https://github.com/FrankChen021/speedscope)
- [npm Package](https://www.npmjs.com/package/@frankchen029/speedscope)
- [Original speedscope](https://www.speedscope.app)
- [Issue Tracker](https://github.com/FrankChen021/speedscope/issues)
