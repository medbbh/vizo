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

export function processImage(imageElement, density, charSetKey, customChars) {
  const chars = charSetKey === 'custom' ? customChars || ' .:-=+*#%@' : CHAR_SETS[charSetKey] || CHAR_SETS.ascii

  // Clamp sample size so particle count stays between 2000-6000
  const sampleSize = Math.max(60, Math.min(density, 180))

  // Determine aspect ratio
  const aspect = imageElement.naturalWidth / imageElement.naturalHeight
  const sampleW = Math.round(sampleSize * Math.min(aspect, 1.5))
  const sampleH = Math.round(sampleSize / Math.max(aspect, 0.5))

  // Draw to hidden buffer canvas
  const buffer = document.createElement('canvas')
  buffer.width = sampleW
  buffer.height = sampleH
  const ctx = buffer.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(imageElement, 0, 0, sampleW, sampleH)
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH)

  const particles = []

  for (let py = 0; py < sampleH; py++) {
    for (let px = 0; px < sampleW; px++) {
      const i = (py * sampleW + px) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
      if (a < 30) continue // skip transparent pixels

      const brightness = getBrightness(r, g, b)
      if (brightness < 15) continue // skip near-black (empty space)

      const char = charForBrightness(brightness, chars)
      if (char === ' ') continue

      particles.push({
        originX: px / sampleW,   // normalized 0-1
        originY: py / sampleH,
        char,
        r, g, b,
        brightness,
      })
    }
  }

  // Center the content within [0,1] space.
  // Dark/transparent pixels are skipped, so the subject may be off-center
  // in the original image. We find the bounding box and re-center.
  if (particles.length > 0) {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    for (const p of particles) {
      if (p.originX < minX) minX = p.originX
      if (p.originX > maxX) maxX = p.originX
      if (p.originY < minY) minY = p.originY
      if (p.originY > maxY) maxY = p.originY
    }
    const ox = (1 - (maxX - minX)) / 2 - minX
    const oy = (1 - (maxY - minY)) / 2 - minY
    for (const p of particles) {
      p.originX += ox
      p.originY += oy
    }
  }

  return { particles, sampleW, sampleH }
}
