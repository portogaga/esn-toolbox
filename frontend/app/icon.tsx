import { ImageResponse } from 'next/og'

// Configuration de l'icône
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: '#10b981', // Ton vert Emerald-500
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '900',
          borderRadius: '6px',
          fontFamily: 'sans-serif',
        }}
      >
        E
      </div>
    ),
    { ...size }
  )
}