'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { request } from '@/lib/api';
import type { Project } from '@/lib/types';
import { Button, ErrorBanner, Input, Label, Textarea } from './ui';

export function ProjectModal({
  open,
  onClose,
  onSaved,
  project
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (project: Project) => void;
  project?: Project | null;
}) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(project?.name || '');
    setClient(project?.client || '');
    setDescription(project?.description || '');
    setError('');
  }, [project, open]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const saved = await request<Project>(project ? `/projects/${project.id}` : '/projects', {
        method: project ? 'PUT' : 'POST',
        body: JSON.stringify({ name, client, description })
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el proyecto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">{project ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
            <p className="text-sm text-slate-500">Nombre, cliente y descripción del proyecto.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <ErrorBanner message={error} />
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Arbolado Urbano – Centro" />
          </div>
          <div>
            <Label>Cliente</Label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Ayuntamiento de San Pedro" />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Supervisión del estado del arbolado urbano…" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </div>
  );
}
