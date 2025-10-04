/**
 * Standalone Flamegraph Component
 *
 * This is a simplified, standalone version of the flamegraph that can be easily
 * integrated into other React applications.
 *
 * Usage example:
 * ```tsx
 * import { StandaloneFlamegraph } from 'speedscope';
 *
 * function MyApp() {
 *   const [profileData, setProfileData] = useState(null);
 *
 *   return (
 *     <StandaloneFlamegraph
 *       profileData={profileData}
 *       width="100%"
 *       height="600px"
 *     />
 *   );
 * }
 * ```
 */

import {useState, useEffect, useRef, useMemo} from 'react'
import {ChronoFlamechartView} from './views/flamechart-view-container'
import {ThemeProvider} from './views/themes/theme'
import {ProfileSearchContextProvider} from './views/search-view'
import {Profile, ProfileGroup} from './lib/profile'
import {importProfileGroupFromText, importProfilesFromArrayBuffer} from './import'
import {ActiveProfileState} from './app-state/active-profile-state'
import {Vec2, Rect} from './lib/math'

export interface StandaloneFlamegraphProps {
  // Profile data - can be Profile object, ProfileGroup, or raw data
  profileData?: Profile | ProfileGroup | string | ArrayBuffer

  // Filename hint for parsing raw data
  fileName?: string

  // Dimensions
  width?: string | number
  height?: string | number

  // Theme
  theme?: 'light' | 'dark'

  // Callbacks
  onProfileLoad?: (profile: Profile) => void
  onError?: (error: Error) => void
}

export function StandaloneFlamegraph({
  profileData,
  fileName = 'profile.json',
  width = '100%',
  height = '600px',
  theme = 'light',
  onProfileLoad,
  onError,
}: StandaloneFlamegraphProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Parse profile data
  useEffect(() => {
    if (!profileData) return

    async function loadProfile() {
      try {
        let profileGroup: ProfileGroup | null = null

        if (!profileData) {
          throw new Error('Profile data is required')
        }

        if (typeof profileData === 'string') {
          // Raw text data (JSON, etc.)
          profileGroup = await importProfileGroupFromText(fileName, profileData)
        } else if (profileData instanceof ArrayBuffer) {
          // Binary data
          profileGroup = await importProfilesFromArrayBuffer(fileName, profileData)
        } else if ('profiles' in profileData) {
          // Already a ProfileGroup
          profileGroup = profileData as ProfileGroup
        } else {
          // Single Profile object
          const singleProfile = profileData as Profile
          setProfile(singleProfile)
          onProfileLoad?.(singleProfile)
          return
        }

        if (profileGroup && profileGroup.profiles.length > 0) {
          const firstProfile = profileGroup.profiles[0]
          setProfile(firstProfile)
          onProfileLoad?.(firstProfile)
        } else {
          throw new Error('No profiles found in data')
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
      }
    }

    loadProfile()
  }, [profileData, fileName, onProfileLoad, onError])

  // Create active profile state
  const activeProfileState = useMemo((): ActiveProfileState | null => {
    if (!profile) return null

    const totalWeight = profile.getTotalWeight()
    const totalHeight = profile.getTotalNonIdleWeight()

    return {
      profile,
      index: 0,
      chronoViewState: {
        hover: null,
        selectedNode: null,
        configSpaceViewportRect: new Rect(new Vec2(0, 0), new Vec2(totalWeight, totalHeight)),
        logicalSpaceViewportSize: new Vec2(800, 600),
      },
      leftHeavyViewState: {
        hover: null,
        selectedNode: null,
        configSpaceViewportRect: new Rect(new Vec2(0, 0), new Vec2(totalWeight, totalHeight)),
        logicalSpaceViewportSize: new Vec2(800, 600),
      },
      sandwichViewState: {
        callerCallee: null,
      },
    }
  }, [profile])

  if (error) {
    return (
      <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: 'red'}}>Error loading profile: {error.message}</div>
      </div>
    )
  }

  if (!profile || !activeProfileState || !canvasRef.current) {
    return (
      <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div>Loading profile...</div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <ProfileSearchContextProvider>
        <div style={{width, height, position: 'relative'}}>
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: -1,
            }}
          />
          <ChronoFlamechartView
            activeProfileState={activeProfileState}
            glCanvas={canvasRef.current}
          />
        </div>
      </ProfileSearchContextProvider>
    </ThemeProvider>
  )
}
