// MY STUDIO — BreakingNews
// PURPOSE: Lower third caption with red accent bar (breaking news style)

interface Word {
  text: string;
  start: number;
  end: number;
}

interface BreakingNewsProps {
  words: Word[];
  currentTime: number;
}

export const BreakingNews: React.FC<BreakingNewsProps> = ({ words, currentTime }) => {
  const visibleWords = words.filter(
    (word) => currentTime >= word.start && currentTime <= word.end + 0.5
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: '90%',
      }}
    >
      {/* Red accent bar */}
      <div
        style={{
          backgroundColor: '#CC0000',
          height: '4px',
          width: '100%',
          marginBottom: '0',
        }}
      />
      {/* Caption area */}
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#CC0000',
            padding: '4px 12px',
            marginRight: '16px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: '14px',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            BREAKING
          </span>
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '28px',
            color: '#FFFFFF',
            letterSpacing: '0.3px',
          }}
        >
          {visibleWords.map((word) => word.text).join(' ')}
        </span>
      </div>
    </div>
  );
};
