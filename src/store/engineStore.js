import { create } from 'zustand'

const useEngineStore = create((set) => ({
  // Image data
  imageData: null,
  imageSrc: null,
  imageAspectRatio: null,

  // Webcam mode
  webcamActive: false,
  webcamFrozen: false,
  webcamAspectRatio: null,

  // Config
  density: 120,          // sample grid size (px)
  sensitivity: 80,       // mouse repulsion radius
  elasticity: 0.08,      // spring strength back to origin
  friction: 0.88,        // velocity dampening per frame

  // Color palette: 'teal' | 'lavender' | 'matrix' | 'sampled'
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
    webcamActive: false,
    webcamFrozen: false,
    webcamAspectRatio: null,
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
  setWebcamActive: (webcamActive) => set({
    webcamActive,
    webcamFrozen: false,
    webcamAspectRatio: null,
    imageData: null,
    imageSrc: null,
    imageAspectRatio: null,
  }),
  setWebcamFrozen: (webcamFrozen) => set({ webcamFrozen }),
  setWebcamAspectRatio: (webcamAspectRatio) => set({ webcamAspectRatio }),
  reset: () => set({
    imageData: null,
    imageSrc: null,
    imageAspectRatio: null,
    particleCount: 0,
    webcamActive: false,
    webcamFrozen: false,
    webcamAspectRatio: null,
  }),
}))

export default useEngineStore
