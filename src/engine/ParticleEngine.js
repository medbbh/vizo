const PALETTE = {
  teal: (r, g, b, brightness) => {
    const t = brightness / 255
    const base = [100, 255, 218]  // #64ffda
    const dim  = [20,  80,  70]
    return `rgb(${Math.round(dim[0] + t * (base[0] - dim[0]))},${Math.round(dim[1] + t * (base[1] - dim[1]))},${Math.round(dim[2] + t * (base[2] - dim[2]))})`
  },
  matrix: (r, g, b, brightness) => {
    const t = brightness / 255
    return `rgb(0,${Math.round(80 + t * 175)},0)`
  },
  sampled: (r, g, b) => `rgb(${r},${g},${b})`,
}

const FONT_SIZE = 10
const FONT = `${FONT_SIZE}px "Courier New", monospace`

export class ParticleEngine {
  constructor(canvas, config) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.config = { ...config }
    this.running = false
    this.rafId = null
    this.mouse = { x: -9999, y: -9999 }

    // Typed arrays for perf — allocated per-load
    this.count = 0
    this.px = null   // Float32Array current x
    this.py = null   // Float32Array current y
    this.vx = null   // Float32Array velocity x
    this.vy = null   // Float32Array velocity y
    this.ox = null   // Float32Array origin x (canvas coords)
    this.oy = null   // Float32Array origin y
    this.chars = []  // string[]
    this.colors = [] // string[] — pre-computed per palette

    // Sprite sheet offscreen canvas
    this.sprite = null
    this.charIndex = {}

    // FPS tracking
    this._lastTime = 0
    this._frameCount = 0
    this._fpsTimer = 0
    this.onFpsUpdate = null
    this.onParticleCount = null

    this._bindMouse()
  }

  _bindMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      this.mouse.x = e.clientX - rect.left
      this.mouse.y = e.clientY - rect.top
    })
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = -9999
      this.mouse.y = -9999
    })
    // Touch support
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const t = e.touches[0]
      this.mouse.x = t.clientX - rect.left
      this.mouse.y = t.clientY - rect.top
    }, { passive: false })
    this.canvas.addEventListener('touchend', () => {
      this.mouse.x = -9999
      this.mouse.y = -9999
    })
  }

  loadParticles(particleData, canvasW, canvasH) {
    const n = particleData.length
    this.count = n
    this.px = new Float32Array(n)
    this.py = new Float32Array(n)
    this.vx = new Float32Array(n)
    this.vy = new Float32Array(n)
    this.ox = new Float32Array(n)
    this.oy = new Float32Array(n)
    this.chars = new Array(n)
    this.colors = new Array(n)

    const palette = PALETTE[this.config.colorPalette] || PALETTE.teal

    for (let i = 0; i < n; i++) {
      const p = particleData[i]
      const cx = p.originX * canvasW
      const cy = p.originY * canvasH
      // Start scattered
      this.ox[i] = cx
      this.oy[i] = cy
      this.px[i] = Math.random() * canvasW
      this.py[i] = Math.random() * canvasH
      this.vx[i] = 0
      this.vy[i] = 0
      this.chars[i] = p.char
      this.colors[i] = palette(p.r, p.g, p.b, p.brightness)
    }

    this._buildSpriteSheet()

    if (this.onParticleCount) this.onParticleCount(n)
  }

  _buildSpriteSheet() {
    const uniqueChars = [...new Set(this.chars)]
    const pad = 2
    const cellW = FONT_SIZE + pad * 2
    const cellH = FONT_SIZE + pad * 2
    const cols = uniqueChars.length

    this.sprite = new OffscreenCanvas(cols * cellW, cellH)
    const sctx = this.sprite.getContext('2d')
    sctx.font = FONT
    sctx.textBaseline = 'middle'
    sctx.textAlign = 'center'

    uniqueChars.forEach((ch, idx) => {
      this.charIndex[ch] = idx
      sctx.fillStyle = '#ffffff'
      sctx.fillText(ch, idx * cellW + cellW / 2, cellH / 2)
    })

    this._spriteCell = { w: cellW, h: cellH }
  }

  updateConfig(config) {
    const palChanged = config.colorPalette !== this.config.colorPalette
    this.config = { ...this.config, ...config }

    // Recompute colors if palette changed
    if (palChanged && this._rawParticleData) {
      const palette = PALETTE[this.config.colorPalette] || PALETTE.teal
      for (let i = 0; i < this.count; i++) {
        const p = this._rawParticleData[i]
        this.colors[i] = palette(p.r, p.g, p.b, p.brightness)
      }
    }
  }

  storeRaw(particleData) {
    this._rawParticleData = particleData
  }

  resize(w, h) {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.scale(dpr, dpr)
  }

  start() {
    if (this.running) return
    this.running = true
    this._lastTime = performance.now()
    this.rafId = requestAnimationFrame(this._loop.bind(this))
  }

  stop() {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = null
  }

  _loop(now) {
    if (!this.running) return

    // FPS
    this._frameCount++
    const elapsed = now - this._fpsTimer
    if (elapsed >= 500) {
      const fps = Math.round((this._frameCount / elapsed) * 1000)
      if (this.onFpsUpdate) this.onFpsUpdate(fps)
      this._frameCount = 0
      this._fpsTimer = now
    }

    this._update()
    this._draw()

    this.rafId = requestAnimationFrame(this._loop.bind(this))
  }

  _update() {
    const { sensitivity, elasticity, friction } = this.config
    const mouseX = this.mouse.x
    const mouseY = this.mouse.y
    const repulseR = sensitivity
    const repulseR2 = repulseR * repulseR
    const spring = elasticity

    for (let i = 0; i < this.count; i++) {
      const dx = mouseX - this.px[i]
      const dy = mouseY - this.py[i]
      const dist2 = dx * dx + dy * dy

      if (dist2 < repulseR2 && dist2 > 0.01) {
        const dist = Math.sqrt(dist2)
        const force = (repulseR - dist) / repulseR
        const fx = (dx / dist) * force * 8
        const fy = (dy / dist) * force * 8
        this.vx[i] -= fx
        this.vy[i] -= fy
      }

      // Spring back to origin
      this.vx[i] += (this.ox[i] - this.px[i]) * spring
      this.vy[i] += (this.oy[i] - this.py[i]) * spring

      // Friction
      this.vx[i] *= friction
      this.vy[i] *= friction

      this.px[i] += this.vx[i]
      this.py[i] += this.vy[i]
    }
  }

  _draw() {
    const dpr = window.devicePixelRatio || 1
    const w = this.canvas.width / dpr
    const h = this.canvas.height / dpr
    const ctx = this.ctx

    ctx.clearRect(0, 0, w, h)

    if (!this.sprite || this.count === 0) return

    const { w: cw, h: ch } = this._spriteCell

    for (let i = 0; i < this.count; i++) {
      const x = this.px[i]
      const y = this.py[i]
      if (x < -cw || x > w + cw || y < -ch || y > h + ch) continue

      const charIdx = this.charIndex[this.chars[i]]
      if (charIdx === undefined) continue

      // Tint sprite: drawImage then composite
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

      // Use simpler fillText for color accuracy (sprite is used as optimization only for monochrome builds)
      ctx.fillStyle = this.colors[i]
      ctx.font = FONT
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(this.chars[i], x, y)
    }
  }

  destroy() {
    this.stop()
    this.canvas.removeEventListener('mousemove', null)
    this.canvas.removeEventListener('mouseleave', null)
  }
}
