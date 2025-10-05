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

import {memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {searchIsActiveAtom, searchQueryAtom} from './app-state'
import {ActiveProfileState} from './app-state/active-profile-state'
import {
  createGetColorBucketForFrame,
  createGetCSSColorForFrame,
  getCanvasContext,
  getFrameToColorBucket,
} from './app-state/getters'
import {importProfileGroupFromText, importProfilesFromArrayBuffer} from './import'
import {useAtom} from './lib/atom'
import {Rect, Vec2} from './lib/math'
import {CallTreeNode, Profile, ProfileGroup} from './lib/profile'
import {ProfileSearchResults} from './lib/profile-search'
import {FlamechartSearchContextProvider} from './views/flamechart-search-view'
import {FlamechartView} from './views/flamechart-view'
import {
  createMemoizedFlamechartRenderer,
  getChronoViewFlamechart,
} from './views/flamechart-view-container'
import {ProfileSearchContext} from './views/search-view'
import {ThemeContext, useTheme} from './views/themes/theme'
import {lightTheme} from './views/themes/light-theme'
import {darkTheme} from './views/themes/dark-theme'

// Standalone ProfileSearchContextProvider that doesn't rely on global app state
const StandaloneProfileSearchContextProvider = ({
  profile,
  children,
}: {
  profile: Profile | null
  children: React.ReactNode
}) => {
  const searchIsActive = useAtom(searchIsActiveAtom)
  const searchQuery = useAtom(searchQueryAtom)

  const searchResults = useMemo(() => {
    if (!profile || !searchIsActive || searchQuery.length === 0) {
      return null
    }
    return new ProfileSearchResults(profile, searchQuery)
  }, [searchIsActive, searchQuery, profile])

  return (
    <ProfileSearchContext.Provider value={searchResults}>{children}</ProfileSearchContext.Provider>
  )
}

// Wrapper component that provides custom setters for standalone use
const StandaloneChronoFlamechartView = memo(
  ({
    activeProfileState,
    glCanvas,
    canvasContext,
    onViewportChange,
    onLogicalSpaceSizeChange,
    onNodeSelect,
    onNodeHover,
    onUserInteraction,
  }: {
    activeProfileState: ActiveProfileState
    glCanvas: HTMLCanvasElement
    canvasContext: ReturnType<typeof getCanvasContext>
    onViewportChange: (rect: Rect) => void
    onLogicalSpaceSizeChange: (size: Vec2) => void
    onNodeSelect: (node: CallTreeNode | null) => void
    onNodeHover: (hover: {node: CallTreeNode; event: MouseEvent} | null) => void
    onUserInteraction: () => void
  }) => {
    const {profile, chronoViewState} = activeProfileState
    const theme = useTheme()
    const logicalSpaceSizeInitialized = useRef(false)

    // Memoize all computed values to prevent infinite loops
    const frameToColorBucket = useMemo(() => getFrameToColorBucket(profile), [profile])
    const getColorBucketForFrame = useMemo(
      () => createGetColorBucketForFrame(frameToColorBucket),
      [frameToColorBucket],
    )
    const getCSSColorForFrame = useMemo(
      () => createGetCSSColorForFrame({theme, frameToColorBucket}),
      [theme, frameToColorBucket],
    )

    const flamechart = useMemo(
      () => getChronoViewFlamechart({profile, getColorBucketForFrame}),
      [profile, getColorBucketForFrame],
    )

    const getChronoViewFlamechartRenderer = useMemo(() => createMemoizedFlamechartRenderer(), [])
    const flamechartRenderer = useMemo(
      () =>
        getChronoViewFlamechartRenderer({
          canvasContext,
          flamechart,
        }),
      [getChronoViewFlamechartRenderer, canvasContext, flamechart],
    )

    // Helper function to calculate max depth
    const getMaxDepth = useCallback((node: any, depth = 0): number => {
      if (!node.children || node.children.length === 0) return depth
      return Math.max(...node.children.map((child: any) => getMaxDepth(child, depth + 1)))
    }, [])

    // Create custom setters that update our local state
    // These MUST be memoized to prevent infinite loops
    const setConfigSpaceViewportRect = useCallback(
      (rect: Rect) => {
        // Notify parent that user is interacting
        onUserInteraction()

        // Constrain viewport to prevent scrolling above the top frame
        // Use the same offset as initial viewport to maintain consistency
        const minY = VIEWPORT_CONFIG.AXIS_LABEL_SPACE

        // Clamp the Y origin to prevent over-scrolling, but allow zoom changes to X and size
        const clampedRect = new Rect(
          new Vec2(rect.origin.x, Math.max(rect.origin.y, minY)),
          rect.size,
        )

        onViewportChange(clampedRect)
      },
      [onViewportChange, onUserInteraction],
    )

    const setNodeHover = useCallback(
      (hover: {node: CallTreeNode; event: MouseEvent} | null) => {
        onNodeHover(hover)
      },
      [onNodeHover],
    )

    const setSelectedNode = useCallback(
      (node: CallTreeNode | null) => {
        onNodeSelect(node)
      },
      [onNodeSelect],
    )

    const setLogicalSpaceViewportSize = useCallback(
      (size: Vec2) => {
        // Only set the logical space size once to prevent viewport resizing loops
        if (!logicalSpaceSizeInitialized.current && !size.equals(Vec2.zero)) {
          logicalSpaceSizeInitialized.current = true
          onLogicalSpaceSizeChange(size)
        }
      },
      [onLogicalSpaceSizeChange],
    )

    return (
      <FlamechartSearchContextProvider
        flamechart={flamechart}
        selectedNode={chronoViewState.selectedNode}
        setSelectedNode={setSelectedNode}
        configSpaceViewportRect={chronoViewState.configSpaceViewportRect}
        setConfigSpaceViewportRect={setConfigSpaceViewportRect}
      >
        <FlamechartView
          theme={theme}
          renderInverted={false}
          flamechart={flamechart}
          flamechartRenderer={flamechartRenderer}
          canvasContext={canvasContext}
          getCSSColorForFrame={getCSSColorForFrame}
          {...chronoViewState}
          setConfigSpaceViewportRect={setConfigSpaceViewportRect}
          setNodeHover={setNodeHover}
          setSelectedNode={setSelectedNode}
          setLogicalSpaceViewportSize={setLogicalSpaceViewportSize}
        />
      </FlamechartSearchContextProvider>
    )
  },
)

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

// Viewport configuration constants
const VIEWPORT_CONFIG = {
  // Y offset to leave space above the top frame for axis labels
  // Y coordinate system: y=0 is the top (root frame)
  // The smaller the value, the more space between the top frame and the axis labels
  AXIS_LABEL_SPACE: -1.5,

  // Maximum number of stack levels to show in viewport for consistent display
  // Reduce this number can increase the height of each method in the flamegraph
  MAX_VISIBLE_DEPTH: 24,
} as const

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
  const [canvasReady, setCanvasReady] = useState(false)
  const [viewportRect, setViewportRect] = useState<Rect | null>(null)
  const [logicalSpaceSize, setLogicalSpaceSize] = useState<Vec2>(Vec2.zero)
  const [selectedNode, setSelectedNode] = useState<CallTreeNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<{node: CallTreeNode; event: MouseEvent} | null>(
    null,
  )
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const theme$ = useTheme()
  const canvasContextRef = useRef<ReturnType<typeof getCanvasContext> | null>(null)

  // Track previous profile bounds for viewport expansion
  const [profileBounds, setProfileBounds] = useState<{
    totalWeight: number
    maxDepth: number
  } | null>(null)

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

  // Track profile bounds for viewport expansion calculations
  useEffect(() => {
    if (!profile) return

    const currentTotalWeight = profile.getTotalWeight()
    const getMaxDepth = (node: any, depth = 0): number => {
      if (!node.children || node.children.length === 0) return depth
      return Math.max(...node.children.map((child: any) => getMaxDepth(child, depth + 1)))
    }
    const currentMaxDepth = getMaxDepth(profile.getAppendOrderCalltreeRoot())
    const currentBounds = {totalWeight: currentTotalWeight, maxDepth: currentMaxDepth}

    // Only update bounds if they actually changed
    if (
      !profileBounds ||
      currentTotalWeight !== profileBounds.totalWeight ||
      currentMaxDepth !== profileBounds.maxDepth
    ) {
      setProfileBounds(currentBounds)
    }
  }, [profile, profileBounds])

  // Initialize viewport rect when profile loads
  useEffect(() => {
    if (!profile) return

    const totalWeight = profile.getTotalWeight()

    // Configure viewport dimensions
    const viewportHeight = VIEWPORT_CONFIG.MAX_VISIBLE_DEPTH + 1.0
    const yOffset = VIEWPORT_CONFIG.AXIS_LABEL_SPACE

    if (!viewportRect) {
      // First time initialization
      const initialRect = new Rect(new Vec2(0, yOffset), new Vec2(totalWeight, viewportHeight))
      setViewportRect(initialRect)
    } else {
      // Profile updated with new data - expand viewport to include new data while preserving zoom level
      const currentZoomLevel = viewportRect.size.x / (profileBounds?.totalWeight || totalWeight)
      const newViewportWidth = totalWeight * currentZoomLevel

      const expandedRect = new Rect(
        new Vec2(viewportRect.origin.x, yOffset),
        new Vec2(Math.min(newViewportWidth, totalWeight), viewportHeight),
      )

      setViewportRect(expandedRect)
    }
  }, [profile, profileBounds])

  // Create active profile state
  const activeProfileState = useMemo((): ActiveProfileState | null => {
    if (!profile || !viewportRect) return null

    return {
      profile,
      index: 0,
      chronoViewState: {
        hover: hoveredNode,
        selectedNode: selectedNode,
        configSpaceViewportRect: viewportRect,
        logicalSpaceViewportSize: logicalSpaceSize,
      },
      leftHeavyViewState: {
        hover: hoveredNode,
        selectedNode: selectedNode,
        configSpaceViewportRect: viewportRect,
        logicalSpaceViewportSize: logicalSpaceSize,
      },
      sandwichViewState: {
        callerCallee: null,
      },
    }
  }, [profile, viewportRect, logicalSpaceSize, selectedNode, hoveredNode])

  // Set canvas size and ready flag - run after profile is loaded
  useLayoutEffect(() => {
    // Only initialize canvas once profile is loaded
    if (!profile || !activeProfileState) {
      return
    }

    const canvas = canvasRef.current
    const container = containerRef.current

    if (canvas && container) {
      // Only create canvas context once
      if (!canvasContextRef.current) {
        // Create canvas context and initialize WebGL
        const ctx = getCanvasContext({theme: theme$, canvas})

        // Wrap renderBehind to convert viewport coordinates to canvas coordinates
        const originalRenderBehind = ctx.renderBehind.bind(ctx)
        ctx.renderBehind = (el: Element, cb: () => void) => {
          const elBounds = el.getBoundingClientRect()
          const canvasBounds = canvas.getBoundingClientRect()

          // Convert viewport-relative element bounds to canvas-relative bounds
          const adjustedBounds = new DOMRect(
            elBounds.left - canvasBounds.left,
            elBounds.top - canvasBounds.top,
            elBounds.width,
            elBounds.height,
          )

          // Create a proxy element with adjusted bounds
          const proxyEl = {
            getBoundingClientRect: () => adjustedBounds,
          } as Element

          originalRenderBehind(proxyEl, cb)
        }

        canvasContextRef.current = ctx
      }

      const ctx = canvasContextRef.current

      // Set canvas resolution to match container size
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      const widthInPixels = rect.width * dpr
      const heightInPixels = rect.height * dpr

      // Initialize logical space size once based on actual container size
      if (logicalSpaceSize.equals(Vec2.zero)) {
        setLogicalSpaceSize(new Vec2(rect.width, rect.height))
      }

      // IMPORTANT: Call WebGL resize to set up the viewport properly
      ctx.gl.resize(widthInPixels, heightInPixels, rect.width, rect.height)

      // IMPORTANT: Request first frame to trigger rendering
      ctx.requestFrame()

      setCanvasReady(true)
    }
  }, [profile, activeProfileState, theme$, logicalSpaceSize])

  if (error) {
    return (
      <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: 'red'}}>Error loading profile: {error.message}</div>
      </div>
    )
  }

  if (!profile || !activeProfileState) {
    return (
      <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div>Loading profile...</div>
      </div>
    )
  }

  // Force the theme based on the prop instead of using system preferences
  const forcedTheme = theme === 'light' ? lightTheme : darkTheme

  return (
    <ThemeContext.Provider value={forcedTheme}>
      <StandaloneProfileSearchContextProvider profile={profile}>
        <div
          ref={containerRef}
          style={{
            width,
            height,
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Source Code Pro", Courier, monospace',
            fontSize: '10px',
            lineHeight: '20px',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: -1,
              pointerEvents: 'none',
            }}
          />
          {canvasReady && canvasRef.current && activeProfileState && canvasContextRef.current && (
            <StandaloneChronoFlamechartView
              activeProfileState={activeProfileState}
              glCanvas={canvasRef.current}
              canvasContext={canvasContextRef.current}
              onViewportChange={setViewportRect}
              onLogicalSpaceSizeChange={setLogicalSpaceSize}
              onNodeSelect={setSelectedNode}
              onNodeHover={setHoveredNode}
              onUserInteraction={() => {}} // No-op for now
            />
          )}
        </div>
      </StandaloneProfileSearchContextProvider>
    </ThemeContext.Provider>
  )
}
