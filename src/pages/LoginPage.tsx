import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import GoogleIcon from '@/components/GoogleIcon';
import logo from '@/assets/bhawna-logo.png';

export default function LoginPage() {
  const { isAuthenticated, isLoading, loginWithGoogle, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/analyse', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const handleGoogle = () => {
    setGoogleLoading(true);
    loginWithGoogle();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await loginWithEmail(email.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Sign-in failed.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[600px] bg-grid pointer-events-none opacity-60" />
      <div className="absolute -right-40 top-20 w-[520px] h-[520px] rounded-full bg-primary/15 blur-[140px] pointer-events-none" />
      <div className="absolute -left-40 bottom-0 w-[420px] h-[420px] rounded-full bg-accent/15 blur-[140px] pointer-events-none" />

      <header className="relative max-w-[1200px] w-full mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-background ring-1 ring-border">
            <img src={logo} alt="Bhawna logo" className="w-full h-full object-contain p-0.5" width={36} height={36} />
          </span>
          <span className="font-serif text-2xl tracking-tight text-foreground">Bhawna</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back home
        </Link>
      </header>

      <main className="relative flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl surface-1 hairline shadow-elevated p-1.5">
            <div className="rounded-[20px] surface-2 p-8 md:p-10">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden bg-background ring-1 ring-border mx-auto">
                <img src={logo} alt="" className="w-full h-full object-contain p-1" width={56} height={56} />
              </div>
              <p className="text-center mt-3 font-serif text-xl tracking-tight">Bhawna</p>

              <h1 className="font-serif text-3xl md:text-4xl text-center mt-6 leading-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground text-center mt-3 leading-relaxed">
                Sign in to access the emotion analyser, compare models, and generate AI-powered session reports.
              </p>

              <Button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || submitting}
                className="w-full mt-7 h-11 rounded-full bg-white text-gray-800 hover:bg-gray-100 shadow-sm font-medium"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4 mr-1" />
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3 my-6">
                <span className="flex-1 h-px bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or continue with email</span>
                <span className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || googleLoading}
                  className="w-full h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
                </Button>

                {error && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>

              <p className="text-sm text-muted-foreground text-center mt-6">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Create one
                </Link>
              </p>

              <p className="text-[11px] text-muted-foreground/60 text-center mt-6 leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="#" className="hover:text-muted-foreground">Terms of Service</a> and{' '}
                <a href="#" className="hover:text-muted-foreground">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
