// MY STUDIO — NetflixStyle
// PURPOSE: Clean serif font caption, bottom positioned (Netflix documentary style)

interface Word {
  text: string;
  start: number;
  end: number;
}

interface NetflixStyleProps {
  words: Word[];
  currentTime: number;
}

export const NetflixStyle: React.FC<NetflixStyleProps> = ({ words, currentTime }) => {
  const visibleWords = words.filter(
    (word) => currentTime >= word.start && currentTime <= word.end + 0.5
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        width: '90%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '12px 24px',
        borderRadius: '4px',
      }}
    >
      <span
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 400,
          fontSize: '36px',
          color: '#FFFFFF',
          letterSpacing: '0.5px',
          lineHeight: 1.4,
        }}
      >
        {visibleWords.map((word) => word.text).join(' ')}
      </span>
    </div>
  );
};
