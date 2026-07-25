export function MetricCard({ label, value, color, onClick }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{ padding: '16px 18px', cursor: onClick ? 'pointer' : 'default' }}
    >
      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, margin: 0, color: color || 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
