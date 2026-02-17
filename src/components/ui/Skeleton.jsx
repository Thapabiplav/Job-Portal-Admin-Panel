export function Skeleton({ className = '', ...rest }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/10 ${className}`}
      aria-hidden
      {...rest}
    />
  );
}
