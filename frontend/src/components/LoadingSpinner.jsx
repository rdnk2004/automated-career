export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="spinner-wrap">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 14 }}>
          {text}
        </p>
      </div>
    </div>
  );
}
