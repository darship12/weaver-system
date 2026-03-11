import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Gauge, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try { await login(data.username, data.password); toast.success('Welcome back!'); }
    catch (e: any) { toast.error(e?.response?.data?.detail || e?.response?.data?.message || 'Invalid credentials'); }
  };

  return (
    <div className="min-h-screen bg-[#060A14] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 0h40' stroke='%23ffffff' stroke-width='0.15' stroke-opacity='0.04'/%3E%3C/svg%3E\")", opacity: 1 }} />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative anim-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 mb-4 shadow-lg shadow-amber-500/20">
            <Gauge className="w-7 h-7 text-[#060A14]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Weaver System</h1>
          <p className="text-sm text-slate-400 mt-1">Production Tracking Platform</p>
        </div>

        <div className="rounded-2xl bg-[#0D1526] border border-[#1E2D44] p-6 shadow-2xl">
          <h2 className="text-base font-bold text-white mb-5">Sign in</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input {...register('username')} type="text" autoComplete="username" placeholder="Username"
                className={`input ${errors.username ? 'border-rose-500' : ''}`} />
              {errors.username && <p className="text-xs text-rose-400 mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="Password" className={`input pr-10 ${errors.password ? 'border-rose-500' : ''}`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center h-11 mt-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>
          <div className="mt-4 p-3 rounded-xl bg-[#060A14] border border-[#1E2D44]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500">Default: <span className="text-amber-400 font-mono">admin / admin123</span> — change after first login</p>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-slate-700 mt-5">Weaver Production Tracking v1.0</p>
      </div>
    </div>
  );
}
