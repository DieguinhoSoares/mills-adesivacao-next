export function ProgressBar({ pctApontado, pctValidado, height = 8 }) {
  return (
    <div
      style={{
        position: 'relative',
        height,
        background: 'var(--surface-1)',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${pctApontado}%`,
          background: '#85B7EB',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${pctValidado}%`,
          background: '#1D9E75',
        }}
      />
    </div>
  );
}
