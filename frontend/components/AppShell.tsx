'use client';

import clsx from 'clsx';
import { BarChart3, ClipboardList, FileText, FolderKanban, LogOut, User, FileStack } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, getToken } from '@/lib/api';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/projects', label: 'Proyectos', icon: FolderKanban },
  { href: '/visits', label: 'Visitas', icon: ClipboardList },
  { href: '/templates', label: 'Plantillas', icon: FileStack },
  { href: '/reports', label: 'Informes', icon: FileText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';

  useEffect(() => {
    if (!isLogin && !getToken()) router.replace('/login');
  }, [isLogin, router]);

  const [userName, setUserName] = useState('Perfil');

  useEffect(() => {
    if (isLogin) return;

    try {
      const raw = window.localStorage.getItem('agforest_user');
      if (!raw) {
        setUserName('Perfil');
        return;
      }

      const user = JSON.parse(raw);
      setUserName(user.full_name || user.email || 'Perfil');
    } catch {
      setUserName('Perfil');
    }
  }, [isLogin, pathname]);

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col gap-4 bg-gradient-to-b from-[#0d2a2d] to-[#0b241f] p-4 text-white shadow-lg shadow-slate-950/10 md:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-lg font-black">
            AG
          </div>
          <div>
            <p className="text-lg font-black leading-none tracking-tight">AGFOREST</p>
            <p className="text-[9px] uppercase tracking-[0.28em] text-white/55">supervisión</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white',
                  active && 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/80">
            <User size={16} />
            <span className="truncate">{userName}</span>
          </div>

          <button
            onClick={() => {
              clearSession();
              router.replace('/login');
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-h-screen px-4 py-6 md:ml-[240px] md:px-8 lg:px-10">
        <div className="min-h-[calc(100vh-3rem)] rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-2xl shadow-slate-300/10 md:p-8 xl:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
