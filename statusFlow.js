export function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '1rem' }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 500, margin: 0, color: color || 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
