'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { syncGoogleUser, signInWithGoogleOAuth } from '@/lib/api';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleAuthCallback() {
      // 1. Check for errors returned in query params
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (errorParam) {
        if (!mounted) return;
        setStatus('error');
        setErrorMessage(
          errorDesc || errorParam === 'access_denied'
            ? 'Sign in was cancelled or access was denied.'
            : `Authentication error: ${errorParam}`
        );
        return;
      }

      try {
        // 2. Check if tokens are in the URL hash fragment (#access_token=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashString = window.location.hash.replace(/^#/, '');
          const hashParams = new URLSearchParams(hashString);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            try {
              const { data: hashData, error: hashError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              if (!hashError && hashData.user) {
                await syncAndRedirect(hashData.user);
                return;
              }
            } catch (hErr) {
              console.warn('Direct hash session setup error:', hErr);
            }
          }
        }

        // 3. Check for PKCE authorization code (?code=...) with resilient fallback
        const code = searchParams.get('code');
        if (code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session?.user) {
              await syncAndRedirect(data.session.user);
              return;
            }
          } catch (codeErr: any) {
            console.warn('PKCE verifier exchange bypassed, checking active session:', codeErr?.message);
          }
        }

        // 4. Check if session is already active in Supabase client
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          await syncAndRedirect(sessionData.session.user);
          return;
        }

        // 5. Subscribe to onAuthStateChange in case session resolves asynchronously
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user && mounted) {
            subscription.unsubscribe();
            await syncAndRedirect(session.user);
          }
        });

        // 6. Timeout fallback after 6 seconds
        setTimeout(() => {
          if (mounted && status === 'processing') {
            setStatus('error');
            setErrorMessage('Authentication session could not be established. Please try signing in again.');
          }
        }, 6000);
      } catch (err: any) {
        if (!mounted) return;
        console.error('OAuth callback exchange failed:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to complete Google authentication.');
      }
    }

    async function syncAndRedirect(user: any) {
      try {
        const email = user.email || '';
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split('@')[0] ||
          'Google User';
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

        // Sync with backend PostgreSQL database and create/restore workspace
        await syncGoogleUser(email, name, avatar, user.id);

        if (!mounted) return;
        setStatus('success');

        const next = searchParams.get('next') || '/agents';
        setTimeout(() => {
          router.replace(next);
        }, 800);
      } catch (syncErr: any) {
        if (!mounted) return;
        console.error('Profile synchronization error:', syncErr);
        setStatus('error');
        setErrorMessage(
          syncErr.message || 'Authenticated with Google, but failed to synchronize workspace account.'
        );
      }
    }

    handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-obsidian-canvas text-text-primary flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-md p-8 rounded-2xl bg-obsidian-surface border border-border-subtle shadow-2xl text-center space-y-6">
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Completing Google Authentication</h2>
              <p className="text-xs text-text-secondary mt-1">
                Verifying your credentials and synchronizing your sovereign voice workspace...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400">Authentication Successful</h2>
              <p className="text-xs text-text-secondary mt-1">Redirecting to your voice studio...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-400">Authentication Failed</h2>
              <p className="text-xs text-text-secondary mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left font-mono break-words">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => signInWithGoogleOAuth()}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-canvas text-xs font-bold transition shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Google Sign In</span>
              </button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-obsidian-elevated hover:bg-obsidian-hover border border-border-subtle text-xs font-semibold text-text-primary transition shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian-canvas flex items-center justify-center text-text-secondary">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
