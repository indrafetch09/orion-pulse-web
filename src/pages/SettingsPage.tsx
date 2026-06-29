import { useState } from "react";
import {
  User,
  Key,
  Terminal,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const sessionToken =
    useAuthStore((s) => s.token) ||
    localStorage.getItem("orionpulse_token") ||
    "";

  const [tokenVisible, setTokenVisible] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(sessionToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyCommand = async (command: string, index: number) => {
    await navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const maskedToken =
    sessionToken.slice(0, 8) + "•".repeat(24) + sessionToken.slice(-4);

  const cliSteps = [
    { label: "Install CLI", command: "npm install -g orionpulse-cli" },
    { label: "Authenticate CLI", command: `orionpulse login <your_token>` },
    { label: "Start Monitoring Agent", command: "orionpulse start" },
  ];

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground text-sm">
        Loading user settings profile...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Your registered account credentials
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Username
              </label>
              <p className="mt-1 text-sm font-medium text-foreground">
                {user.username}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <p className="mt-1 text-sm font-medium text-foreground">
                {user.email}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Account Created
              </label>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Token */}
      <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Key className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>API Access Token</CardTitle>
              <CardDescription>
                Use this token to connect your terminal manually. Keep it
                secure.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <code className="flex-1 text-sm font-mono text-foreground break-all">
              {tokenVisible ? sessionToken : maskedToken}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setTokenVisible(!tokenVisible)}
            >
              {tokenVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleCopyToken}
            >
              {copiedToken ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CLI Connection */}
      <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Terminal className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle>CLI Node Integration</CardTitle>
              <CardDescription>
                Run these commands in your server's terminal to start telemetry.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cliSteps.map((step, index) => (
              <div key={step.label} className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  {index + 1}. {step.label}
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                  <code className="flex-1 font-mono text-xs text-foreground break-all whitespace-pre-wrap">
                    {step.command}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopyCommand(step.command, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card
        className="animate-fade-in border-destructive/30"
        style={{ animationDelay: "150ms" }}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Delete Account
              </p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account Permanently</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your servers,
              ports, and scan logs will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(false)}
            >
              <AlertTriangle className="h-4 w-4" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
