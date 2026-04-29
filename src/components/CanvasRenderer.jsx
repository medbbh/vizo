import { useEffect, useRef } from 'react'
import useEngineStore from '../store/engineStore'
import { ParticleEngine } from '../engine/ParticleEngine'
import { processImage } from '../engine/imageProcessor'
import { processVideoFrame } from '../engine/webcamProcessor'

export default function CanvasRenderer() {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const webcamFrameRef = useRef(null)
  const webcamLastFrameRef = useRef(0)
  const webcamAspectRatioRef = useRef(null)

  const imageData = useEngineStore((s) => s.imageData)
  const density = useEngineStore((s) => s.density)
  const sensitivity = useEngineStore((s) => s.sensitivity)
  const elasticity = useEngineStore((s) => s.elasticity)
  const friction = useEngineStore((s) => s.friction)
  const colorPalette = useEngineStore((s) => s.colorPalette)
  const charSet = useEngineStore((s) => s.charSet)
  const customChars = useEngineStore((s) => s.customChars)
  const webcamActive = useEngineStore((s) => s.webcamActive)
  const webcamFrozen = useEngineStore((s) => s.webcamFrozen)
  const setWebcamActive = useEngineStore((s) => s.setWebcamActive)
  const setWebcamAspectRatio = useEngineStore((s) => s.setWebcamAspectRatio)
  const setFps = useEngineStore((s) => s.setFps)
  const setParticleCount = useEngineStore((s) => s.setParticleCount)

  // Initialize engine once
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const engine = new ParticleEngine(canvas, {
      sensitivity, elasticity, friction, colorPalette,
    })
    engine.onFpsUpdate = setFps
    engine.onParticleCount = setParticleCount
    engineRef.current = engine

    function handleResize() {
      const w = container.clientWidth
      const h = container.clientHeight
      engine.resize(w, h)
    }

    handleResize()
    const ro = new ResizeObserver(handleResize)
    ro.observe(container)
    engine.start()

    return () => {
      ro.disconnect()
      engine.destroy()
    }
  }, []) // eslint-disable-line

  // Webcam stream lifecycle
  useEffect(() => {
    if (webcamActive) {
      startWebcam()
    } else {
      stopWebcam()
    }
    return () => stopWebcam()
  }, [webcamActive]) // eslint-disable-line

  // Pause/resume webcam frame updates on freeze
  useEffect(() => {
    if (!webcamActive) return
    if (webcamFrozen) {
      stopFrameLoop()
      engineRef.current?.updateConfig({ elasticity, friction })
    } else {
      startFrameLoop()
      engineRef.current?.updateConfig({ elasticity: Math.max(elasticity, 0.25), friction: 0.72 })
    }
  }, [webcamFrozen]) // eslint-disable-line

  async function startWebcam() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Webcam capture is not supported in this browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream

      const video = document.createElement('video')
      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      videoRef.current = video

      await new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', resolve, { once: true })
        video.addEventListener('error', reject, { once: true })
      })
      await video.play()
      updateWebcamAspectRatio(video.videoWidth / video.videoHeight)

      // Wait for an actual decoded frame
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      startFrameLoop()
    } catch {
      setWebcamActive(false)
    }
  }

  function stopWebcam() {
    stopFrameLoop()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current = null
    }
    webcamAspectRatioRef.current = null
    setWebcamAspectRatio(null)
  }

  function startFrameLoop() {
    stopFrameLoop()

    const tick = (time) => {
      const engine = engineRef.current
      const container = containerRef.current
      const video = videoRef.current
      if (!engine || !container || !video) {
        webcamFrameRef.current = requestAnimationFrame(tick)
        return
      }

      if (time - webcamLastFrameRef.current >= 80) {
        webcamLastFrameRef.current = time
        const result = processVideoFrame(video, density, charSet, customChars)
        if (result) {
          const w = container.clientWidth
          const h = container.clientHeight
          engine.storeRaw(result.particles)
          engine.updateParticles(result.particles, w, h, result.count)
          updateWebcamAspectRatio(result.aspect)
        }
      }

      webcamFrameRef.current = requestAnimationFrame(tick)
    }

    webcamFrameRef.current = requestAnimationFrame(tick)
  }

  function stopFrameLoop() {
    if (webcamFrameRef.current) {
      cancelAnimationFrame(webcamFrameRef.current)
      webcamFrameRef.current = null
    }
  }

  function updateWebcamAspectRatio(aspect) {
    if (!aspect || !Number.isFinite(aspect)) return
    if (Math.abs((webcamAspectRatioRef.current ?? 0) - aspect) < 0.01) return
    webcamAspectRatioRef.current = aspect
    setWebcamAspectRatio(aspect)
  }

  // Re-process image when image or sampling config changes
  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !imageData || !containerRef.current) return

    const container = containerRef.current
    const w = container.clientWidth
    const h = container.clientHeight

    const { particles } = processImage(imageData, density, charSet, customChars)
    engine.storeRaw(particles)
    engine.loadParticles(particles, w, h)
  }, [imageData, density, charSet, customChars])

  // Update frame loop params when settings change (webcam mode)
  useEffect(() => {
    if (webcamActive && !webcamFrozen) {
      startFrameLoop()
    }
  }, [density, charSet, customChars]) // eslint-disable-line

  // Live config updates (no reprocessing needed)
  useEffect(() => {
    engineRef.current?.updateConfig({
      sensitivity,
      elasticity: webcamActive && !webcamFrozen ? Math.max(elasticity, 0.25) : elasticity,
      friction: webcamActive && !webcamFrozen ? 0.72 : friction,
      colorPalette,
    })
  }, [sensitivity, elasticity, friction, colorPalette, webcamActive, webcamFrozen])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#080807' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
