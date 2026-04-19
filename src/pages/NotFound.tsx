import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import SiteNav from '@/components/SiteNav';

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[500px] bg-grid pointer-events-none opacity-50" />

      <div className="relative">
        <SiteNav />

        <main className="max-w-[900px] mx-auto px-6 py-24 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-[120px] md:text-[180px] text-muted-foreground/20 leading-none select-none">
              404
            </h1>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground -mt-4 md:-mt-8">
              This page doesn't exist
            </h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto leading-relaxed">
              The link you followed may be broken, or the page may have been moved.
            </p>
            <div className="mt-10">
              <Button asChild size="lg" className="rounded-full h-11 px-7 bg-foreground text-background hover:bg-foreground/90">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
