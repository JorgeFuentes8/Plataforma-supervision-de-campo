'use client';

import clsx from 'clsx';
import { Edit, FileText, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ProjectModal } from '@/components/ProjectModal';
import { Button, Card, EmptyState, ErrorBanner, Input, PageHeader } from '@/components/ui';
import { request } from '@/lib/api';
import { formatDate, truncate } from '@/lib/format';
import type { Project, Visit } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [error, setError] = useState('');

  async function loadProjects() {
    try {
      const result = await request<Project[]>('/projects');
      setProjects(result);
      const idFromUrl = typeof window !== 'undefined' ? Number(new URLSearchParams(window.location.search).get('id')) : 0;
      setSelectedId((current) => current || (idFromUrl || result[0]?.id || null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los proyectos');
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    request<Visit[]>(`/projects/${selectedId}/visits`)
      .then(setVisits)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las visitas'));
  }, [selectedId]);

  const filteredProjects = useMemo(() => {
    const lower = query.toLowerCase();
    return projects.filter((project) => `${project.name} ${project.client}`.toLowerCase().includes(lower));
  }, [projects, query]);

  const selected = projects.find((project) => project.id === selectedId) || null;

  function upsertProject(project: Project) {
    setProjects((items) => {
      const exists = items.some((item) => item.id === project.id);
      return exists ? items.map((item) => (item.id === project.id ? project : item)) : [project, ...items];
    });
    setSelectedId(project.id);
  }

  return (
    <>
            <PageHeader
              title="Proyectos"
              description="Gestiona tus proyectos"
              action={
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                  <Plus size={16} /> Nuevo proyecto
                </Button>
              }
            />
            <ErrorBanner message={error} />
            <div className="grid min-h-[680px] gap-5 lg:grid-cols-[380px_1fr]">
              <Card className="overflow-hidden">
                <div className="border-b border-slate-100 p-4">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar proyectos…" className="pl-9" />
                  </div>
                </div>
                <div className="max-h-[620px] overflow-y-auto p-2">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedId(project.id)}
                      className={clsx(
                        'w-full rounded-xl px-4 py-3 text-left transition hover:bg-slate-50',
                        selectedId === project.id && 'bg-emerald-50 ring-1 ring-emerald-100'
                      )}
                    >
                      <p className="font-bold text-slate-950">{project.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{project.client || 'Sin cliente'}</p>
                    </button>
                  ))}
                  {!filteredProjects.length ? <EmptyState title="Sin resultados" description="No hay proyectos con ese filtro." /> : null}
                </div>
              </Card>

              <Card className="p-6">
                {selected ? (
                  <div>
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start">
                      <div>
                        <h2 className="text-2xl font-black text-slate-950">{selected.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">{selected.client || 'Sin cliente'}</p>
                      </div>
                      <Button variant="secondary" onClick={() => { setEditing(selected); setModalOpen(true); }}>
                        <Edit size={15} /> Editar
                      </Button>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Fecha de creación</p>
                        <p className="mt-2 font-bold">{formatDate(selected.created_at)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Visitas</p>
                        <p className="mt-2 font-bold">{selected.visits_count}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Informes generados</p>
                        <p className="mt-2 font-bold">{selected.reports_count}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="font-black text-slate-950">Descripción</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{selected.description || 'Sin descripción'}</p>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link href={`/projects/${selected.id}/visits/new`}><Button><Plus size={15} /> Nueva visita</Button></Link>
                      <Link href={`/projects/${selected.id}/reports/new`}><Button variant="secondary"><FileText size={15} /> Generar informe</Button></Link>
                    </div>

                    <div className="mt-8">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-black text-slate-950">Visitas recientes</h3>
                        <Link href={`/projects/${selected.id}/visits/new`} className="text-xs font-bold text-emerald-700 hover:text-emerald-900">Añadir visita</Link>
                      </div>
                      {visits.length ? (
                        <div className="grid gap-2">
                          {visits.slice(0, 4).map((visit) => (
                            <Link key={visit.id} href={`/visits/${visit.id}`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50/40">
                              <span className="font-bold">Visita {visit.id}</span>
                              <span className="text-slate-500"> – {formatDate(visit.visit_date)} · {truncate(visit.text_notes, 80)}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <EmptyState title="Sin visitas" description="Registra una visita con notas, documentos, audios y fotos." />
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState title="Selecciona un proyecto" description="Crea o selecciona un proyecto para ver el detalle." />
                )}
              </Card>
            </div>
      <ProjectModal
        open={modalOpen}
        project={editing}
        onClose={() => setModalOpen(false)}
        onSaved={upsertProject}
      />
    </>
  );
}
