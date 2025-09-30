/**
 * Login Page
 *
 * Handles user authentication with three modes:
 * 1. Login with username/password
 * 2. Register new account
 * 3. Play as guest
 */

'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerUser, checkUsername } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
  });

  // Check if guest mode is requested via URL
  useEffect(() => {
    if (searchParams.get('mode') === 'guest') {
      handleGuestLogin();
    }
  }, [searchParams]);

  // Real-time username availability check
  useEffect(() => {
    if (mode === 'register' && formData.username.length >= 5) {
      const timeoutId = setTimeout(async () => {
        setCheckingUsername(true);
        const result = await checkUsername(formData.username);
        setUsernameAvailable(result.available);
        setCheckingUsername(false);
        if (!result.available && result.error) {
          setError(result.error);
        } else {
          setError('');
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
    }
  }, [formData.username, mode]);

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('guest', {
        redirect: false,
      });

      if (result?.error) {
        setError('Failed to create guest account');
        setLoading(false);
        return;
      }

      router.push('/lobby');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }

      router.push('/lobby');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await registerUser({
        username: formData.username,
        password: formData.password,
        email: formData.email || undefined,
      });

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const loginResult = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError('Registration successful, but login failed. Please try logging in.');
        setMode('login');
        setLoading(false);
        return;
      }

      router.push('/lobby');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Computer Chess</h1>
          <p className="text-gray-400">&quot;The next lichess&quot; - nobody ever</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Account'}
              {mode === 'guest' && 'Play as Guest'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' && 'Sign in to your account to start playing'}
              {mode === 'register' && 'Register a new account to save your progress'}
              {mode === 'guest' && 'Play without an account'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode('register')}
                    disabled={loading}
                  >
                    Create New Account
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleGuestLogin}
                    disabled={loading}
                  >
                    Play as Guest
                  </Button>
                </div>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input
                    id="reg-username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={5}
                    maxLength={30}
                    autoComplete="username"
                  />
                  {checkingUsername && (
                    <p className="text-xs text-muted-foreground">Checking availability...</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-xs text-green-500">Username available!</p>
                  )}
                  {usernameAvailable === false && (
                    <p className="text-xs text-destructive">Username already taken</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    5-30 characters, letters, numbers, and underscores only
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    For account recovery
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || usernameAvailable === false}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  disabled={loading}
                >
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}