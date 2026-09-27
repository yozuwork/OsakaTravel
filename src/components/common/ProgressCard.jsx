export default function ProgressCard({ label, done, total, unit }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="card progress">
      <div className="row-between"><strong>{label}</strong><strong className="small">{unit} {done} / {total}</strong></div>
      <div className="progress__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="progress__fill" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}
