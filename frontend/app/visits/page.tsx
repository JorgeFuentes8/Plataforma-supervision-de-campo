'use client';

import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, EmptyState, ErrorBanner, PageHeader } from '@/components/ui';
import { request } from '@/lib/api';
import { formatDate, truncate } from '@/lib/format';
import type { Project, Visit } from '@/lib/types';

type Row = Visit & { project?: Project };

export default function VisitsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const projects = await request<Project[]>('/projects');
        const result: Row[] = [];
        for (const project of projects) {
          const visits = await request<Visit[]>(`/projects/${project.id}/visits`);
          result.push(...visits.map((visit) => ({ ...visit, project })));
        }
        result.sort((a, b) => b.visit_date.localeCompare(a.visit_date));
        setRows(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las visitas');
      }
    }
    load();
  }, []);

  return (
    <>
      <PageHeader title="Visitas" description="Registro de visitas de campo" />
      <ErrorBanner message={error} />
      <Card className="overflow-hidden">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Proyecto</th><th className="px-5 py-3">Notas</th><th className="px-5 py-3">Adjuntos</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold"><Link href={`/visits/${visit.id}`} className="hover:text-emerald-700">{formatDate(visit.visit_date)}</Link></td>
                    <td className="px-5 py-4 text-slate-700">{visit.project?.name || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{truncate(visit.text_notes, 120)}</td>
                    <td className="px-5 py-4 text-slate-500">{visit.assets.length} archivos</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="Sin visitas registradas" description="Crea una visita desde el detalle de un proyecto." /></div>
        )}
      </Card>
    </>
  );
}
