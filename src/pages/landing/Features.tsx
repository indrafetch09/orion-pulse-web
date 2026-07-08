import { Link } from "react-router";
import {
  ArrowRight,
  Activity,
  Shield,
  Cpu,
  Terminal,
  Server,
  Brain,
  Heart,
} from "lucide-react";
import { FaReact, FaNodeJs, FaGithub } from "react-icons/fa";
import {
  SiTypescript,
  SiMongodb,
  SiSocketdotio,
  SiGooglegemini,
} from "react-icons/si";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/stores/authStore";

export function Features() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        {/* Hero Section */}
        <main className="min-h-screen pt-21 pb-20 px-6 lg:px-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Glow Effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

          <h1
            className="text-5xl md:text-7xl font-extrabold text-secondary-foreground bg-clip-text max-w-4xl tracking-tight mb-6 animate-fade-in"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            Orionpulse
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed animate-fade-in"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            Instantly detect, analyze, and resolve port failures across your
            infrastructure with Gemini AI. Keep your services running
            seamlessly.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold px-8 py-3.5 rounded-md transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(36,150,237,0.4)] w-full sm:w-auto"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}{" "}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#"
              className="flex items-center justify-center gap-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-base font-medium px-8 py-3.5 rounded-md transition-all border border-border w-full sm:w-auto"
            >
              <FaGithub className="text-2xl gap" />
              View on github
            </a>
          </div>
        </main>

        {/* Install Guide Section */}
        <section className="py-16 px-6 lg:px-12">
          <div
            className="max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "350ms", animationFillMode: "both" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
              Get started in seconds
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Install the CLI agent globally, then login and start monitoring.
            </p>
            <div className="rounded-xl border border-border bg-sidebar overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-sidebar/80">
                <span className="w-3 h-3 rounded-full bg-destructive/60" />
                <span className="w-3 h-3 rounded-full bg-warning/60" />
                <span className="w-3 h-3 rounded-full bg-[var(--color-success)]/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                  ~/.bash
                </span>
              </div>
              <div className="p-5 font-mono text-sm space-y-3 text-foreground/90">
                <p>
                  <span className="text-muted-foreground select-none">$ </span>
                  npm install -g orionpulse-cli
                </p>
                <p>
                  <span className="text-muted-foreground select-none">$ </span>
                  orionpulse login
                </p>
                <p>
                  <span className="text-muted-foreground select-none">$ </span>
                  orionpulse start
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              That's it. Your ports are now being monitored with AI diagnostics.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 lg:px-12 bg-sidebar/50 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div
              className="text-center mb-16 animate-fade-in"
              style={{ animationDelay: "400ms", animationFillMode: "both" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Orionpulse?
              </h2>
              <p className="text-muted-foreground text-lg">
                Everything you need to maintain 100% uptime.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div
                className="bg-card border border-border p-8 rounded-3xl hover:bg-card/80 transition-colors group animate-fade-in"
                style={{ animationDelay: "500ms", animationFillMode: "both" }}
              >
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Real-time Telemetry
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor all your critical server ports via a blazing fast
                  WebSocket connection. Get instant alerts when a port goes
                  down.
                </p>
              </div>

              <div
                className="bg-card border border-border p-8 rounded-3xl hover:bg-card/80 transition-colors group animate-fade-in"
                style={{ animationDelay: "600ms", animationFillMode: "both" }}
              >
                <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  AI-Powered Insights
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  When a port fails, our Gemini AI instantly analyzes the
                  failure and provides actionable, step-by-step remediation
                  strategies.
                </p>
              </div>

              <div
                className="bg-card border border-border p-8 rounded-3xl hover:bg-card/80 transition-colors group animate-fade-in"
                style={{ animationDelay: "700ms", animationFillMode: "both" }}
              >
                <div className="w-12 h-12 bg-[var(--color-success)]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-[var(--color-success)]" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Secure & Lightweight
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Built with a lightweight CLI agent that runs seamlessly on
                  your servers, ensuring minimal overhead and maximum security.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground text-center mb-16 text-lg">
              Three steps from install to insight.
            </p>
            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-border" />
              {[
                {
                  icon: Terminal,
                  step: "1",
                  title: "Install & Login",
                  desc: "Install the CLI with npm globally and authenticate with your Orionpulse account via browser.",
                },
                {
                  icon: Server,
                  step: "2",
                  title: "Agent Scans Ports",
                  desc: "The CLI daemon probes your local ports every 10 seconds and sends telemetry to the backend via WebSocket.",
                },
                {
                  icon: Brain,
                  step: "3",
                  title: "AI Diagnoses Failures",
                  desc: "When a port goes down, Gemini AI instantly generates a root-cause analysis and step-by-step fix.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative z-10 w-24 h-24 rounded-2xl bg-card border border-border flex items-center justify-center mb-6 group hover:border-primary/50 transition-colors">
                    <item.icon className="w-10 h-10 text-primary" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-24 px-6 lg:px-12 bg-sidebar/50 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              Built with modern tech
            </h2>
            <p className="text-muted-foreground text-center mb-12 text-lg">
              Proven tools, zero bloat.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { icon: FaReact, label: "React", color: "text-[#61DAFB]" },
                {
                  icon: SiTypescript,
                  label: "TypeScript",
                  color: "text-[#3178C6]",
                },
                { icon: FaNodeJs, label: "Express", color: "text-[#68A063]" },
                { icon: SiMongodb, label: "MongoDB", color: "text-[#47A248]" },
                {
                  icon: SiSocketdotio,
                  label: "Socket.io",
                  color: "text-foreground",
                },
                {
                  icon: SiGooglegemini,
                  label: "Gemini AI",
                  color: "text-[#886FBF]",
                },
              ].map((tech) => (
                <div
                  key={tech.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors group"
                >
                  <tech.icon
                    className={`text-2xl ${tech.color} group-hover:scale-110 transition-transform`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {tech.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Source CTA Section */}
        <section className="py-24 px-6 lg:px-12 bg-sidebar/50 border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Open Source
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Orionpulse is fully open source. Star it, fork it, contribute —
              let's build better infra tooling together.
            </p>
            <a
              href="https://github.com/indrafetch09/orion-pulse-web"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-foreground text-background font-semibold px-8 py-3.5 rounded-md hover:opacity-90 transition-opacity"
            >
              <FaGithub className="text-xl" />
              Star on GitHub
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border">
          <p>© 2026 Orionpulse. Built for the modern web.</p>
        </footer>
      </div>
    </>
  );
}
