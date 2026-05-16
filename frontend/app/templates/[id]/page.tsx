'use client';

import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorBanner, Input, Label, PageHeader, Textarea } from '@/components/ui';
import { request } from '@/lib/api';
import type { ReportTemplate, TemplateSection } from '@/lib/types';

const emptySection: TemplateSection = { title: '', description: '', instructions: '', required: true };

export default function TemplateEditorPage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [requiredText, setRequiredText] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    request<ReportTemplate>(`/templates/${params.id}`)
      .then((data) => {
        setTemplate(data);
        setRequiredText(data.required_fields.join(', '));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la plantilla'));
  }, [params.id]);

  function update<K extends keyof ReportTemplate>(field: K, value: ReportTemplate[K]) {
    setTemplate((current) => current ? { ...current, [field]: value } : current);
    setSaved(false);
  }

  function updateSection(index: number, patch: Partial<TemplateSection>) {
    if (!template) return;
    const sections = template.sections.map((section, currentIndex) => currentIndex === index ? { ...section, ...patch } : section);
    update('sections', sections);
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (!template) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= template.sections.length) return;
    const sections = [...template.sections];
    const [item] = sections.splice(index, 1);
    sections.splice(nextIndex, 0, item);
    update('sections', sections);
  }

  async function save() {
    if (!template) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: template.name,
        client: template.client,
        description: template.description,
        sections: template.sections.filter((section) => section.title.trim()),
        ai_instructions: template.ai_instructions,
        required_fields: requiredText.split(',').map((item) => item.trim()).filter(Boolean)
      };
      const savedTemplate = await request<ReportTemplate>(`/templates/${template.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setTemplate(savedTemplate);
      setRequiredText(savedTemplate.required_fields.join(', '));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la plantilla');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Editar plantilla"
        description={template?.name || 'Plantilla'}
        action={
          <div className="flex gap-2">
            <Link href="/templates"><Button variant="secondary"><ArrowLeft size={15} /> Volver</Button></Link>
            <Button onClick={save} disabled={loading}><Save size={15} /> {loading ? 'Guardando…' : 'Guardar cambios'}</Button>
          </div>
        }
      />
      <ErrorBanner message={error} />
      {saved ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Plantilla guardada correctamente.</div> : null}
      {template ? (
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-5">
            <h2 className="font-black text-slate-950">Estructura del informe</h2>
            <div className="mt-4 space-y-3">
              {template.sections.map((section, index) => (
                <div key={`${section.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><GripVertical size={15} /> {index + 1}</div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" className="px-2 py-1" onClick={() => moveSection(index, -1)}>↑</Button>
                      <Button type="button" variant="ghost" className="px-2 py-1" onClick={() => moveSection(index, 1)}>↓</Button>
                      <Button type="button" variant="ghost" className="px-2 py-1 text-rose-600" onClick={() => update('sections', template.sections.filter((_, i) => i !== index))}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Input value={section.title} onChange={(e) => updateSection(index, { title: e.target.value })} placeholder="Título de sección" />
                    <Input value={section.description} onChange={(e) => updateSection(index, { description: e.target.value })} placeholder="Descripción" />
                    <Textarea value={section.instructions} onChange={(e) => updateSection(index, { instructions: e.target.value })} placeholder="Instrucciones para la IA en esta sección" className="min-h-[70px]" />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={section.required} onChange={(e) => updateSection(index, { required: e.target.checked })} /> Obligatoria
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => update('sections', [...template.sections, { ...emptySection }])}><Plus size={15} /> Añadir sección</Button>
          </Card>

          <Card className="p-5">
            <h2 className="font-black text-slate-950">Instrucciones para la IA</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input value={template.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div>
                <Label>Cliente</Label>
                <Input value={template.client} onChange={(e) => update('client', e.target.value)} />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={template.description} onChange={(e) => update('description', e.target.value)} className="min-h-[80px]" />
              </div>
              <div>
                <Label>Instrucciones globales</Label>
                <Textarea value={template.ai_instructions} onChange={(e) => update('ai_instructions', e.target.value)} className="min-h-[210px]" />
              </div>
              <div>
                <Label>Campos obligatorios (separados por coma)</Label>
                <Input value={requiredText} onChange={(e) => { setRequiredText(e.target.value); setSaved(false); }} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {requiredText.split(',').map((item) => item.trim()).filter(Boolean).map((item) => (
                    <span key={item} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
