import { Link } from "react-router";
import { ArrowRight, Activity, Shield, Cpu } from "lucide-react";
import Navbar from "@/components/Navbar";
import { FaGithub } from "react-icons/fa";
import { useAuthStore } from "@/stores/authStore";

export function Features() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        {/* Hero Section */}
        <main className="pt-32 pb-20 px-6 lg:px-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Glow Effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

          <h1
            className="text-5xl md:text-7xl font-extrabold text-secondary-foreground bg-clip-text  max-w-4xl tracking-tight mb-6 animate-fade-in"
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

        <section></section>

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

        {/* Footer */}
        <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border">
          <p>© 2026 Orionpulse. Built for the modern web.</p>
        </footer>
      </div>
    </>
  );
}
