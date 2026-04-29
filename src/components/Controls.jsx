import useEngineStore from '../store/engineStore'

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 14px' }}>
      <span style={{ color: '#3d3a35', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

function Slider({ label, hint, value, min, max, step = 1, onChange, lo, hi }) {
  const fmt = step < 1 ? Number(value).toFixed(2) : String(value)
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ color: '#ccc9c4', fontSize: 13 }}>{label}</span>
        <span style={{ color: '#f0ede8', fontSize: 11, fontFamily: 'monospace' }}>{fmt}</span>
      </div>
      {hint && <div style={{ color: '#4a4742', fontSize: 11, marginBottom: 8, lineHeight: 1.5 }}>{hint}</div>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#f0ede8', display: 'block' }}
      />
      {(lo || hi) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: '#3d3a35', fontSize: 10 }}>{lo}</span>
          <span style={{ color: '#3d3a35', fontSize: 10 }}>{hi}</span>
        </div>
      )}
    </div>
  )
}

function Chips({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ color: '#ccc9c4', fontSize: 13, marginBottom: 9 }}>{label}</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {options.map((o) => {
          const on = value === o.value
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${on ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                background: on ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: on ? '#f0ede8' : '#4a4742',
                fontSize: 12, fontFamily: 'inherit', fontWeight: on ? 500 : 400,
                transition: 'all 0.12s',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Controls() {
  const {
    density, setDensity,
    sensitivity, setSensitivity,
    elasticity, setElasticity,
    friction, setFriction,
    colorPalette, setColorPalette,
    charSet, setCharSet,
    customChars, setCustomChars,
    particleCount,
  } = useEngineStore()

  return (
    <div style={{ padding: '4px 20px 16px' }}>

      {particleCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', borderRadius: 7, marginTop: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ color: '#57524d', fontSize: 11 }}>Particles</span>
          <span style={{ color: '#f0ede8', fontSize: 13, fontFamily: 'monospace' }}>
            {particleCount.toLocaleString()}
          </span>
        </div>
      )}

      <SectionLabel>Mouse</SectionLabel>

      <Slider label="Hover Range" hint="How wide the cursor's push reaches"
        lo="Small" hi="Wide"
        value={sensitivity} min={20} max={200} onChange={setSensitivity} />

      <Slider label="Return Speed" hint="How fast characters snap back"
        lo="Slow" hi="Fast"
        value={elasticity} min={0.01} max={0.3} step={0.01} onChange={setElasticity} />

      <Slider label="Smoothness" hint="Snappy vs floaty movement"
        lo="Snappy" hi="Fluid"
        value={friction} min={0.7} max={0.99} step={0.01} onChange={setFriction} />

      <SectionLabel>Source</SectionLabel>

      <Slider label="Detail" hint="More particles = sharper, denser image"
        lo="Abstract" hi="Sharp"
        value={density} min={40} max={180} onChange={setDensity} />

      <SectionLabel>Style</SectionLabel>

      <Chips label="Colors"
        value={colorPalette} onChange={setColorPalette}
        options={[
          { value: 'teal',     label: 'Teal'     },
          { value: 'lavender', label: 'Lavender' },
          { value: 'matrix',   label: 'Matrix'   },
          { value: 'sampled',  label: 'Photo'    },
        ]}
      />

      <Chips label="Characters"
        value={charSet} onChange={setCharSet}
        options={[
          { value: 'ascii',  label: 'Letters' },
          { value: 'binary', label: '0s & 1s' },
          { value: 'custom', label: 'Custom'  },
        ]}
      />

      {charSet === 'custom' && (
        <div style={{ marginTop: -4, marginBottom: 16 }}>
          <input
            type="text"
            value={customChars}
            onChange={(e) => setCustomChars(e.target.value)}
            placeholder="Type any characters..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              padding: '8px 10px', color: '#f0ede8', fontFamily: 'monospace',
              fontSize: 13, outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  )
}
