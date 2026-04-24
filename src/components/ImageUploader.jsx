import { useRef, useState } from 'react'
import useEngineStore from '../store/engineStore'

export default function ImageUploader({ compact = false }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)
  const setImageData = useEngineStore((s) => s.setImageData)

  function load(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => setImageData(img, e.target.result)
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  const handlers = {
    onClick: () => ref.current.click(),
    onDrop: (e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files[0]) },
    onDragOver: (e) => { e.preventDefault(); setDrag(true) },
    onDragLeave: () => setDrag(false),
  }

  if (compact) {
    return (
      <div {...handlers} style={{
        border: `1px dashed ${drag ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 7, padding: '10px 12px', cursor: 'pointer',
        background: drag ? 'rgba(255,255,255,0.04)' : 'transparent',
        textAlign: 'center', transition: 'all 0.15s',
      }}>
        <div style={{ color: '#ccc9c4', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Upload an image</div>
        <div style={{ color: '#4a4742', fontSize: 11 }}>Click or drag & drop</div>
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => load(e.target.files[0])} />
      </div>
    )
  }

  return (
    <div {...handlers} style={{
      border: `1.5px dashed ${drag ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: 10, padding: '16px 20px', cursor: 'pointer',
      background: drag ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
      transition: 'all 0.15s',
    }}>
      <div style={{ color: '#f0ede8', fontSize: 14, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>
        Drop your image here
      </div>
      <div style={{ color: '#57524d', fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
        or click to browse — JPG, PNG, WebP, GIF
      </div>
      <div style={{ textAlign: 'center' }}>
        <span style={{
          display: 'inline-block',
          background: '#f0ede8', color: '#0d0c0b',
          fontSize: 12, fontWeight: 600,
          padding: '7px 20px', borderRadius: 6,
        }}>
          Choose file
        </span>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => load(e.target.files[0])} />
    </div>
  )
}
