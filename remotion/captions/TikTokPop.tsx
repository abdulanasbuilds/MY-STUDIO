import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

interface Word { word: string; start: number; end: number; }
interface Props { words: Word[]; videoPath: string; }

export function TikTokPop({ words }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  
  const currentWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
  
  if (!currentWord) return null;
  
  const wordFrame = (currentTime - currentWord.start) * fps;
  const scale = spring({ fps, frame: wordFrame, config: { damping: 12 } });
  
  return (
    <div style={{ position: 'absolute', bottom: '25%', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <span style={{ 
            fontFamily: 'system-ui, sans-serif', fontSize: 80, fontWeight: 900, color: '#FFFFFF',
            textShadow: '0px 4px 10px rgba(0,0,0,0.5)', WebkitTextStroke: '2px black',
            transform: `scale(${scale}) rotate(${Math.random() * 6 - 3}deg)`,
        }}>
          {currentWord.word}
        </span>
    </div>
  );
}
