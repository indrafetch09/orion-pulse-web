import { Link } from "react-router";
import { Code, Menu, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import orionLogo from "@/assets/orionpulse_outline.svg";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-background/70 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white cursor-pointer transition-opacity">
          <Link to="/" className="flex items-center gap-2 text-lg">
            <img className="h-8 w-8 " src={orionLogo} alt="Orionpulse logo" />
            <span>Orionpulse</span>
          </Link>
          <div className="ml-12">
            <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">
                <Link to="/Features">Features</Link>
              </li>
              <li className="hover:text-foreground transition-colors cursor-pointer">
                <Link to="/docs">Docs</Link>
              </li>
              <li className="hover:text-foreground transition-colors cursor-pointer">
                <a
                  href="https://github.com/indrafetch09/orion-pulse-web/"
                  className="flex items-center gap-1"
                >
                  <Code className="w-4 h-4" /> Github
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md transition-all hover:shadow-[0_0_15px_rgba(36,150,237,0.4)]"
          >
            {isAuthenticated ? "Dashboard" : "Sign In"}
          </Link>

          {/* Mobile Menu Toggler */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-white transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed top-[69px] inset-x-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border p-6 animate-in slide-in-from-top duration-200">
          <ul className="flex flex-col gap-4 text-base font-semibold text-muted-foreground">
            <li className="hover:text-white transition-colors">
              <Link to="/Features" onClick={() => setMobileOpen(false)}>Features</Link>
            </li>
            <li className="hover:text-white transition-colors">
              <Link to="/docs" onClick={() => setMobileOpen(false)}>Docs</Link>
            </li>
            <li className="hover:text-white transition-colors">
              <a
                href="https://github.com/indrafetch09/orion-pulse-web/"
                className="flex items-center gap-1.5"
                onClick={() => setMobileOpen(false)}
              >
                <Code className="w-5 h-5" /> Github
              </a>
            </li>
            <hr className="border-border my-2" />
            <li>
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="block text-center bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-3 rounded-md transition-all w-full"
              >
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
