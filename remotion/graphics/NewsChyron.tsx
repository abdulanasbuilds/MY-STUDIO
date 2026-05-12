// MY STUDIO — NewsChyron.tsx
// PURPOSE: News ticker bar graphic for videos
// CONNECTS TO: caption_engine.py (rendered by Remotion)

interface NewsChyronProps {
  headline: string;
  source: string;
}

export function NewsChyron({ headline, source }: NewsChyronProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        height: 56,
        background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
      }}
    >
      <div
        style={{
          padding: '0 16px',
          fontSize: 14,
          fontWeight: 700,
          color: '#ffffff',
          background: '#1f2937',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {source}
      </div>
      <div
        style={{
          flex: 1,
          padding: '0 20px',
          fontSize: 18,
          fontWeight: 600,
          color: '#ffffff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {headline}
      </div>
    </div>
  );
}
