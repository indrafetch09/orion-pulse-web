import { Link } from "react-router";
import { Activity, Code, Search } from "lucide-react";
import { Input } from "./ui/input";

export default function DocsNavbar() {
  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-background/70 backdrop-blur-md border-b border-border">
        {/* Left Side: Logo & Links */}
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white cursor-pointer transition-opacity">
          <Activity className="text-primary w-6 h-6" />
          <span className="text-lg">
            <Link to="/">Orionpulse</Link>
          </span>
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

        {/* Right Side: Search */}
        <div className="flex items-center gap-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search docs"
              // value={search}
              // onChange={(e) => setSearch(e.target.value)}
              className="font-normal w-56 pl-9"
            />
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={"/"}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md transition-all hover:shadow-[0_0_15px_rgba(36,150,237,0.4)]"
            >
              Go Back
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
