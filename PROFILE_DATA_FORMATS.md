# Profile Data Formats for StandaloneFlamegraph

The `StandaloneFlamegraph` component accepts profile data in multiple formats. This document describes all supported formats.

## Type Signature

```typescript
profileData?: Profile | ProfileGroup | string | ArrayBuffer
```

## Format Types

### 1. **Profile Object** (Pre-parsed speedscope Profile)

If you already have a speedscope `Profile` object, you can pass it directly:

```typescript
import { Profile } from '@frankchen029/speedscope'

const profile: Profile = // ... your profile instance
<StandaloneFlamegraph profileData={profile} />
```

### 2. **ProfileGroup Object** (Pre-parsed speedscope ProfileGroup)

A group of multiple profiles:

```typescript
import { ProfileGroup } from '@frankchen029/speedscope'

const profileGroup: ProfileGroup = {
  name: 'My Profiles',
  indexToView: 0,
  profiles: [profile1, profile2, ...]
}

<StandaloneFlamegraph profileData={profileGroup} />
```

### 3. **String** (JSON or text format)

Pass raw profile data as a string. The component will auto-detect the format:

```typescript
// From a JSON file
const jsonString = await fetch('/profile.json').then(r => r.text())
<StandaloneFlamegraph profileData={jsonString} fileName="profile.json" />

// From a collapsed stack file
const collapsedStack = `
main;foo;bar 10
main;foo;baz 5
`
<StandaloneFlamegraph
  profileData={collapsedStack}
  fileName="profile.collapsedstack.txt"
/>
```

### 4. **ArrayBuffer** (Binary or compressed data)

For binary formats or compressed profiles:

```typescript
// From a file input
const file = event.target.files[0]
const buffer = await file.arrayBuffer()
<StandaloneFlamegraph profileData={buffer} fileName={file.name} />

// From a fetch
const buffer = await fetch('/profile.pprof').then(r => r.arrayBuffer())
<StandaloneFlamegraph profileData={buffer} fileName="profile.pprof" />
```

## Supported Profile Formats

The component automatically detects and imports these formats:

### Browser Profilers

#### Chrome DevTools

- **CPU Profile** (`.cpuprofile`)
  ```json
  {
    "nodes": [...],
    "samples": [...],
    "timeDeltas": [...]
  }
  ```
- **Heap Profile** (`.heapprofile`)

  ```json
  {
    "head": {...},
    "selfSize": 0
  }
  ```

- **Chrome Timeline** (`.chrome.json`)
  ```json
  {
    "traceEvents": [...]
  }
  ```

#### Firefox Profiler

```json
{
  "systemHost": {
    "name": "Firefox"
  },
  "threads": [...]
}
```

#### Safari

- **Timeline Profile** (`-recording.json`)
  ```json
  {
    "recording": {
      "sampleStackTraces": [...]
    }
  }
  ```

### Native Profilers

#### Linux perf

- **perf script output** (`.linux-perf.txt`)
  ```
  process 1234 12345.678901: cpu-clock:
      ffffffffa1234567 function_name+0x67 ([kernel])
      7f1234567890 main+0x10 (/usr/bin/app)
  ```

#### macOS Instruments

- **Deep Copy** (`.instruments.txt`)
  ```
  Call graph:
      Root	Symbol Name
      ...
  ```
- **Trace files** (`.trace` directories)

#### Valgrind/Callgrind

- **Callgrind format** (`callgrind.out.*`)
  ```
  # callgrind format
  events: Instructions
  fn=main
  0 100
  ```

### Language-Specific Profilers

#### Node.js / V8

- **--prof output** (`.v8log.json`)
  ```json
  {
    "code": [...],
    "functions": [...],
    "ticks": [...]
  }
  ```

#### Ruby (stackprof)

- **stackprof JSON** (`.stackprof.json`)
  ```json
  {
    "mode": "cpu",
    "frames": {...},
    "raw_timestamp_deltas": [...]
  }
  ```

#### Go (pprof)

- **pprof protobuf** (`.pprof`, `.pb.gz`)
  - Binary protobuf format (auto-detected)

#### Haskell (GHC)

- **GHC JSON Profile** (`.prof.json`)
  ```json
  {
    "rts_arguments": [...],
    "initial_capabilities": 4
  }
  ```

#### Papyrus (Elder Scrolls scripting)

- **Papyrus log** (`.log`)
  ```
  Stack_12345 log opened (PC)
  ...
  ```

### Generic Formats

#### Collapsed Stack Format (Brendan Gregg's FlameGraph)

- **Collapsed stacks** (`.collapsedstack.txt`)
  ```
  main;foo;bar 100
  main;foo;baz 50
  main;qux 25
  ```

#### Trace Event Format

- **Chrome Trace Event Format**
  ```json
  {
    "traceEvents": [
      {"ph": "B", "name": "function", "ts": 1000, ...},
      {"ph": "E", "name": "function", "ts": 2000, ...}
    ]
  }
  ```

#### Speedscope Native Format

- **speedscope JSON** (`.speedscope.json`)
  ```json
  {
    "$schema": "https://www.speedscope.app/file-format-schema.json",
    "shared": {
      "frames": [{"name": "main", "file": "app.js", "line": 10}]
    },
    "profiles": [
      {
        "type": "sampled",
        "name": "Profile",
        "unit": "milliseconds",
        "startValue": 0,
        "endValue": 1000,
        "samples": [[0], [0, 1]],
        "weights": [100, 50]
      }
    ]
  }
  ```

