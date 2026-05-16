'use client';

import { MoreVertical, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, ErrorBanner, PageHeader } from '@/components/ui';
import { request } from '@/lib/api';
import { truncate } from '@/lib/format';
import type { ReportTemplate } from '@/lib/types';

const defaultTemplate = {
  name: 'Nueva plantilla',
  client: 'Cliente',
  description: 'Describe cuándo debe usarse esta plantilla.',
  sections: [
    { title: 'Portada', description: 'Datos básicos', instructions: 'Incluye proyecto, cliente y fecha', required: true },
    { title: 'Datos generales', description: 'Contexto', instructions: 'Resume el alcance del informe', required: true },
    { title: 'Árboles inspeccionados', description: 'Observaciones', instructions: 'Inserta las fotos relevantes', required: true },
    { title: 'Patologías detectadas', description: 'Hallazgos', instructions: 'No inventes datos', required: true },
    { title: 'Recomendaciones', description: 'Actuaciones', instructions: 'Acciones claras y priorizadas', required: true }
  ],
  ai_instructions: 'Respeta la estructura, tono y campos obligatorios de la plantilla. Usa solo la información de visitas, documentos, audios y fotos.',
  required_fields: ['Datos generales', 'Árboles inspeccionados', 'Patologías detectadas', 'Recomendaciones']
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    request<ReportTemplate[]>('/templates').then(setTemplates).catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las plantillas'));
  }, []);

  async function createTemplate() {
    setLoading(true);
    setError('');
    try {
      const template = await request<ReportTemplate>('/templates', { method: 'POST', body: JSON.stringify(defaultTemplate) });
      router.push(`/templates/${template.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la plantilla');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Plantillas de informe"
        description="Gestiona las plantillas que usa la IA para generar informes"
        action={<Button onClick={createTemplate} disabled={loading}><Plus size={16} /> Nueva plantilla</Button>}
      />
      <ErrorBanner message={error} />
      <Card className="overflow-hidden">
        {templates.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-900"><Link href={`/templates/${template.id}`} className="hover:text-emerald-700">{template.name}</Link></td>
                    <td className="px-5 py-4 text-slate-600">{template.client || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{truncate(template.description, 90)}</td>
                    <td className="px-5 py-4 text-right"><Link href={`/templates/${template.id}`} className="inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><MoreVertical size={16} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="Sin plantillas" description="Crea una plantilla para indicar estructura, tono y campos obligatorios a la IA." /></div>
        )}
      </Card>
    </>
  );
}
