// MY STUDIO — FaceHook.tsx
// PURPOSE: Face-focused thumbnail graphic
// CONNECTS TO: thumbnail_engine.py (rendered by Remotion)

interface FaceHookProps {
  imageUrl: string;
  title: string;
}

export function FaceHook({ imageUrl, title }: FaceHookProps) {
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
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '60px 40px 40px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.1,
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
