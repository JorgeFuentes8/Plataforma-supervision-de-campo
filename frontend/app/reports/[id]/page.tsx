'use client';

import { ArrowLeft, Download, FileCode2, FileDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, ErrorBanner, PageHeader } from '@/components/ui';
import { downloadReport, request } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Report } from '@/lib/types';

function headingsFromHtml(html: string) {
  if (typeof window === 'undefined') return [] as string[];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('h2')).map((node) => node.textContent || '').filter(Boolean);
}

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const reportId = Number(params.id);
  const [report, setReport] = useState<Report | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    request<Report>(`/reports/${reportId}`).then(setReport).catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el informe'));
  }, [reportId]);

  const headings = useMemo(() => headingsFromHtml(report?.html_content || ''), [report]);

  async function exportFile(kind: 'pdf' | 'html') {
    setMenuOpen(false);
    try {
      await downloadReport(reportId, kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar el informe');
    }
  }

  return (
    <>
      <div className="p-6">
            <PageHeader
              title="Informe generado"
              description={report ? `${report.project_name || 'Proyecto'} · ${formatDate(report.created_at)}` : undefined}
              action={
                <div className="relative flex gap-2">
                  <Link href="/reports"><Button variant="secondary"><ArrowLeft size={15} /> Volver</Button></Link>
                  <Button onClick={() => setMenuOpen((value) => !value)}><Download size={15} /> Exportar</Button>
                  {menuOpen ? (
                    <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                      <button onClick={() => exportFile('pdf')} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold hover:bg-slate-50"><FileDown size={15} /> Exportar a PDF</button>
                      <button onClick={() => exportFile('html')} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold hover:bg-slate-50"><FileCode2 size={15} /> Exportar a HTML</button>
                    </div>
                  ) : null}
                </div>
              }
            />
            <ErrorBanner message={error} />
            {report ? (
              <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
                <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                  <h2 className="font-black text-slate-950">Índice del informe</h2>
                  <ol className="mt-4 space-y-2 text-sm text-slate-600">
                    {headings.map((heading, index) => <li key={`${heading}-${index}`}>{index + 1}. {heading}</li>)}
                  </ol>
                </aside>
                <Card className="p-7">
                  <div className="report-body" dangerouslySetInnerHTML={{ __html: report.html_content }} />
                </Card>
              </div>
            ) : null}
      </div>
    </>
  );
}
