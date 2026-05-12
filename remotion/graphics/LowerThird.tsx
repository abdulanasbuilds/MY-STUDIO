// MY STUDIO — LowerThird.tsx
// PURPOSE: Name/title overlay graphic for videos
// CONNECTS TO: caption_engine.py (rendered by Remotion)

interface LowerThirdProps {
  name: string;
  title: string;
}

export function LowerThird({ name, title }: LowerThirdProps) {
  return (
    <div style={{ position: 'absolute', bottom: 80, left: 40 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#f9fafb' }}>{name}</div>
      <div style={{ fontSize: 18, color: '#9ca3af', marginTop: 4 }}>{title}</div>
    </div>
  );
}
