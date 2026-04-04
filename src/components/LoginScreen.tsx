'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

interface LoginProps {
  onLogin: (user: { id: string; name: string; username: string }) => void;
}

export default function LoginScreen({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.toLowerCase().trim();
    if (!trimmedUsername || !password) {
      setError('Ingresa tu usuario y contrasena');
      return;
    }

    const email = `${trimmedUsername}@jcrecomp.app`;

    setLoading(true);
    try {
      if (!supabase) {
        setError('Error de conexion');
        return;
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Usuario o contrasena incorrectos');
        return;
      }

      const user = data.user;
      if (!user) {
        setError('Usuario o contrasena incorrectos');
        return;
      }

      const name = user.user_metadata?.name ?? trimmedUsername;
      const uname = user.user_metadata?.username ?? trimmedUsername;

      onLogin({
        id: user.id,
        name,
        username: uname,
      });
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#0a0a0a',
              letterSpacing: '-0.02em',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            JC
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.02em',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            JC Body Recomp
          </h1>
        </div>

        {/* Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#141414',
            borderRadius: '16px',
            border: '1px solid #262626',
            padding: '32px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
              margin: '0 0 24px 0',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Inicia sesion
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="username"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#a3a3a3',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                Usuario
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Tu nombre de usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#0a0a0a',
                  border: `1px solid ${error ? '#ef4444' : '#262626'}`,
                  borderRadius: '10px',
                  padding: '0 16px',
                  fontSize: '15px',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  if (!error) e.currentTarget.style.borderColor = '#22c55e';
                }}
                onBlur={(e) => {
                  if (!error) e.currentTarget.style.borderColor = '#262626';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#a3a3a3',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Contrasena"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#0a0a0a',
                  border: `1px solid ${error ? '#ef4444' : '#262626'}`,
                  borderRadius: '10px',
                  padding: '0 16px',
                  fontSize: '15px',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  if (!error) e.currentTarget.style.borderColor = '#22c55e';
                }}
                onBlur={(e) => {
                  if (!error) e.currentTarget.style.borderColor = '#262626';
                }}
              />
            </div>

            {error && (
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#ef4444',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: loading ? '#16a34a' : '#22c55e',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s ease',
                marginTop: '8px',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{
                      animation: 'spin 1s linear infinite',
                    }}
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#0a0a0a"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="31.4 31.4"
                      strokeDashoffset="10"
                    />
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Spinner keyframe animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #525252;
        }
      `}</style>
    </div>
  );
}
