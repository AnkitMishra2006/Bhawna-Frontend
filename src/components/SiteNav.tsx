import { Link, useLocation } from 'react-router-dom';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo from '@/assets/emotiontrack-logo.png';

const links = [
  { to: '/', label: 'Home' },
  { to: '/analyse', label: 'Analyse' },
  { to: '/compare', label: 'Compare' },
];

export default function SiteNav() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-b border-border" />
      <nav className="relative max-w-[1200px] mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-border shadow-glow">
            <img
              src={logo}
              alt="EmotionTrack logo"
              className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500"
              width={36}
              height={36}
            />
          </span>
          <span className="font-serif text-2xl tracking-tight text-foreground">
            EmotionTrack
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 surface-2 rounded-full p-1 hairline">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-full transition-all',
                  active
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <Button asChild size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            <Link to="/analyse">Launch app</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