## Complete Examples

### Example 1: Loading from File Input

```tsx
import React, {useState} from 'react'
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

function ProfileUploader() {
  const [profileData, setProfileData] = useState<ArrayBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const buffer = await file.arrayBuffer()
      setProfileData(buffer)
      setFileName(file.name)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".json,.txt,.cpuprofile,.heapprofile,.pprof"
      />
      {profileData && (
        <StandaloneFlamegraph
          profileData={profileData}
          fileName={fileName}
          width="100%"
          height={600}
          onProfileLoad={profile => {
            console.log('Loaded profile:', profile.getName())
            console.log('Total weight:', profile.getTotalWeight())
          }}
          onError={error => {
            console.error('Failed to load profile:', error)
          }}
        />
      )}
    </div>
  )
}
```

### Example 2: Loading from URL

```tsx
import React, {useEffect, useState} from 'react'
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

function RemoteProfile({url}: {url: string}) {
  const [profileData, setProfileData] = useState<string | null>(null)

  useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then(setProfileData)
      .catch(console.error)
  }, [url])

  if (!profileData) return <div>Loading...</div>

  return (
    <StandaloneFlamegraph
      profileData={profileData}
      fileName={url.split('/').pop() || 'profile.json'}
      width="100%"
      height={800}
    />
  )
}
```

### Example 3: Generating Profile Programmatically

```tsx
import React from 'react'
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

function GeneratedProfile() {
  // Create a profile in speedscope's native format
  const profileData = JSON.stringify({
    $schema: 'https://www.speedscope.app/file-format-schema.json',
    shared: {
      frames: [{name: 'main'}, {name: 'init'}, {name: 'process'}, {name: 'compute'}],
    },
    profiles: [
      {
        type: 'sampled',
        name: 'Generated Profile',
        unit: 'milliseconds',
        startValue: 0,
        endValue: 1000,
        samples: [
          [0], // main
          [0, 1], // main -> init
          [0, 2], // main -> process
          [0, 2, 3], // main -> process -> compute
          [0, 2], // main -> process
          [0], // main
        ],
        weights: [100, 50, 150, 200, 100, 50],
      },
    ],
  })

  return <StandaloneFlamegraph profileData={profileData} fileName="generated.speedscope.json" />
}
```

### Example 4: Collapsed Stack Format

```tsx
import React from 'react'
import {StandaloneFlamegraph} from '@frankchen029/speedscope'

function CollapsedStackProfile() {
  const profileData = `
main 1000
main;init 500
main;process 3000
main;process;compute 2000
main;process;render 1000
main;cleanup 500
  `.trim()

  return (
    <StandaloneFlamegraph
      profileData={profileData}
      fileName="profile.collapsedstack.txt"
      width={1200}
      height={600}
    />
  )
}
```

## File Name Hints

The `fileName` prop helps the auto-detection logic. Use these naming conventions:

| Format              | Recommended File Name Pattern      |
| ------------------- | ---------------------------------- |
| Chrome CPU Profile  | `*.cpuprofile` or `Profile-*.json` |
| Chrome Heap Profile | `*.heapprofile`                    |
| Chrome Timeline     | `*.chrome.json` or `Trace-*.json`  |
| Firefox             | `*.firefox.json`                   |
| Safari              | `*-recording.json`                 |
| Linux perf          | `*.linux-perf.txt`                 |
| Instruments         | `*.instruments.txt`                |
| Callgrind           | `callgrind.*`                      |
| stackprof           | `*.stackprof.json`                 |
| V8 log              | `*.v8log.json`                     |
| Collapsed stack     | `*.collapsedstack.txt`             |
| pprof               | `*.pprof` or `*.pb.gz`             |
| pmcstat             | `*.pmcstat.graph`                  |
| Speedscope          | `*.speedscope.json`                |

## Error Handling

```tsx
<StandaloneFlamegraph
  profileData={data}
  onError={error => {
    if (error.message.includes('No profiles found')) {
      console.error('Unsupported or empty profile format')
    } else {
      console.error('Profile loading error:', error)
    }
  }}
/>
```

## TypeScript Types

```typescript
import type {Profile, ProfileGroup, Frame, CallTreeNode} from '@frankchen029/speedscope'

// Access profile data
function analyzeProfile(profile: Profile) {
  const name = profile.getName()
  const totalWeight = profile.getTotalWeight()
  const frames: Frame[] = profile.getFrames()

  console.log(`Profile: ${name}`)
  console.log(`Total weight: ${totalWeight}`)
  console.log(`Frames: ${frames.length}`)
}
```

## References

- [Speedscope File Format Spec](https://www.speedscope.app/file-format-schema.json)
- [Chrome DevTools Protocol](https://chromaticpdf.com/protocol/Profiler/)
- [Firefox Profiler Format](https://github.com/firefox-devtools/profiler/blob/main/docs-developer/processed-profile-format.md)
- [Brendan Gregg's FlameGraph](http://www.brendangregg.com/flamegraphs.html)
- [Google pprof](https://github.com/google/pprof)
