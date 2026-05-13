import { useCurrentFrame, useVideoConfig } from 'remotion';

interface Word { word: string; start: number; end: number; }
interface Props { words: Word[]; videoPath: string; }

export function NetflixStyle({ words }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  
  // Find current sentence block (simplified grouping by 6 words)
  const lines = [];
  for (let i = 0; i < words.length; i += 6) lines.push(words.slice(i, i + 6));
  
  const currentLine = lines.find(line => line.some(w => currentTime >= w.start && currentTime <= w.end));
  
  if (!currentLine) return null;
  
  return (
    <div style={{ position: 'absolute', bottom: '8%', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '8px 24px', borderRadius: 8 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 42, color: 'white', textShadow: '1px 1px 2px black', fontWeight: 'normal' }}>
          {currentLine.map(w => w.word).join(" ")}
        </span>
      </div>
    </div>
  );
}
