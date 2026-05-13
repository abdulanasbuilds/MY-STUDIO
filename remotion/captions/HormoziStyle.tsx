import { useCurrentFrame, useVideoConfig } from 'remotion';

interface Word { word: string; start: number; end: number; }
interface HormoziStyleProps { words: Word[]; videoPath: string; }

export function HormoziStyle({ words }: HormoziStyleProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  
  const currentWordIndex = words.findIndex(w => currentTime >= w.start && currentTime <= w.end);
  const lines = groupWordsIntoLines(words, 4);
  const currentLine = lines.find(line => line.some(w => currentTime >= w.start && currentTime <= w.end));
  
  if (!currentLine) return null;
  
  return (
    <div style={{ position: 'absolute', bottom: '15%', left: '5%', right: '5%', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {currentLine.map((word, i) => {
          const isActive = currentTime >= word.start && currentTime <= word.end;
          return (
            <span key={i} style={{
                fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 72, fontWeight: 900, textTransform: 'uppercase',
                color: isActive ? '#FFD700' : '#FFFFFF', textShadow: '3px 3px 6px rgba(0,0,0,0.9), -1px -1px 0 #000, 1px -1px 0 #000',
                letterSpacing: 2, lineHeight: 1.1, transition: 'color 0.05s',
            }}>
              {word.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function groupWordsIntoLines(words: Word[], maxPerLine: number): Word[][] {
  const lines: Word[][] = [];
  for (let i = 0; i < words.length; i += maxPerLine) lines.push(words.slice(i, i + maxPerLine));
  return lines;
}
