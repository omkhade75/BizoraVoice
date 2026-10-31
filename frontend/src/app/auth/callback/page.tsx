'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { syncGoogleUser } from '@/lib/api';

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
        const code = searchParams.get('code');

        if (code) {
          // PKCE code exchange
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          if (data.session?.user) {
            await syncAndRedirect(data.session.user);
            return;
          }
        }

        // Check if session is already active or in hash
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (sessionData.session?.user) {
          await syncAndRedirect(sessionData.session.user);
          return;
        }

        // If no code and no session, wait for onAuthStateChange
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            subscription.unsubscribe();
            await syncAndRedirect(session.user);
          }
        });

        // Timeout fallback after 8 seconds
        setTimeout(() => {
          if (mounted && status === 'processing') {
            setStatus('error');
            setErrorMessage('Authentication timed out. No valid session was found.');
          }
        }, 8000);
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
            <div className="pt-2">
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
