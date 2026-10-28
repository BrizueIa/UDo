import React from 'react';
import { FileText, Boxes, Users, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  onSelectTemplate: (content: string, title?: string) => void;
  variant?: 'inline' | 'dropdown';
  onClose?: () => void;
}

export const NoteTemplatePicker: React.FC<Props> = ({ onSelectTemplate, variant = 'inline', onClose }) => {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');

  const templates = [
    {
      id: 'blank',
      title: t('templates.blank'),
      desc: t('templates.blankDesc'),
      icon: <FileText size={16} className="text-blue-400" />,
      content: '',
    },
    {
      id: 'design',
      title: t('templates.design'),
      desc: t('templates.designDesc'),
      icon: <Boxes size={16} className="text-amber-400" />,
      content: isEs
        ? `# 🎨 Diseño y Proyecto 3D\n\n## 📐 Especificaciones\n- **Dimensiones:** \n- **Material / Filamento:** \n- **Ajustes CAD / Impresión:** \n\n## 📋 Hitos del Proyecto\n- [ ] Boceto conceptual e investigación\n- [ ] Modelado 3D CAD\n- [ ] Prototipo y prueba de impresión\n- [ ] Acabado final y ensamble\n\n## 🔗 Referencias y Archivos\n- \n`
        : `# 🎨 Design & 3D Project\n\n## 📐 Specifications\n- **Dimensions:** \n- **Material / Filament:** \n- **CAD / Print Settings:** \n\n## 📋 Project Milestones\n- [ ] Concept sketch & research\n- [ ] CAD 3D modeling\n- [ ] Prototype test print\n- [ ] Final assembly & finishing\n\n## 🔗 References & Assets\n- \n`,
    },
    {
      id: 'meeting',
      title: t('templates.meeting'),
      desc: t('templates.meetingDesc'),
      icon: <Users size={16} className="text-emerald-400" />,
      content: isEs
        ? `# 👥 Notas de Reunión\n\n**Fecha:** ${new Date().toLocaleDateString()}\n**Participantes:** \n\n## 🎯 Agenda\n1. \n2. \n\n## 📝 Discusión Principal\n- \n\n## ✅ Acuerdos y Tareas\n- [ ] \n- [ ] \n`
        : `# 👥 Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Participants:** \n\n## 🎯 Agenda\n1. \n2. \n\n## 📝 Key Discussion\n- \n\n## ✅ Action Items\n- [ ] \n- [ ] \n`,
    },
    {
      id: 'checklist',
      title: t('templates.checklist'),
      desc: t('templates.checklistDesc'),
      icon: <CheckSquare size={16} className="text-purple-400" />,
      content: isEs
        ? `# ☀️ Lista de Tareas Diarias\n\n## 🚀 Prioridades del Día\n- [ ] Prioridad 1\n- [ ] Prioridad 2\n\n## 📥 Tareas Pendientes\n- [ ] Revisar correos y mensajes\n- [ ] Sprint de enfoque en proyecto principal\n- [ ] Planificar pendientes de mañana\n\n## 💡 Notas y Reflexión\n- \n`
        : `# ☀️ Daily Checklist\n\n## 🚀 Top Priorities\n- [ ] High Impact Task 1\n- [ ] High Impact Task 2\n\n## 📥 Daily Tasks\n- [ ] Check communications\n- [ ] Deep focus sprint on main project\n- [ ] Plan tomorrow's priorities\n\n## 💡 Notes & Reflection\n- \n`,
    },
  ];

  if (variant === 'dropdown') {
    return (
      <div className="absolute right-0 top-full mt-1.5 w-64 bg-theme-card/95 backdrop-blur-md border border-theme-border rounded-xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
        <div className="px-3 py-1 text-[10px] font-bold text-theme-muted uppercase tracking-wider border-b border-theme-border/40 mb-1">
          {t('templates.title')}
        </div>
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => {
              onSelectTemplate(tpl.content, tpl.id !== 'blank' ? tpl.title : undefined);
              onClose?.();
            }}
            className="w-full text-left px-3 py-2 flex items-start space-x-2.5 hover:bg-theme-hover/60 transition-colors group cursor-pointer"
          >
            <span className="mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform">{tpl.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-theme-text">{tpl.title}</div>
              <div className="text-[10px] text-theme-muted truncate">{tpl.desc}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-dashed border-theme-border/80 bg-theme-card/20 space-y-3 my-2">
      <p className="text-xs text-theme-muted font-medium">{t('templates.starterPrompt')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelectTemplate(tpl.content, tpl.id !== 'blank' ? tpl.title : undefined)}
            className="p-3 rounded-lg bg-theme-card/70 hover:bg-theme-hover border border-theme-border/50 hover:border-theme-accent/50 text-left transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-md bg-white/[0.04] group-hover:scale-110 transition-transform">{tpl.icon}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-theme-text block">{tpl.title}</span>
              <span className="text-[10px] text-theme-muted line-clamp-2 leading-tight">{tpl.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
