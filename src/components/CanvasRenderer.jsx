import { useEffect, useRef, useCallback } from 'react'
import useEngineStore from '../store/engineStore'
import { ParticleEngine } from '../engine/ParticleEngine'
import { processImage } from '../engine/imageProcessor'

export default function CanvasRenderer() {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const containerRef = useRef(null)

  const imageData = useEngineStore((s) => s.imageData)
  const density = useEngineStore((s) => s.density)
  const sensitivity = useEngineStore((s) => s.sensitivity)
  const elasticity = useEngineStore((s) => s.elasticity)
  const friction = useEngineStore((s) => s.friction)
  const colorPalette = useEngineStore((s) => s.colorPalette)
  const charSet = useEngineStore((s) => s.charSet)
  const customChars = useEngineStore((s) => s.customChars)
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

  // Re-process image when image or sampling config changes
  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !imageData || !containerRef.current) return

    const container = containerRef.current
    const w = container.clientWidth
    const h = container.clientHeight

    const { particles } = processImage(imageData, density, charSet, customChars)

    // Scale particle origins to canvas size
    const scaled = particles.map((p) => ({
      ...p,
      originX: p.originX,
      originY: p.originY,
    }))

    engine.storeRaw(scaled)
    engine.loadParticles(scaled, w, h)
  }, [imageData, density, charSet, customChars])

  // Live config updates (no reprocessing needed)
  useEffect(() => {
    engineRef.current?.updateConfig({ sensitivity, elasticity, friction, colorPalette })
  }, [sensitivity, elasticity, friction, colorPalette])

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
