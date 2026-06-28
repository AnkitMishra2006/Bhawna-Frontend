import { Link } from 'react-router-dom';
import { Github, Twitter } from 'lucide-react';
import logo from '@/assets/bhawna-logo.png';

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-border mt-32">
      <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-background ring-1 ring-border">
              <img src={logo} alt="Bhawna logo" className="w-full h-full object-contain p-0.5" width={36} height={36} loading="lazy" />
            </span>
            <span className="font-serif text-2xl">Bhawna</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Real-time facial emotion analysis for researchers, product teams and creators.
            Built with PyTorch, FastAPI and Google Gemini.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/analyse" className="text-foreground/80 hover:text-foreground">Analyse</Link></li>
            <li><Link to="/compare" className="text-foreground/80 hover:text-foreground">Compare</Link></li>
            <li><Link to="/" className="text-foreground/80 hover:text-foreground">How it works</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Models</h4>
          <ul className="space-y-2 text-sm">
            <li className="text-foreground/80">EmotionNet (FER)</li>
            <li className="text-foreground/80">DeepFace</li>
            <li className="text-foreground/80">mini_XCEPTION</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="text-foreground/80 hover:text-foreground">Documentation</a></li>
            <li><a href="#" className="text-foreground/80 hover:text-foreground">API reference</a></li>
            <li><a href="#" className="text-foreground/80 hover:text-foreground">Privacy</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bhawna. All analysis runs locally — your video is never stored.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            v1.0.0 · powered by PyTorch + Gemini
          </p>
        </div>
      </div>
    </footer>
  );
}
