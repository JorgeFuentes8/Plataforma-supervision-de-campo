'use client';

import { Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, ErrorBanner, Input, Label } from '@/components/ui';
import { getToken, login, register } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('demo@agforest.local');
  const [password, setPassword] = useState('demo1234');
  const [fullName, setFullName] = useState('Técnico Forestal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getToken()) router.replace('/dashboard');
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, fullName);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d1fae5,transparent_34%),linear-gradient(135deg,#0d2a2d,#0f3b2e)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-[#0d2a2d] p-10 text-white md:block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-white/20">
                <Leaf />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight">AGFOREST</p>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">supervisión</p>
              </div>
            </div>
            <div className="mt-20 max-w-md">
              <h1 className="text-4xl font-black leading-tight">Supervisión de campo e informes con IA.</h1>
              <p className="mt-5 text-base leading-7 text-white/70">
                Registra visitas, documentos, audios, fotos y genera borradores respetando plantillas por cliente.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-3 text-center text-sm">
              {['Proyectos', 'Plantillas', 'Informes'].map((item) => (
                <div key={item} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">{item}</div>
              ))}
            </div>
          </div>
          <form onSubmit={submit} className="p-8 md:p-12">
            <h2 className="text-3xl font-black text-slate-950">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
            <p className="mt-2 text-sm text-slate-500">Usuario demo: demo@agforest.local / demo1234</p>
            <div className="mt-6">
              <ErrorBanner message={error} />
            </div>
            <div className="space-y-4">
              {mode === 'register' ? (
                <div>
                  <Label>Nombre</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
              ) : null}
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="mt-7 w-full" disabled={loading}>
              {loading ? 'Entrando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
            <button
              type="button"
              className="mt-5 w-full text-center text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
