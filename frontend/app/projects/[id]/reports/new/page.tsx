'use client';

import clsx from 'clsx';
import { ArrowLeft, Check, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { TemplateBadgeList } from '@/components/TemplateBadgeList';
import { Button, Card, EmptyState, ErrorBanner, PageHeader } from '@/components/ui';
import { request } from '@/lib/api';
import type { Project, Report, ReportTemplate } from '@/lib/types';

type Preview = { title: string; html_content: string; source_payload: Record<string, unknown> };

export default function NewReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = Number(params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    request<Project>(`/projects/${projectId}`).then(setProject).catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el proyecto'));
    request<ReportTemplate[]>('/templates').then((result) => {
      setTemplates(result);
      setSelectedId(result[0]?.id || null);
    }).catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las plantillas'));
  }, [projectId]);

  const selected = useMemo(() => templates.find((template) => template.id === selectedId) || null, [templates, selectedId]);

  async function generatePreview() {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const result = await request<Preview>(`/projects/${projectId}/reports/preview`, { method: 'POST', body: JSON.stringify({ template_id: selectedId }) });
      setPreview(result);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la vista previa');
    } finally {
      setLoading(false);
    }
  }

  async function createReport() {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const report = await request<Report>(`/projects/${projectId}/reports`, { method: 'POST', body: JSON.stringify({ template_id: selectedId }) });
      setStep(3);
      router.push(`/reports/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el informe');
    } finally {
      setLoading(false);
    }
  }

  const steps = ['Seleccionar plantilla', 'Revisar información', 'Generar informe'];

  return (
    <>
      <PageHeader
        title={step === 1 ? 'Generar informe' : 'Vista previa del borrador'}
        description={project ? `Proyecto: ${project.name}` : undefined}
        action={<Link href={`/projects?id=${projectId}`}><Button variant="secondary"><ArrowLeft size={15} /> Volver</Button></Link>}
      />
      <ErrorBanner message={error} />
      <div className="p-6">
            <Card className="p-6">
        <div className="mb-8 grid gap-3 md:grid-cols-3">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-3">
              <span className={clsx('flex h-8 w-8 items-center justify-center rounded-full text-sm font-black', step >= index + 1 ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-400')}>{step > index + 1 ? <Check size={15} /> : index + 1}</span>
              <span className={clsx('text-sm font-bold', step >= index + 1 ? 'text-slate-900' : 'text-slate-400')}>{label}</span>
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div>
            <h2 className="mb-4 font-black text-slate-950">Selecciona la plantilla que quieres usar</h2>
            {templates.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedId(template.id)}
                    className={clsx('rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-emerald-300', selectedId === template.id ? 'border-emerald-600 ring-4 ring-emerald-500/10' : 'border-slate-200')}
                  >
                    <p className="font-black text-slate-950">{template.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{template.client || 'Sin cliente'}</p>
                    <p className="mt-4 min-h-[42px] text-sm leading-6 text-slate-600">{template.description}</p>
                    <div className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white">Seleccionar</div>
                  </button>
                ))}
              </div>
            ) : <EmptyState title="No hay plantillas" description="Crea una plantilla antes de generar el informe." />}
            <div className="mt-6 flex justify-end">
              <Button onClick={generatePreview} disabled={!selectedId || loading}>{loading ? <Loader2 className="animate-spin" size={15} /> : <FileText size={15} />} Revisar borrador</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            <aside className="rounded-2xl bg-slate-50 p-4">
              <h3 className="font-black text-slate-950">Índice del informe</h3>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                {selected?.sections.map((section, index) => <li key={section.title}>{index + 1}. {section.title}</li>)}
              </ol>
              {selected ? <div className="mt-5"><TemplateBadgeList sections={selected.sections} /></div> : null}
            </aside>
            <div>
              <Card className="min-h-[520px] p-7">
                <div className="report-body" dangerouslySetInnerHTML={{ __html: preview?.html_content || '' }} />
              </Card>
              <div className="mt-5 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setStep(1)}>Volver</Button>
                <Button onClick={createReport} disabled={loading}>{loading ? <Loader2 className="animate-spin" size={15} /> : null} Generar informe</Button>
              </div>
            </div>
          </div>
        )}
            </Card>
      </div>
    </>
  );
}
