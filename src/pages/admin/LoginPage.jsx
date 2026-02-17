import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login, clearError, selectAuthLoading, selectAuthError } from '../../features/auth/authSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const from = location.state?.from?.pathname ?? '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      toast.success('Logged in successfully');
      const user = result.payload;
      if (user?.role === 'superadmin') {
        navigate(from, { replace: true });
      } else {
        navigate('/job-portal/dashboard', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-surface p-0 md:p-6">
      <div
        className="w-full max-w-[900px] bg-surface-soft rounded-none md:rounded-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row md:min-h-[520px]"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {/* Image Section */}
        <div className="relative w-full h-[200px] md:w-1/2 md:h-auto md:shrink-0">
          <img
            src="https://i.imgur.com/j59pDPg.jpeg"
            alt="Login Cover"
            className="w-full h-full object-cover block"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom right, rgba(249,115,22,0.4), rgba(234,88,12,0.1), rgba(0,0,0,0.6))',
            }}
          />
          <div className="absolute bottom-6 left-6 right-6 text-text-primary">
            <h2 className="text-xl font-semibold m-0 mb-1">Welcome Back</h2>
            <p className="text-sm text-text-secondary m-0">Login to continue your journey</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full p-6 md:w-1/2 md:p-5 md:flex md:items-center md:justify-center bg-surface-soft border-t md:border-t-0 md:border-l border-white/5 rounded-b-2xl md:rounded-r-2xl overflow-y-auto">
          <div className="w-full max-w-95 mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4 md:mb-2">
              <div
                className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-primary-darker text-white font-bold text-base flex items-center justify-center shrink-0"
                style={{ boxShadow: 'var(--shadow-glow)' }}
              >
                JP
              </div>
              <span className="text-text-primary text-lg font-semibold tracking-wide">Job Portal Admin</span>
            </div>

            <h1 className="text-text-primary text-2xl md:text-xl font-semibold m-0 mb-2 md:mb-1">Login Account</h1>
            <p className="text-text-secondary text-sm m-0 mb-6 md:mb-4">Please enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-3">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" role="alert">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="relative my-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[1.1rem] h-[1.1rem] text-text-muted pointer-events-none" />
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full bg-input border border-white/10 text-text-primary rounded-xl pl-11 pr-4 py-3 md:py-2.5 text-base md:text-[0.9375rem] min-h-[48px] md:min-h-[44px] outline-none transition-ui placeholder-text-muted hover:bg-hover focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Password */}
              <div className="relative my-1">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[1.1rem] h-[1.1rem] text-text-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-input border border-white/10 text-text-primary rounded-xl pl-11 pr-12 py-3 md:py-2.5 text-base md:text-[0.9375rem] min-h-[48px] md:min-h-[44px] outline-none transition-ui placeholder-text-muted hover:bg-hover focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-0 flex items-center text-text-muted hover:text-accent transition-ui"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className=" cursor-pointer w-full mt-3 md:mt-2 min-h-[48px] md:min-h-[42px] rounded-xl bg-linear-to-r from-primary to-primary-dark text-white font-medium text-[0.95rem] md:text-sm flex items-center justify-center gap-2 hover:from-primary-dark hover:to-primary-darker active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-ui"
                style={{ boxShadow: 'var(--shadow-glow)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin shrink-0" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
