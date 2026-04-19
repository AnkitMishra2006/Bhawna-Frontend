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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const { isAuthenticated, isLoading, loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/analyse', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const handleGoogle = () => {
    setGoogleLoading(true);
    loginWithGoogle();
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!name.trim()) errors.name = 'Name is required.';
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    const result = await register(email.trim(), password, name.trim());
    setSubmitting(false);
    if (!result.success) {
      setServerError(result.error || 'Could not create your account.');
      return;
    }
    navigate('/analyse', { replace: true });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[600px] bg-grid pointer-events-none opacity-60" />
      <div className="absolute -right-40 top-20 w-[520px] h-[520px] rounded-full bg-primary/15 blur-[140px] pointer-events-none" />
      <div className="absolute -left-40 bottom-0 w-[420px] h-[420px] rounded-full bg-accent/15 blur-[140px] pointer-events-none" />

      <header className="relative max-w-[1200px] w-full mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2.5">
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
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground text-center mt-3 leading-relaxed">
                Start reading emotions in real time. Your video never leaves your device — we just need to know who you are.
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
                    Sign up with Google
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3 my-6">
                <span className="flex-1 h-px bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or sign up with email</span>
                <span className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="h-11 rounded-xl"
                  />
                  {fieldErrors.name && <p className="text-destructive text-xs">{fieldErrors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl"
                  />
                  {fieldErrors.email && <p className="text-destructive text-xs">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-11 rounded-xl"
                  />
                  {fieldErrors.password && <p className="text-destructive text-xs">{fieldErrors.password}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={submitting || googleLoading}
                  className="w-full h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
                </Button>

                {serverError && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}
              </form>

              <p className="text-sm text-muted-foreground text-center mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>

              <p className="text-[11px] text-muted-foreground/60 text-center mt-6 leading-relaxed">
                By creating an account, you agree to our{' '}
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
