import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Camera, Brain, FileText, Zap, Shield, Gauge,
  Sparkles, Users, GraduationCap, Film, MessageSquare, ChevronRight,
} from 'lucide-react';
import { EMOTION_COLORS, EMOTION_EMOJIS, EMOTION_NAMES } from '@/types/emotion';
import { Button } from '@/components/ui/button';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import heroIllustration from '@/assets/illustration-hero.png';
import captureIllustration from '@/assets/illustration-capture.png';
import analyseIllustration from '@/assets/illustration-analyse.png';
import reportIllustration from '@/assets/illustration-report.png';

const stats = [
  { value: '7', label: 'Emotions detected' },
  { value: '5fps', label: 'Real-time analysis' },
  { value: '2', label: 'AI models compared' },
  { value: '0ms', label: 'Data leaves device' },
];

const features = [
  {
    icon: Zap,
    title: 'Real-time inference',
    desc: 'Frames stream over WebSocket at 5fps and return classified within 80ms — fast enough to feel alive.',
  },
  {
    icon: Gauge,
    title: 'Side-by-side benchmarking',
    desc: 'Run our custom EmotionNet against DeepFace on the same input and watch them disagree in real time.',
  },
  {
    icon: Sparkles,
    title: 'AI-written reports',
    desc: 'Gemini summarises every session into a readable narrative — peaks, valleys, and mood arcs included.',
  },
  {
    icon: Shield,
    title: 'Local-first by design',
    desc: 'Your video never touches a database. Frames are scored, summarised, and discarded on the spot.',
  },
];

const useCases = [
  {
    icon: Film,
    tag: 'Creators',
    title: 'Test your hook in the first three seconds',
    desc: 'Drop in a rough cut and see exactly when your viewer goes from neutral to surprised — or bored.',
  },
  {
    icon: GraduationCap,
    tag: 'Researchers',
    title: 'Reproducible affect studies',
    desc: 'Two open models, identical preprocessing, exportable timelines. Compare and cite without the setup tax.',
  },
  {
    icon: MessageSquare,
    tag: 'UX teams',
    title: 'Watch users feel your product',
    desc: 'Pair a webcam with a usability test and surface the moments where confusion turns to delight.',
  },
];

const faqs = [
  {
    q: 'Do you store my video or webcam feed?',
    a: 'No. Frames are sent to your local backend over WebSocket, scored in memory, and immediately discarded. We never persist video or images.',
  },
  {
    q: 'Which emotions are detected?',
    a: 'Seven categories from the FER taxonomy: angry, disgust, fear, happy, neutral, sad and surprise. Each frame returns a probability for all seven.',
  },
  {
    q: 'What is the difference between the two models?',
    a: 'EmotionNet is our compact CNN trained on FER-2013. DeepFace uses the open-source mini_XCEPTION model. They often agree — but the disagreements are where it gets interesting.',
  },
  {
    q: 'Can I run this without a backend?',
    a: 'You need the FastAPI servers running on ports 8000 (EmotionNet) and 8001 (DeepFace). The frontend will surface a clear connection error if either is unreachable.',
  },
];

