// MY STUDIO — TikTokPop
// PURPOSE: Pop-in animation per word caption style (TikTok viral style)

interface Word {
  text: string;
  start: number;
  end: number;
}

interface TikTokPopProps {
  words: Word[];
  currentTime: number;
}

export const TikTokPop: React.FC<TikTokPopProps> = ({ words, currentTime }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        width: '85%',
      }}
    >
      {words.map((word, index) => {
        const isVisible = currentTime >= word.start;
        const isActive = currentTime >= word.start && currentTime <= word.end;
        const timeSinceStart = currentTime - word.start;
        const scale = isActive && timeSinceStart < 0.15 ? 1.3 : 1.0;

        return (
          <span
            key={index}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: '44px',
              color: isActive ? '#FF3B5C' : '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
              marginRight: '6px',
              display: 'inline-block',
              opacity: isVisible ? 1 : 0,
              transform: `scale(${scale})`,
              transition: 'transform 0.15s ease-out, opacity 0.1s ease',
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};
