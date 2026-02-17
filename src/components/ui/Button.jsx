export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  loading,
  className = '',
  ...rest
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-ui focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-soft focus:outline-none disabled:opacity-60 min-h-[44px] touch-manipulation tap-feedback';
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary-dark text-white hover:from-primary-dark hover:to-primary-darker focus:ring-accent shadow-[var(--shadow-glow)] hover:shadow-[0_0_20px_var(--color-accent-glow-strong)]',
    secondary: 'bg-hover text-text-primary border border-white/10 hover:bg-white/10 focus:ring-accent',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-text-secondary hover:bg-hover focus:ring-accent',
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          Loading…
        </>
      ) : (
        children
      )}
    </button>
  );
}
