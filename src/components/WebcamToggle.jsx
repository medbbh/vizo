import useEngineStore from '../store/engineStore'

export default function WebcamToggle() {
  const setWebcamActive = useEngineStore((s) => s.setWebcamActive)

  return (
    <button
      onClick={() => setWebcamActive(true)}
      style={{
        width: '100%',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px dashed rgba(255,255,255,0.12)',
        borderRadius: 8,
        color: '#9a9590',
        fontSize: 13,
        fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
        e.currentTarget.style.color = '#f0ede8'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        e.currentTarget.style.color = '#9a9590'
      }}
    >
      <CamIcon />
      Use webcam
    </button>
  )
}

function CamIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}
