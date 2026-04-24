import { useState, useEffect } from 'react'
import useEngineStore from './store/engineStore'
import CanvasRenderer from './components/CanvasRenderer'
import Controls from './components/Controls'
import ExportPanel from './components/ExportPanel'
import ImageUploader from './components/ImageUploader'

export default function App() {
  const imageSrc         = useEngineStore((s) => s.imageSrc)
  const imageAspectRatio = useEngineStore((s) => s.imageAspectRatio)
  const reset            = useEngineStore((s) => s.reset)
  const [isMobile, setIsMobile]   = useState(() => window.innerWidth < 768)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Use the image's natural aspect ratio so particles are never stretched.
  // Fall back to 16/9 before any image is loaded.
  const canvasRatio = imageAspectRatio ?? (16 / 9)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0d0c0b' }}>

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <aside style={{
          width: 256, minWidth: 256,
          background: '#131210',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <Header />

          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {imageSrc
              ? <SourceImage src={imageSrc} onReset={reset} />
              : <ImageUploader compact />
            }
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <Controls />
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <ExportPanel />
          </div>

          <Copyright />
        </aside>
      )}

      {/* ── Canvas area ── */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? 16 : 28,
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          // width = smallest of: maxWidth, what fits at maxHeight with correct ratio, available space
          // This prevents width from staying wide when maxHeight caps the height (which would distort ratio)
          aspectRatio: String(canvasRatio),
          width: `min(840px, calc(${isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 80px)'} * ${canvasRatio}), 100%)`,
          position: 'relative',
          borderRadius: isMobile ? 10 : 12,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 20px 60px rgba(0,0,0,0.6)',
          background: '#080807',
        }}>
          <CanvasRenderer />

          {/* Upload overlay */}
          {!imageSrc && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#080807',
              padding: isMobile ? '20px 20px' : '24px 32px',
              overflow: 'hidden',
            }}>
              <div style={{ textAlign: 'center', maxWidth: 340, width: '100%' }}>
                <div style={{
                  color: '#f0ede8', fontSize: isMobile ? 16 : 22,
                  fontWeight: 600, letterSpacing: '-0.02em',
                  marginBottom: isMobile ? 6 : 10, lineHeight: 1.25,
                }}>
                  Turn any image into<br />ASCII particle art
                </div>
                {!isMobile && (
                  <div style={{ color: '#57524d', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                    Upload a photo and watch it come alive as interactive ASCII characters.
                  </div>
                )}
                <div style={{ marginTop: isMobile ? 12 : 0 }}>
                  <ImageUploader />
                </div>
              </div>
            </div>
          )}

          {/* Interaction hint */}
          {imageSrc && (
            <div style={{
              position: 'absolute', bottom: 10, right: 14,
              color: '#2a2825', fontSize: 10, pointerEvents: 'none',
              letterSpacing: '0.08em', fontFamily: 'monospace',
            }}>
              {isMobile ? 'drag to interact' : 'hover to interact'}
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile: copyright always visible ── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '6px 16px',
          pointerEvents: sheetOpen ? 'none' : 'auto',
          opacity: sheetOpen ? 0 : 1,
          transition: 'opacity 0.2s',
        }}>
          <span style={{ color: '#3d3a35', fontSize: 10 }}>© {new Date().getFullYear()} M'Hamed El Bah</span>
          <span style={{ color: '#2a2825', fontSize: 10 }}>·</span>
          <a
            href="https://www.linkedin.com/in/mhamed-elbah-6a954b211/"
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#57524d', fontSize: 10, textDecoration: 'none' }}
          >
            LinkedIn ↗
          </a>
        </div>
      )}

      {/* ── Mobile: fixed settings FAB ── */}
      {isMobile && !sheetOpen && (
        <button
          onClick={() => setSheetOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 20, zIndex: 25,
            background: '#1e1c1a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            color: '#f0ede8', fontSize: 13, fontWeight: 500,
            padding: '11px 22px',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}
        >
          Settings
        </button>
      )}

      {/* ── Mobile bottom sheet ── */}
      {isMobile && (
        <>
          {sheetOpen && (
            <div
              onClick={() => setSheetOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.5)' }}
            />
          )}

          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
            height: '62vh',
            background: '#131210',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px 16px 0 0',
            display: 'flex', flexDirection: 'column',
            transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
            willChange: 'transform',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Sheet header */}
            <div style={{
              padding: '6px 20px 12px', flexShrink: 0,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#f0ede8', fontSize: 15, fontWeight: 600 }}>Vizo — Settings</span>
              <button
                onClick={() => setSheetOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6,
                  color: '#9a9590', fontSize: 13, width: 28, height: 28,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            {imageSrc && (
              <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <SourceImage src={imageSrc} onReset={() => { reset(); setSheetOpen(false) }} />
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <Controls />
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <ExportPanel />
            </div>

            <Copyright />
          </div>
        </>
      )}
    </div>
  )
}

function Header() {
  return (
    <div style={{ padding: '18px 20px 15px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
      <div style={{ color: '#f0ede8', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Vizo</div>
      <div style={{ color: '#4a4742', fontSize: 11, marginTop: 2 }}>ASCII Particle Designer</div>
    </div>
  )
}

function Copyright() {
  return (
    <div style={{
      padding: '10px 20px 12px',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <span style={{ color: '#3d3a35', fontSize: 10 }}>
        © {new Date().getFullYear()} M'Hamed El Bah
      </span>
      <a
        href="https://www.linkedin.com/in/mhamed-elbah-6a954b211/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#57524d', fontSize: 10, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#9a9590'}
        onMouseLeave={e => e.currentTarget.style.color = '#57524d'}
      >
        LinkedIn ↗
      </a>
    </div>
  )
}

function SourceImage({ src, onReset }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src={src} alt="source" style={{
        width: 48, height: 34, borderRadius: 4, objectFit: 'cover',
        flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)',
      }} />
      <div>
        <div style={{ color: '#57524d', fontSize: 10, marginBottom: 4 }}>Source image</div>
        <button onClick={onReset} style={{
          background: 'none', border: 'none', padding: 0,
          color: '#9a9590', fontSize: 11, cursor: 'pointer',
          fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2,
        }}>Change image</button>
      </div>
    </div>
  )
}
