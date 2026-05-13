import { useCurrentFrame, useVideoConfig } from 'remotion';

interface Word { word: string; start: number; end: number; }
interface Props { words: Word[]; videoPath: string; }

export function BreakingNews({ words }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  
  const lines = [];
  for (let i = 0; i < words.length; i += 8) lines.push(words.slice(i, i + 8));
  const currentLine = lines.find(line => line.some(w => currentTime >= w.start && currentTime <= w.end));
  
  if (!currentLine) return null;
  
  return (
    <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: '90%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#cc0000', padding: '4px 16px', width: 'fit-content', color: 'white', fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: 24, textTransform: 'uppercase' }}>
        BREAKING NEWS
      </div>
      <div style={{ backgroundColor: 'white', padding: '16px 24px', borderLeft: '8px solid #cc0000', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <span style={{ fontFamily: 'sans-serif', fontSize: 48, color: 'black', fontWeight: 800 }}>
          {currentLine.map(w => w.word).join(" ")}
        </span>
      </div>
    </div>
  );
}
