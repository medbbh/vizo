# Design Document: ASCII Interactive Particle Engine

## 1. Project Overview
A web-based tool that allows users to upload images and convert them into interactive, physics-based ASCII animations. The goal is to provide a "plug-and-play" component that developers and designers can use in their portfolios.

## 2. Technical Stack
* **The Builder (Platform):** React.js + Tailwind CSS (For the UI/Dashboard).
* **The Engine (Animation):** Vanilla JavaScript + HTML5 Canvas API (For maximum performance and portability).
* **State Management:** Zustand (To handle real-time configuration changes).
* **Processing:** Client-side Image manipulation (No server-side image processing needed).

## 3. Core Architecture

### A. The Processing Pipeline
1.  **Image Upload:** User provides a source image.
2.  **Downsampling:** The image is drawn to a hidden "buffer" canvas at a lower resolution (e.g., 100x100 or 150x150) to ensure the particle count stays between 2,000 and 6,000 for performance.
3.  **Luminance Mapping:**
    * The engine loops through the pixel data.
    * Brightness is calculated: `Brightness = (0.2126*R + 0.7152*G + 0.0722*B)`.
    * Brightness maps to a character string: `" .:-=+*#%@"`.
4.  **Particle Initialization:** Each valid pixel is stored as an object:
    ```javascript
    {
      x: Math.random() * width, // Random start position
      y: Math.random() * height,
      originX: originalX,       // Where it belongs in the photo
      originY: originalY,
      char: "@",
      color: "#64ffda"
    }
    ```

### B. The Physics Engine (The "Vibe")
The animation loop runs at 60FPS using `requestAnimationFrame`. For every frame, three forces are calculated for every particle:

1.  **Repulsion Force:** If `distance(mouse, particle) < radius`, the particle moves away from the mouse.
2.  **Spring Back (Home) Force:** The particle is constantly pulled back to its `originX/Y`. 
    * *Formula:* `velocity += (origin - current) * springStrength`.
3.  **Friction/Dampening:** Velocity is multiplied by a factor (e.g., `0.92`) every frame to stop the particles from oscillating forever.

## 4. Feature Requirements

### User Customization (Sliders)
* **Density:** Control how many pixels are sampled.
* **Sensitivity:** How far the mouse "pushes" the characters.
* **Elasticity:** How fast characters snap back to their original position.
* **Color Palette:** Standard (Teal/Green), Matrix (Green), or "Sampled" (Original image colors).
* **Character Set:** Standard ASCII, Binary (0/1), or custom text strings.

### Export Options
* **React Component:** A standalone `.jsx` file including the engine and the data.
* **Vanilla Script:** A single `<script>` tag that can be injected into Webflow, Wix, or standard HTML.
* **JSON Data:** Raw coordinate data for advanced users.

## 5. Performance Optimizations
* **Offscreen Canvas:** Using a second canvas to pre-render the character set (sprite-sheet) so the browser doesn't have to calculate text-rendering for 5,000 items every frame.
* **Typed Arrays:** Using `Float32Array` for particle positions to save memory.
* **DPR Scaling:** Automatically adjusting for Retina/High-res displays using `window.devicePixelRatio`.

## 6. Roadmap
* **Phase 1:** Functional "Upload -> Preview" flow with Teal color scheme.
* **Phase 2:** Multi-color support (sampling actual colors from the image).
* **Phase 3:** Export/Download functionality for the `.js` component.