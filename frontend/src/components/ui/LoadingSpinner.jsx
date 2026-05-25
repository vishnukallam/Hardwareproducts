const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${sizes[size]}`}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        {/* Spinning arc */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
          style={{ animation: 'spin 0.8s linear infinite' }}
        />
        {/* Inner glow dot */}
        <div className="absolute inset-1/4 rounded-full bg-primary/40"
          style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.1); } }
        `}</style>
      </div>
      {text && (
        <p className="text-on-surface-variant font-body text-sm tracking-widest uppercase animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

export const M3ShapeLoader = () => (
  <div className="flex items-center justify-center gap-3">
    {['rounded-m3-sm', 'rounded-m3-full', 'rounded-m3-md'].map((shape, i) => (
      <div
        key={i}
        className={`w-3 h-3 bg-primary ${shape}`}
        style={{
          animation: `bounce 0.9s ease-in-out ${i * 0.15}s infinite`,
        }}
      />
    ))}
    <style>{`
      @keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.3} 50%{transform:translateY(-12px);opacity:1} }
    `}</style>
  </div>
);

export default LoadingSpinner;
