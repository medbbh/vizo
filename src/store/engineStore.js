import { create } from 'zustand'

const useEngineStore = create((set) => ({
  // Image data
  imageData: null,
  imageSrc: null,
  imageAspectRatio: null,

  // Config
  density: 120,          // sample grid size (px)
  sensitivity: 80,       // mouse repulsion radius
  elasticity: 0.08,      // spring strength back to origin
  friction: 0.88,        // velocity dampening per frame

  // Color palette: 'teal' | 'matrix' | 'sampled'
  colorPalette: 'teal',

  // Character set: 'ascii' | 'binary' | 'custom'
  charSet: 'ascii',
  customChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',

  // Stats
  particleCount: 0,
  fps: 0,

  setImageData: (imageData, imageSrc) => set({
    imageData, imageSrc,
    imageAspectRatio: imageData.naturalWidth / imageData.naturalHeight,
  }),
  setDensity: (density) => set({ density }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setElasticity: (elasticity) => set({ elasticity }),
  setFriction: (friction) => set({ friction }),
  setColorPalette: (colorPalette) => set({ colorPalette }),
  setCharSet: (charSet) => set({ charSet }),
  setCustomChars: (customChars) => set({ customChars }),
  setParticleCount: (particleCount) => set({ particleCount }),
  setFps: (fps) => set({ fps }),
  reset: () => set({ imageData: null, imageSrc: null, imageAspectRatio: null, particleCount: 0 }),
}))

export default useEngineStore
