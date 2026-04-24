# Vizo

An interactive web tool that transforms any image into a field of ASCII characters that physically react to your mouse cursor. Built with React and a custom canvas-based particle physics engine.

<video src="public/demo_image_to_ascii_tool.mp4" autoplay loop muted playsinline width="100%"></video>

---

## Features

- **Image to ASCII** — Upload any photo (JPG, PNG, WebP, GIF) and watch it rendered as ASCII characters
- **Interactive physics** — Particles scatter on mouse hover and spring back to their original position
- **Auto-centered** — Content is always centered in the canvas regardless of image composition
- **Correct aspect ratio** — Canvas matches your image's natural proportions, no stretching
- **Real-time controls** — Adjust hover range, return speed, smoothness, and detail level live
- **Color themes** — Teal, Matrix green, or colors sampled directly from the photo
- **Character sets** — Letters (ASCII), binary (0s & 1s), or fully custom characters
- **Export ready** — Download as a React component, standalone HTML file, or raw JSON
- **Mobile friendly** — Bottom sheet settings panel with touch interaction support
- **Privacy first** — Everything runs in the browser; nothing is uploaded anywhere

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm

### Install & run

```bash
git clone https://github.com/medbbh/vizo.git
cd ascii-particle-engine
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build       # output goes to /dist
npm run preview     # preview the production build locally
```

Deploy the `dist/` folder to Vercel, Netlify, GitHub Pages, or any static host.

---

## How It Works

### 1. Image Processing (`src/engine/imageProcessor.js`)

- The uploaded image is drawn onto a hidden `<canvas>` at a reduced resolution controlled by the **Detail Level** slider
- Each pixel's brightness is computed using standard luminance weights (`0.2126R + 0.7152G + 0.0722B`)
- Transparent and near-black pixels are skipped — no particle is spawned for them
- Remaining pixels are each assigned an ASCII character based on brightness
- All particle origins are normalized to `[0, 1]` in both axes
- A bounding box pass re-centers the content so the subject is always centered in the canvas, regardless of how the original photo is framed

### 2. Particle Engine (`src/engine/ParticleEngine.js`)

A typed-array physics loop running at 60 fps via `requestAnimationFrame`:

- `Float32Array` buffers for position (`px`, `py`), velocity (`vx`, `vy`), and origin (`ox`, `oy`) — avoids GC pressure and stays cache-friendly for thousands of particles
- Each frame: cursor distance is checked against the **hover radius**; particles within range receive an outward repulsion force scaled by proximity
- A spring force continuously pulls each particle back toward its resting origin (`elasticity`)
- Velocity is multiplied by a damping factor each frame (`friction`) producing smooth, fluid motion
- Mouse coordinates are stored in CSS pixel space to match the DPR-scaled canvas context

### 3. State Management (`src/store/engineStore.js`)

Zustand store holds all configuration, image data, and live stats. Changing physics parameters (hover range, elasticity, friction, palette) updates the engine instantly without reprocessing the image. Only changing **Detail Level** or **Characters** triggers a full reprocess.

---

## Project Structure

```
src/
├── engine/
│   ├── ParticleEngine.js     # Physics loop, canvas rendering, mouse/touch tracking
│   └── imageProcessor.js     # Image → normalized, centered particle data
├── components/
│   ├── CanvasRenderer.jsx    # Connects React to the engine, handles resize via ResizeObserver
│   ├── Controls.jsx          # Sliders and toggle groups for all settings
│   ├── ExportPanel.jsx       # Export to React component / vanilla HTML / JSON
│   └── ImageUploader.jsx     # Drag-and-drop + click-to-browse file input
├── store/
│   └── engineStore.js        # Zustand global state
├── App.jsx                   # Layout — desktop sidebar + canvas + mobile bottom sheet
├── main.jsx                  # React entry point
└── index.css                 # Global base styles
```

---

## Settings Reference

| Setting | What it does | Range |
|---|---|---|
| **Hover Range** | Radius of the cursor's repulsion field | 20 – 200 px |
| **Return Speed** | Spring strength pulling particles back to origin | 0.01 – 0.30 |
| **Smoothness** | Velocity damping — snappy vs. floaty | 0.70 – 0.99 |
| **Detail Level** | Sampling resolution — more particles = sharper image | 40 – 180 |
| **Colors** | Teal / Matrix green / sampled from photo | — |
| **Characters** | Letters (ASCII) / 0s & 1s / custom string | — |

---

## Export Formats

| Format | File | Use case |
|---|---|---|
| **React Component** | `AsciiParticles.jsx` | Drop into any React / Next.js project |
| **Vanilla HTML** | `ascii-particles.html` | Webflow, Wix, any static site |
| **Raw JSON** | `ascii-particles.json` | Bring your own renderer |

---

## Tech Stack

| | |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [Zustand](https://github.com/pmndrs/zustand) | Lightweight state management |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com/) | Base styles |
| Canvas 2D API | Particle rendering |
| ResizeObserver | Responsive canvas resizing |

---

## Contributing

Contributions are very welcome.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep PRs focused — one feature or fix per PR makes review easier.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

## Author

**M'Hamed El Bah**  
[LinkedIn →](https://www.linkedin.com/in/mhamed-elbah-6a954b211/)
