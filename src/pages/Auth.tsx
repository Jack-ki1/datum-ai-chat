import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import fineseLogoAsset from '@/assets/finese-logo.png.asset.json';
const fineseLogo = fineseLogoAsset.url;

export default function Auth() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate('/chat', { replace: true });
  }, [session, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/chat` },
        });
        if (error) throw error;
        toast.success('Account created. Signing you in…');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back');
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed';
      toast.error(msg.includes('already registered') ? 'Email already in use — try signing in instead.' : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background flourish */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[42rem] h-[42rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[36rem] h-[36rem] rounded-full bg-datum-cyan/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-[2px] rounded-2xl bg-gradient-to-br from-primary via-datum-violet to-datum-cyan shadow-lg">
            <img src={fineseLogo} alt="FINESE AI" className="w-14 h-14 rounded-2xl object-contain" />
          </div>
          <h1 className="mt-5 font-display font-extrabold text-3xl tracking-tight text-foreground">
            FINESE <span className="bg-gradient-to-r from-primary to-datum-cyan bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace'}
          </p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl shadow-xl p-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Email</Label>
            <Input id="email" type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Password</Label>
            <Input id="password" type="password" required minLength={8}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters" className="h-11 rounded-xl" />
          </div>

          <Button type="submit" disabled={busy}
            className="w-full h-11 rounded-xl font-medium gap-2 shadow-md hover:shadow-lg transition-shadow">
            {busy ? (
              <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-1">
            {mode === 'signin' ? (
              <>New here?{' '}
                <button type="button" onClick={() => setMode('signup')}
                  className="text-primary font-medium hover:underline">Create an account</button>
              </>
            ) : (
              <>Have an account?{' '}
                <button type="button" onClick={() => setMode('signin')}
                  className="text-primary font-medium hover:underline">Sign in</button>
              </>
            )}
          </div>
        </form>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Your datasets are private to your account. <Link to="/" className="hover:text-foreground">Home</Link>
        </p>
      </div>
    </div>
  );
}