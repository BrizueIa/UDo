export interface BuiltinTemplate {
  id: string;
  titleKey: string;
  descKey: string;
  iconName: 'file-text' | 'boxes' | 'users' | 'check-square' | 'lightbulb' | 'cpu' | 'calendar';
  iconColor: string;
  getContent: (isEs: boolean, dateStr: string) => string;
}

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    id: 'blank',
    titleKey: 'templates.blank',
    descKey: 'templates.blankDesc',
    iconName: 'file-text',
    iconColor: 'text-blue-400',
    getContent: () => '',
  },
  {
    id: 'checklist',
    titleKey: 'templates.checklist',
    descKey: 'templates.checklistDesc',
    iconName: 'check-square',
    iconColor: 'text-purple-400',
    getContent: (isEs) =>
      isEs
        ? `# ☀️ Lista de Tareas\n\n## 🚀 Prioridades Principales\n- [ ] Tarea 1\n- [ ] Tarea 2\n\n## 📥 Tareas Pendientes\n- [ ] Revisar mensajes\n- [ ] Tarea secundaria\n\n## 💡 Notas\n- \n`
        : `# ☀️ Task Checklist\n\n## 🚀 Top Priorities\n- [ ] Priority 1\n- [ ] Priority 2\n\n## 📥 Pending Tasks\n- [ ] Check messages\n- [ ] Secondary task\n\n## 💡 Notes\n- \n`,
  },
  {
    id: 'meeting',
    titleKey: 'templates.meeting',
    descKey: 'templates.meetingDesc',
    iconName: 'users',
    iconColor: 'text-emerald-400',
    getContent: (isEs, dateStr) =>
      isEs
        ? `# 👥 Notas de Reunión\n\n**Fecha:** ${dateStr}\n**Participantes:** \n\n## 🎯 Agenda\n1. \n2. \n\n## 📝 Discusión Principal\n- \n\n## ✅ Acuerdos y Tareas\n- [ ] \n- [ ] \n`
        : `# 👥 Meeting Notes\n\n**Date:** ${dateStr}\n**Participants:** \n\n## 🎯 Agenda\n1. \n2. \n\n## 📝 Key Discussion\n- \n\n## ✅ Action Items\n- [ ] \n- [ ] \n`,
  },
  {
    id: 'brainstorming',
    titleKey: 'templates.brainstorming',
    descKey: 'templates.brainstormingDesc',
    iconName: 'lightbulb',
    iconColor: 'text-yellow-400',
    getContent: (isEs) =>
      isEs
        ? `# 💡 Lluvia de Ideas\n\n## 🎯 Objetivo / Tema\n- \n\n## 🧠 Ideas\n- Idea 1: \n- Idea 2: \n\n## 🚀 Siguientes Pasos\n- [ ] \n`
        : `# 💡 Brainstorming\n\n## 🎯 Goal / Topic\n- \n\n## 🧠 Ideas\n- Idea 1: \n- Idea 2: \n\n## 🚀 Next Steps\n- [ ] \n`,
  },
];
