import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { AUTH_BACKEND_URL, type User } from '@/types/auth';
import logo from '@/assets/bhawna-logo.png';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('No token returned from the sign-in flow.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${AUTH_BACKEND_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('invalid');
        const user: User = await res.json();
        if (cancelled) return;
        setSession(token, user);
        navigate('/analyse', { replace: true });
      } catch {
        if (!cancelled) setError("We couldn't complete your sign-in. The link may have expired.");
      }
    })();
    return () => { cancelled = true; };
  }, [params, navigate, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-6">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[400px] bg-grid pointer-events-none opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md text-center"
      >
        <div className="rounded-3xl surface-1 hairline p-10">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden bg-background ring-1 ring-border mx-auto mb-6">
            <img
              src={logo}
              alt=""
              className={`w-full h-full object-contain p-1 ${error ? '' : 'animate-pulse'}`}
              width={64}
              height={64}
            />
          </div>

          {error ? (
            <>
              <h1 className="font-serif text-2xl mb-3">Something went wrong</h1>
              <Alert variant="destructive" className="rounded-xl text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={loginWithGoogle} className="rounded-full mt-6 bg-foreground text-background hover:bg-foreground/90">
                Try again
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="w-7 h-7 mx-auto mb-4 animate-spin text-primary" />
              <h1 className="font-serif text-2xl text-foreground">Signing you in…</h1>
              <p className="text-sm text-muted-foreground mt-2">Verifying your credentials — this only takes a moment.</p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
