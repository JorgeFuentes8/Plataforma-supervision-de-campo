'use client';

import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, EmptyState, ErrorBanner, PageHeader } from '@/components/ui';
import { request } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Report } from '@/lib/types';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    request<Report[]>('/reports').then(setReports).catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los informes'));
  }, []);

  return (
    <>
      <PageHeader title="Informes" description="Informes generados y exportación" />
      <ErrorBanner message={error} />
      <Card className="overflow-hidden">
        {reports.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Informe</th><th className="px-5 py-3">Proyecto</th><th className="px-5 py-3">Plantilla</th><th className="px-5 py-3">Fecha</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold"><Link href={`/reports/${report.id}`} className="inline-flex items-center gap-2 hover:text-emerald-700"><FileText size={16} /> {report.title}</Link></td>
                    <td className="px-5 py-4 text-slate-600">{report.project_name || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{report.template_name || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(report.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="Sin informes generados" description="Genera un informe desde el detalle de un proyecto." /></div>
        )}
      </Card>
    </>
  );
}
