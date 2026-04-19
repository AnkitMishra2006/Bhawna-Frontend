import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-10 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to home
        </Link>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            {eyebrow && (
              <span className="text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
            )}
            <h1 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
