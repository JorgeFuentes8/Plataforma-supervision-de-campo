'use client';

import { ArrowLeft, Download, FileAudio, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, ErrorBanner, PageHeader } from '@/components/ui';
import { request } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Asset, Project, Visit } from '@/lib/types';

export default function VisitDetailPage({ params }: { params: { id: string } }) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const loadedVisit = await request<Visit>(`/visits/${params.id}`);
        setVisit(loadedVisit);
        setProject(await request<Project>(`/projects/${loadedVisit.project_id}`));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la visita');
      }
    }
    load();
  }, [params.id]);

  const grouped = useMemo(() => {
    const assets = visit?.assets || [];
    return {
      pdfs: assets.filter((asset) => asset.kind === 'pdf'),
      audios: assets.filter((asset) => asset.kind === 'audio'),
      photos: assets.filter((asset) => asset.kind === 'photo')
    };
  }, [visit]);

  return (
    <>
      <PageHeader
        title={visit ? `Visita ${visit.id} – ${formatDate(visit.visit_date)}` : 'Detalle de visita'}
        description={project ? `Proyecto: ${project.name}` : undefined}
        action={<Link href={project ? `/projects?id=${project.id}` : '/projects'}><Button variant="secondary"><ArrowLeft size={15} /> Volver</Button></Link>}
      />
      <ErrorBanner message={error} />
      {visit ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="font-black text-slate-950">Notas de texto</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{visit.text_notes || 'No hay notas de texto.'}</p>
            </Card>
            <Card className="p-5">
              <h2 className="font-black text-slate-950">Documentos (PDF)</h2>
              <div className="mt-3 space-y-2">
                {grouped.pdfs.length ? grouped.pdfs.map((asset: Asset) => (
                  <a key={asset.id} href={asset.url} target="_blank" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50">
                    <span className="flex items-center gap-2 font-semibold"><FileText size={16} className="text-emerald-700" /> {asset.filename}</span>
                    <Download size={15} className="text-slate-400" />
                  </a>
                )) : <p className="text-sm text-slate-500">No hay PDFs adjuntos.</p>}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-black text-slate-950">Audio y transcripción</h2>
              <div className="mt-3 space-y-3">
                {grouped.audios.map((asset) => (
                  <div key={asset.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold"><FileAudio size={16} className="text-emerald-700" /> {asset.filename}</p>
                    <audio controls src={asset.url} className="w-full" />
                  </div>
                ))}
                <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {visit.audio_transcription || grouped.audios.map((asset) => asset.transcript).filter(Boolean).join('\n') || 'No hay transcripción disponible.'}
                </p>
              </div>
            </Card>
          </div>
          <Card className="p-5">
            <h2 className="font-black text-slate-950">Fotos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {grouped.photos.length ? grouped.photos.map((asset) => (
                <a key={asset.id} href={asset.url} target="_blank" className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.filename} className="h-44 w-full object-cover transition group-hover:scale-105" />
                </a>
              )) : <p className="text-sm text-slate-500">No hay fotos.</p>}
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
