import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

const baseUrl = import.meta.env.BASE_URL
const HLS_SOURCE = `${baseUrl}background/outputVideo.m3u8`
const START_CLIP_INDEX = 12

async function getStartTimeForClip(
  playlistUrl: string,
  clipIndex: number
): Promise<number> {
  if (clipIndex <= 0) return 0

  try {
    const response = await fetch(playlistUrl)
    if (!response.ok) return 0

    const playlist = await response.text()
    const lines = playlist.split('\n').map((line) => line.trim())
    let segmentCount = 0
    let startTime = 0

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]
      if (!line.startsWith('#EXTINF:')) continue

      const duration = Number.parseFloat(line.replace('#EXTINF:', '').replace(',', ''))
      if (Number.isNaN(duration)) continue

      if (segmentCount >= clipIndex) {
        return startTime
      }

      startTime += duration
      segmentCount += 1
    }
  } catch {
    return 0
  }

  return 0
}

type PlayerProps = {
  onFirstFrame?: () => void
}

export default function Player({ onFirstFrame }: PlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    let firstFrameNotified = false
    const handleFirstFrame = () => {
      if (firstFrameNotified) return
      firstFrameNotified = true
      onFirstFrame?.()
    }

    let hlsInstance: Hls | null = null
    let startTimeSeconds = 0
    const startTimePromise = getStartTimeForClip(HLS_SOURCE, START_CLIP_INDEX).then(
      (value) => {
        startTimeSeconds = value
      }
    )
    const restartPlayback = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = 0
      }
      hlsInstance?.startLoad(0)
      void video.play().catch(() => {})
    }
    const handleEnded = () => {
      restartPlayback()
    }
    const handleTimeUpdate = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return
      if (video.currentTime >= video.duration - 0.2) {
        restartPlayback()
      }
    }
    video.addEventListener('loadeddata', handleFirstFrame)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('timeupdate', handleTimeUpdate)

    if (Hls.isSupported()) {
      hlsInstance = new Hls()
      hlsInstance.loadSource(HLS_SOURCE)
      hlsInstance.attachMedia(video)
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, async () => {
        await startTimePromise
        if (startTimeSeconds > 0) {
          hlsInstance?.startLoad(startTimeSeconds)
          video.currentTime = startTimeSeconds
        }
        void video.play().catch(() => {})
      })
      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hlsInstance?.destroy()
          hlsInstance = null
        }
      })

      return () => {
        video.removeEventListener('loadeddata', handleFirstFrame)
        video.removeEventListener('ended', handleEnded)
        video.removeEventListener('timeupdate', handleTimeUpdate)
        hlsInstance?.destroy()
        hlsInstance = null
      }
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_SOURCE
      const handleLoadedMetadata = async () => {
        await startTimePromise
        if (startTimeSeconds > 0) {
          video.currentTime = startTimeSeconds
        }
        void video.play().catch(() => {})
      }
      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('loadeddata', handleFirstFrame)
        video.removeEventListener('ended', handleEnded)
        video.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }

    // No fallback source: keep player HLS-only.

    return () => {
      video.removeEventListener('loadeddata', handleFirstFrame)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [onFirstFrame])

  return (
    <video
      ref={ref}
      className="background-video"
      autoPlay
      muted
      loop
      playsInline
      controls={false}
    />
  )
}
