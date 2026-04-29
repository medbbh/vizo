const CHAR_SETS = {
  ascii: ' .:-=+*#%@',
  binary: ' 01',
}

function getBrightness(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function charForBrightness(brightness, chars) {
  const idx = Math.floor((brightness / 255) * (chars.length - 1))
  return chars[Math.max(0, Math.min(idx, chars.length - 1))]
}

// Reusable offscreen buffer — created once, resized as needed
let buffer = null
let bufCtx = null
let particles = []
let lastParticleCount = 0
let lastSampleW = 0
let lastSampleH = 0

export function processVideoFrame(videoEl, density, charSetKey, customChars) {
  if (!videoEl || videoEl.readyState < 4 || videoEl.videoWidth === 0) return null

  const chars = charSetKey === 'custom' ? customChars || ' .:-=+*#%@' : CHAR_SETS[charSetKey] || CHAR_SETS.ascii

  // Lower density cap for webcam to keep framerate smooth.
  const sampleSize = Math.max(40, Math.min(density, 90))

  const aspect = videoEl.videoWidth / videoEl.videoHeight
  const sampleW = Math.round(sampleSize * Math.min(aspect, 1.5))
  const sampleH = Math.round(sampleSize / Math.max(aspect, 0.5))

  if (!buffer) {
    buffer = document.createElement('canvas')
    bufCtx = buffer.getContext('2d', { willReadFrequently: true })
  }
  if (buffer.width !== sampleW || buffer.height !== sampleH) {
    buffer.width = sampleW
    buffer.height = sampleH
  }

  // Mirror horizontally so it behaves like a selfie cam
  bufCtx.setTransform(-1, 0, 0, 1, sampleW, 0)
  bufCtx.drawImage(videoEl, 0, 0, sampleW, sampleH)
  bufCtx.setTransform(1, 0, 0, 1, 0, 0)

  const { data } = bufCtx.getImageData(0, 0, sampleW, sampleH)

  const total = sampleW * sampleH
  if (particles.length < total || lastSampleW !== sampleW || lastSampleH !== sampleH) {
    particles = new Array(total)
    lastSampleW = sampleW
    lastSampleH = sampleH
  }

  let count = 0

  for (let py = 0; py < sampleH; py++) {
    for (let px = 0; px < sampleW; px++) {
      const i = (py * sampleW + px) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const brightness = getBrightness(r, g, b)
      const char = charForBrightness(brightness, chars)

      let particle = particles[count]
      if (!particle) {
        particle = {
          originX: 0,
          originY: 0,
          char: ' ',
          r: 0,
          g: 0,
          b: 0,
          brightness: 0,
        }
        particles[count] = particle
      }
      particle.originX = px / sampleW
      particle.originY = py / sampleH
      particle.char = char
      particle.r = r
      particle.g = g
      particle.b = b
      particle.brightness = brightness
      count++
    }
  }

  lastParticleCount = count

  return { particles, count: lastParticleCount, aspect }
}
