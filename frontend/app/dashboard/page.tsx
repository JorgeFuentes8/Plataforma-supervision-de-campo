'use client';

import { MoreVertical, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProjectModal } from '@/components/ProjectModal';
import { Button, Card, EmptyState, ErrorBanner, PageHeader } from '@/components/ui';
import { request } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { DashboardData, Project } from '@/lib/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setData(await request<DashboardData>('/dashboard'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = [
    { label: 'Proyectos', value: data?.projects ?? '—' },
    { label: 'Visitas', value: data?.visits ?? '—' },
    { label: 'Informes generados', value: data?.reports ?? '—' },
    { label: 'Plantillas', value: data?.templates ?? '—' }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen de tus proyectos"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nuevo proyecto
          </Button>
        }
      />
      <ErrorBanner message={error} />
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{stat.value}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-black text-slate-950">Proyectos recientes</h2>
        </div>
        {data?.recent_projects?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Proyecto</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Última visita</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      <Link href={`/projects?id=${project.id}`} className="hover:text-emerald-700">{project.name}</Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{project.client || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(project.last_visit_date)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/projects?id=${project.id}`} className="inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <MoreVertical size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5"><EmptyState title="Todavía no hay proyectos" description="Crea tu primer proyecto para registrar visitas e informes." /></div>
        )}
      </Card>
      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(project: Project) => {
          setData((prev) => prev ? { ...prev, projects: prev.projects + 1, recent_projects: [project, ...prev.recent_projects] } : prev);
          load();
        }}
      />
    </>
  );
}
