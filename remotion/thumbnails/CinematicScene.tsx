// MY STUDIO — CinematicScene.tsx
// PURPOSE: Cinematic thumbnail graphic
// CONNECTS TO: thumbnail_engine.py (rendered by Remotion)

interface CinematicSceneProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
}

export function CinematicScene({ imageUrl, title, subtitle }: CinematicSceneProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: 1280,
        height: 720,
        overflow: 'hidden',
        background: '#000000',
      }}
    >
      <img
        src={imageUrl}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'brightness(0.6) contrast(1.1)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            textShadow: '3px 3px 12px rgba(0,0,0,0.9)',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: '#e5e7eb',
              textAlign: 'center',
              marginTop: 16,
              textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
