import { useEffect } from "react";
import DocsNavbar from "@/components/DocsNavbar";

export default function Docs() {
  useEffect(() => {
    document.title = "Documentation | Orionpulse";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
      <DocsNavbar />
      <div className="text-center space-y-3 p-6 max-w-md animate-fade-in">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Coming Soon
        </h1>
        <p className="text-muted-foreground text-sm">
          We're writing the documentation for Orionpulse. Check back soon for guides and configuration references!
        </p>
      </div>
    </div>
  );
}
