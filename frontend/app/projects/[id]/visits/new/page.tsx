'use client';

import { ArrowLeft, FileAudio, FileText, Image as ImageIcon, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorBanner, Input, Label, PageHeader, Textarea } from '@/components/ui';
import { request } from '@/lib/api';
import type { Project, Visit } from '@/lib/types';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewVisitPage({ params }: { params: { id: string } }) {
  const projectId = Number(params.id);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [visitDate, setVisitDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [pdfs, setPdfs] = useState<FileList | null>(null);
  const [audios, setAudios] = useState<FileList | null>(null);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    request<Project>(`/projects/${projectId}`).then(setProject).catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el proyecto'));
  }, [projectId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!photos?.length) {
      setError('Debes adjuntar al menos una foto.');
      return;
    }
    const form = new FormData();
    form.append('visit_date', visitDate);
    form.append('text_notes', notes);
    Array.from(pdfs || []).forEach((file) => form.append('pdfs', file));
    Array.from(audios || []).forEach((file) => form.append('audios', file));
    Array.from(photos || []).forEach((file) => form.append('photos', file));
    setLoading(true);
    try {
      const visit = await request<Visit>(`/projects/${projectId}/visits`, { method: 'POST', body: form });
      router.push(`/visits/${visit.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la visita');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nueva visita"
        description={project ? `Proyecto: ${project.name}` : 'Registro de visita'}
        action={<Link href={`/projects?id=${projectId}`}><Button variant="secondary"><ArrowLeft size={15} /> Volver</Button></Link>}
      />
      <ErrorBanner message={error} />
      <Card className="p-6">
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <Label>Fecha de la visita</Label>
              <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />
            </div>
            <div>
              <Label>Notas de texto</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alcornoque con señales de perforación en tronco…" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Documentos PDF</Label>
                <Input type="file" accept="application/pdf" multiple onChange={(e) => setPdfs(e.target.files)} />
              </div>
              <div>
                <Label>Notas de audio</Label>
                <Input type="file" accept="audio/*" multiple onChange={(e) => setAudios(e.target.files)} />
              </div>
            </div>
            <div>
              <Label>Fotos (al menos una)</Label>
              <Input type="file" accept="image/*" multiple required onChange={(e) => setPhotos(e.target.files)} />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="font-black text-slate-950">Adjuntos preparados</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200"><FileText size={18} className="text-emerald-700" /> PDF: {pdfs?.length || 0}</div>
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200"><FileAudio size={18} className="text-emerald-700" /> Audio: {audios?.length || 0}</div>
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200"><ImageIcon size={18} className="text-emerald-700" /> Fotos: {photos?.length || 0}</div>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Los PDFs se procesan para extraer texto. Los audios se transcriben automáticamente si OPENAI_API_KEY está configurada. Las fotos se insertan en el informe según la plantilla.
            </p>
            <Button type="submit" className="mt-6 w-full" disabled={loading}>
              <Save size={15} /> {loading ? 'Guardando y procesando…' : 'Guardar visita'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
