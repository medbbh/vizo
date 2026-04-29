const PALETTE = {
  teal: (r, g, b, brightness) => {
    const t = brightness / 255
    const base = [100, 255, 218]  // #64ffda
    const dim  = [20,  80,  70]
    return `rgb(${Math.round(dim[0] + t * (base[0] - dim[0]))},${Math.round(dim[1] + t * (base[1] - dim[1]))},${Math.round(dim[2] + t * (base[2] - dim[2]))})`
  },
  lavender: (r, g, b, brightness) => {
    const t = brightness / 255
    const base = [179, 157, 219]  // #b39ddb
    const dim  = [40,  30,  70]
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
    this._spriteCharKey = ''
    this._charScratch = []
    this._seenChars = {}

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

  // For live webcam frames: update origins in-place without scattering.
  updateParticles(particleData, canvasW, canvasH, particleCount = particleData.length) {
    const n = particleCount
    const palette = PALETTE[this.config.colorPalette] || PALETTE.teal
    const prev = this.count

    // Grow arrays only when needed — never shrink, just hide extras via this.count
    if (n > (this.px?.length ?? 0)) {
      const cap = Math.ceil(n * 1.2)
      const grow = (arr) => { const a = new Float32Array(cap); if (arr) a.set(arr); return a }
      this.px = grow(this.px); this.py = grow(this.py)
      this.vx = grow(this.vx); this.vy = grow(this.vy)
      this.ox = grow(this.ox); this.oy = grow(this.oy)
    }
    if (!this.chars || this.chars.length < n) {
      const c = new Array(Math.ceil(n * 1.2))
      if (this.chars) for (let i = 0; i < this.chars.length; i++) c[i] = this.chars[i]
      this.chars = c
      const colors = new Array(Math.ceil(n * 1.2))
      if (this.colors) for (let i = 0; i < this.colors.length; i++) colors[i] = this.colors[i]
      this.colors = colors
    }

    this.count = n

    for (let i = 0; i < n; i++) {
      const p = particleData[i]
      const newOx = p.originX * canvasW
      const newOy = p.originY * canvasH

      if (i >= prev) {
        // Brand new particle — place at origin directly
        this.px[i] = newOx
        this.py[i] = newOy
        this.vx[i] = 0
        this.vy[i] = 0
      } else {
        const dx = newOx - this.ox[i]
        const dy = newOy - this.oy[i]
        const dist2 = dx * dx + dy * dy
        if (dist2 > 40 * 40) {
          // Origin jumped far — teleport current pos to avoid cross-screen spring
          this.px[i] = newOx
          this.py[i] = newOy
          this.vx[i] = 0
          this.vy[i] = 0
        } else {
          // Nudge current position toward new origin
          this.px[i] += dx * 0.4
          this.py[i] += dy * 0.4
        }
      }

      this.ox[i] = newOx
      this.oy[i] = newOy
      this.chars[i] = p.char
      this.colors[i] = palette(p.r, p.g, p.b, p.brightness)
    }

    const spriteCharKey = this._getSpriteCharKey(n)
    if (spriteCharKey !== this._spriteCharKey) {
      this._buildSpriteSheet()
      this._spriteCharKey = spriteCharKey
    }
    if (this.onParticleCount) this.onParticleCount(n)
  }

  _getSpriteCharKey(n) {
    const seen = this._seenChars
    const chars = this._charScratch
    chars.length = 0

    for (const key in seen) delete seen[key]
    for (let i = 0; i < n; i++) {
      const ch = this.chars[i]
      if (seen[ch] === undefined) {
        seen[ch] = chars.length
        chars.push(ch)
      }
    }

    chars.sort()
    return chars.join('')
  }

  _buildSpriteSheet() {
    const uniqueChars = this._charScratch.length ? [...this._charScratch] : [...new Set(this.chars)]
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
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
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
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.font = FONT
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    for (let i = 0; i < this.count; i++) {
      const x = this.px[i]
      const y = this.py[i]
      if (x < -cw || x > w + cw || y < -ch || y > h + ch) continue

      const charIdx = this.charIndex[this.chars[i]]
      if (charIdx === undefined) continue

      ctx.fillStyle = this.colors[i]
      ctx.fillText(this.chars[i], x, y)
    }
  }

  destroy() {
    this.stop()
    this.canvas.removeEventListener('mousemove', null)
    this.canvas.removeEventListener('mouseleave', null)
  }
}