const steps = [
  { n: '01', icon: Camera, title: 'Capture', desc: 'Drop a video file or grant webcam access. Nothing uploads — everything runs against your local model server.' },
  { n: '02', icon: Brain, title: 'Analyse', desc: 'Frames stream at 5fps. Both models score seven emotions per frame and a smoothed timeline builds in real time.' },
  { n: '03', icon: FileText, title: 'Report', desc: 'When you stop, Gemini reads the timeline and writes a narrative summary you can download or share.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Aurora backdrop */}
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[600px] bg-grid pointer-events-none opacity-60" />

      <div className="relative">
        <SiteNav />

        {/* HERO */}
        <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-32 md:pt-28 md:pb-40 relative">
          {/* Floating hero illustration — desktop only */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="hidden lg:block absolute right-0 top-32 w-[420px] pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full" />
            <img
              src={heroIllustration}
              alt=""
              className="relative w-full h-auto animate-float-slow drop-shadow-2xl"
              width={420}
              height={420}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center relative"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full surface-2 hairline text-xs text-muted-foreground mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Two open models · live on your device
            </span>

            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[0.95] text-balance max-w-5xl">
              Read every flicker of{' '}
              <em className="italic text-gradient-primary">expression</em>,
              <br className="hidden md:block" />
              frame by frame.
            </h1>

            <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed text-balance">
              EmotionTrack is a research-grade facial affect analyser. Drop in a video,
              go live with your webcam, and watch two AI models read the room in real time.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="rounded-full h-12 px-7 bg-foreground text-background hover:bg-foreground/90 group">
                <Link to="/analyse">
                  Start analysing
                  <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full h-12 px-7 hover:bg-secondary">
                <Link to="/compare">
                  Compare models
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Hero panel: mock dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="relative w-full mt-20 max-w-5xl"
            >
              <div className="absolute -inset-x-20 -inset-y-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl pointer-events-none" />
              <div className="relative rounded-2xl surface-1 hairline shadow-elevated overflow-hidden p-1.5">
                <div className="rounded-xl surface-2 overflow-hidden">
                  {/* Window chrome */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      session_2025_04_18 · port 8000
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-1.5 p-1.5">
                    {/* Left preview */}
                    <div className="relative aspect-video rounded-lg bg-gradient-to-br from-primary/30 via-purple-500/20 to-accent/30 overflow-hidden">
                      <div className="absolute inset-0 bg-noise opacity-40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[120px] animate-float-slow drop-shadow-2xl">😄</div>
                      </div>
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-background/60 backdrop-blur text-[10px] text-emerald-300 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Face detected
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <div className="font-mono text-[10px] text-foreground/60">DOMINANT</div>
                          <div className="font-serif text-3xl text-foreground">Happy · 87%</div>
                        </div>
                      </div>
                    </div>

                    {/* Right scores */}
                    <div className="aspect-video rounded-lg surface-1 p-5 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground">Live scores</span>
                        <span className="font-mono text-[10px] text-muted-foreground">5fps</span>
                      </div>
                      {[
                        { e: 'happy', v: 87 },
                        { e: 'surprise', v: 42 },
                        { e: 'neutral', v: 28 },
                        { e: 'sad', v: 12 },
                        { e: 'fear', v: 6 },
                        { e: 'angry', v: 3 },
                        { e: 'disgust', v: 1 },
                      ].map((row) => (
                        <div key={row.e} className="flex items-center gap-3">
                          <span className="w-16 text-[11px] capitalize text-muted-foreground">{row.e}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${row.v}%`, backgroundColor: EMOTION_COLORS[row.e as keyof typeof EMOTION_COLORS] }}
                            />
                          </div>
                          <span className="font-mono text-[10px] w-8 text-right text-muted-foreground">{row.v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-20 w-full max-w-4xl border border-border rounded-2xl overflow-hidden surface-1">
              {stats.map((s) => (
                <div key={s.label} className="surface-1 p-6 text-center">
                  <div className="font-serif text-4xl text-foreground">{s.value}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* TRUST / EMOTIONS STRIP */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Seven emotions, one consistent palette across every chart
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {EMOTION_NAMES.map((em) => (
              <span
                key={em}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium hairline"
                style={{
                  backgroundColor: `${EMOTION_COLORS[em]}14`,
                  color: EMOTION_COLORS[em],
                }}
              >
                <span className="text-base leading-none">{EMOTION_EMOJIS[em]}</span>
                <span className="capitalize">{em}</span>
              </span>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="max-w-2xl mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">Why EmotionTrack</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 leading-tight text-balance">
              Built for people who care about{' '}
              <em className="italic text-muted-foreground">what the model is actually seeing.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden hairline">
            {features.map((f) => (
              <div key={f.title} className="surface-1 p-8 md:p-10 group hover:surface-2 transition-colors">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-2xl mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">Workflow</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4">
              From upload to <em className="italic">narrative</em> in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const stepIllustrations = [captureIllustration, analyseIllustration, reportIllustration];
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative rounded-2xl surface-1 hairline p-8 group hover:shadow-elevated transition-shadow overflow-hidden"
                >
                  {/* Illustration as soft watermark */}
                  <img
                    src={stepIllustrations[i]}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={180}
                    height={180}
                    className="absolute -right-6 -bottom-6 w-44 h-44 opacity-[0.18] group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                      <span className="font-serif text-5xl text-muted-foreground/40">{step.n}</span>
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-secondary group-hover:bg-primary/10 transition-colors">
                        <step.icon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <h3 className="font-serif text-2xl mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* USE CASES */}
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="grid md:grid-cols-12 gap-10 mb-16">
            <div className="md:col-span-5">
              <span className="text-xs uppercase tracking-[0.2em] text-primary">Made for</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-4 leading-tight">
                Whoever needs to know <em className="italic">how it landed.</em>
              </h2>
            </div>
            <div className="md:col-span-7 flex items-end">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you ship videos, study affect, or watch users tap through prototypes —
                EmotionTrack turns reactions into structured signal you can actually compare.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((u) => (
              <div key={u.title} className="rounded-2xl surface-1 hairline p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary">
                    <u.icon className="w-4 h-4 text-foreground" />
                  </span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{u.tag}</span>
                </div>
                <h3 className="font-serif text-2xl leading-snug mb-3">{u.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{u.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-[1000px] mx-auto px-6 py-24">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-5">
              <span className="text-xs uppercase tracking-[0.2em] text-primary">FAQ</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-4 leading-tight">
                Questions, <em className="italic">answered.</em>
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Everything you'd want to know before pointing a camera at yourself.
              </p>
            </div>
            <div className="md:col-span-7">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-border">
                    <AccordionTrigger className="text-left font-serif text-xl hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="relative rounded-3xl overflow-hidden hairline">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary-glow/20 to-accent/20" />
            <div className="absolute inset-0 bg-noise opacity-40" />
            <div className="relative px-8 md:px-16 py-20 text-center">
              <Sparkles className="w-7 h-7 text-foreground mx-auto mb-6" />
              <h2 className="font-serif text-4xl md:text-6xl leading-tight max-w-3xl mx-auto text-balance">
                Point a camera. <em className="italic">See what it sees.</em>
              </h2>
              <p className="mt-6 text-lg text-foreground/80 max-w-xl mx-auto">
                No accounts. No uploads. Just open it and start.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="rounded-full h-12 px-7 bg-foreground text-background hover:bg-foreground/90">
                  <Link to="/analyse">
                    Open the analyser
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full h-12 px-7 text-foreground hover:bg-foreground/10">
                  <Link to="/compare">Compare models</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
