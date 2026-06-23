import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Activity, Loader2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/lib/api'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [deviceAuthorizing, setDeviceAuthorizing] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceCode = searchParams.get('device_code')

  const { login, register, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !deviceCode) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate, deviceCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      if (isRegister) {
        await register(email, username, password)
      } else {
        await login(email, password)
      }
      navigate('/', { replace: true })
    } catch {
      // Error is set in the store
    }
  }

  const handleDeviceAuthorize = async () => {
    if (!deviceCode) return
    setDeviceAuthorizing(true)
    try {
      await authAPI.authorizeDevice(deviceCode)
      // Show success briefly then redirect
      setTimeout(() => navigate('/', { replace: true }), 1500)
    } catch {
      // Error handling
      setDeviceAuthorizing(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Animated background gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.25 260) 0%, transparent 70%)',
            animation: 'float-slow 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.20 310) 0%, transparent 70%)',
            animation: 'float-slow 25s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute left-1/3 top-1/2 h-[400px] w-[400px] rounded-full opacity-10 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, oklch(0.75 0.18 160) 0%, transparent 70%)',
            animation: 'float-slow 15s ease-in-out infinite 5s',
          }}
        />
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -40px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(40px, 30px) scale(1.02); }
        }
      `}</style>

      <Card className="relative z-10 w-full max-w-md glass-strong animate-fade-in">
        <CardHeader className="items-center text-center">
          {/* Branding */}
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <CardTitle className="text-2xl font-bold tracking-tight">OrionPulse</CardTitle>
              <CardDescription className="text-xs">Local Network Monitoring System</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {deviceCode ? (
            /* Device Authorization Flow */
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Authorize Terminal Access</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A terminal is requesting access to your OrionPulse account.
                </p>
              </div>
              <div className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3">
                <span className="text-xs text-muted-foreground">Device Code</span>
                <p className="mt-1 font-mono text-lg font-bold tracking-widest text-foreground">
                  {deviceCode}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleDeviceAuthorize}
                isLoading={deviceAuthorizing}
              >
                Authorize Access
              </Button>
            </div>
          ) : (
            /* Login / Register Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Toggle tabs */}
              <div className="flex rounded-lg border border-border bg-muted/30 p-1">
                <button
                  type="button"
                  className={cn(
                    'flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
                    !isRegister
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => { setIsRegister(false); clearError() }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={cn(
                    'flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
                    isRegister
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => { setIsRegister(true); clearError() }}
                >
                  Register
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="email" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@orionpulse.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {isRegister && (
                  <div>
                    <label htmlFor="username" className="mb-1 block text-xs font-medium text-muted-foreground">
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" isLoading={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRegister ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
