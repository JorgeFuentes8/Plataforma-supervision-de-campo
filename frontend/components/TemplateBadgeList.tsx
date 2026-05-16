import type { TemplateSection } from '@/lib/types';

export function TemplateBadgeList({ sections }: { sections: TemplateSection[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((section) => (
        <span key={section.title} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
          {section.title}
        </span>
      ))}
    </div>
  );
}
