// MY STUDIO — HormoziStyle
// PURPOSE: Bold white text caption with word-by-word highlight in yellow (Hormozi style)

interface Word {
  text: string;
  start: number;
  end: number;
}

interface HormoziStyleProps {
  words: Word[];
  currentTime: number;
}

export const HormoziStyle: React.FC<HormoziStyleProps> = ({ words, currentTime }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        width: '80%',
      }}
    >
      {words.map((word, index) => {
        const isActive = currentTime >= word.start && currentTime <= word.end;
        return (
          <span
            key={index}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '48px',
              textTransform: 'uppercase',
              color: isActive ? '#FFD700' : '#FFFFFF',
              textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
              marginRight: '8px',
              display: 'inline-block',
              transition: 'color 0.1s ease',
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};
