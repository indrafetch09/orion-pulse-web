import { useState } from "react";
import { Link } from "react-router";
import { Code, Search, Menu, X } from "lucide-react";
import { Input } from "./ui/input";
import orionLogo from "@/assets/orionpulse_outline.svg";

export default function DocsNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-background/70 backdrop-blur-md border-b border-border">
        {/* Left Side: Logo & Links */}
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white cursor-pointer transition-opacity">
          <Link to="/" className="flex items-center gap-2 text-lg">
            <img className="h-8 w-8" src={orionLogo} alt="Orionpulse logo" />
            <span>Orionpulse</span>
          </Link>
          <div className="ml-12">
            <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
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

        {/* Right Side: Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search docs"
              className="font-normal w-56 pl-9"
            />
          </div>
          <Link
            to="/"
            className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md transition-all hover:shadow-[0_0_15px_rgba(36,150,237,0.4)]"
          >
            Go Back
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
            {/* Mobile search bar */}
            <li className="sm:hidden mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search docs"
                  className="font-normal w-full pl-9 bg-background"
                />
              </div>
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
                to="/"
                onClick={() => setMobileOpen(false)}
                className="block text-center bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-3 rounded-md transition-all w-full"
              >
                Go Back
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
