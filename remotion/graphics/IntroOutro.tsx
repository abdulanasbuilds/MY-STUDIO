// MY STUDIO — IntroOutro.tsx
// PURPOSE: Intro/outro sequence graphic for videos
// CONNECTS TO: caption_engine.py (rendered by Remotion)

interface IntroOutroProps {
  title: string;
  subtitle: string;
  type: 'intro' | 'outro';
}

export function IntroOutro({ title, subtitle, type }: IntroOutroProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: type === 'intro'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: '#f9fafb',
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 400,
          color: '#9ca3af',
          textAlign: 'center',
        }}
      >
        {subtitle}
      </div>
      {type === 'outro' && (
        <div
          style={{
            marginTop: 40,
            fontSize: 16,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          Made with MY STUDIO
        </div>
      )}
    </div>
  );
}
