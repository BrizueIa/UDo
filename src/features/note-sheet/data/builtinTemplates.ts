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
    id: 'design',
    titleKey: 'templates.design',
    descKey: 'templates.designDesc',
    iconName: 'boxes',
    iconColor: 'text-amber-400',
    getContent: (isEs) =>
      isEs
        ? `# 🎨 Diseño y Proyecto 3D\n\n## 📐 Especificaciones\n- **Dimensiones:** \n- **Material / Filamento:** \n- **Ajustes CAD / Impresión:** \n\n## 📋 Hitos del Proyecto\n- [ ] Boceto conceptual e investigación\n- [ ] Modelado 3D CAD\n- [ ] Prototipo y prueba de impresión\n- [ ] Acabado final y ensamble\n\n## 🔗 Referencias y Archivos\n- \n`
        : `# 🎨 Design & 3D Project\n\n## 📐 Specifications\n- **Dimensions:** \n- **Material / Filament:** \n- **CAD / Print Settings:** \n\n## 📋 Project Milestones\n- [ ] Concept sketch & research\n- [ ] CAD 3D modeling\n- [ ] Prototype test print\n- [ ] Final assembly & finishing\n\n## 🔗 References & Assets\n- \n`,
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
    id: 'checklist',
    titleKey: 'templates.checklist',
    descKey: 'templates.checklistDesc',
    iconName: 'check-square',
    iconColor: 'text-purple-400',
    getContent: (isEs) =>
      isEs
        ? `# ☀️ Lista de Tareas Diarias\n\n## 🚀 Prioridades del Día\n- [ ] Prioridad 1\n- [ ] Prioridad 2\n\n## 📥 Tareas Pendientes\n- [ ] Revisar correos y mensajes\n- [ ] Sprint de enfoque en proyecto principal\n- [ ] Planificar pendientes de mañana\n\n## 💡 Notas y Reflexión\n- \n`
        : `# ☀️ Daily Checklist\n\n## 🚀 Top Priorities\n- [ ] High Impact Task 1\n- [ ] High Impact Task 2\n\n## 📥 Daily Tasks\n- [ ] Check communications\n- [ ] Deep focus sprint on main project\n- [ ] Plan tomorrow's priorities\n\n## 💡 Notes & Reflection\n- \n`,
  },
  {
    id: 'brainstorming',
    titleKey: 'templates.brainstorming',
    descKey: 'templates.brainstormingDesc',
    iconName: 'lightbulb',
    iconColor: 'text-yellow-400',
    getContent: (isEs) =>
      isEs
        ? `# 💡 Lluvia de Ideas y Brainstorming\n\n## 🎯 Desafío / Problema Central\n- \n\n## 🧠 Hipótesis e Ideas Abiertas\n- Idea A: \n- Idea B: \n- Idea C: \n\n## 📊 Matriz de Impacto vs Esfuerzo\n- **Alto Impacto / Bajo Esfuerzo:** \n- **Alto Impacto / Alto Esfuerzo:** \n\n## 🚀 Siguientes Pasos\n- [ ] \n`
        : `# 💡 Brainstorming & Idea Canvas\n\n## 🎯 Core Challenge / Problem\n- \n\n## 🧠 Open Hypotheses & Ideas\n- Idea A: \n- Idea B: \n- Idea C: \n\n## 📊 Impact vs Effort Matrix\n- **High Impact / Low Effort (Quick Wins):** \n- **High Impact / High Effort (Strategic):** \n\n## 🚀 Next Experiments\n- [ ] \n`,
  },
  {
    id: 'techSpec',
    titleKey: 'templates.techSpec',
    descKey: 'templates.techSpecDesc',
    iconName: 'cpu',
    iconColor: 'text-cyan-400',
    getContent: (isEs) =>
      isEs
        ? `# 🛠️ Especificación Técnica\n\n## 📌 Resumen y Objetivos\n- \n\n## 🏗️ Arquitectura y Componentes\n- \n\n## 🔌 Interfaces y Tipos de Datos\n\`\`\`typescript\n// Contratos de interfaces\n\`\`\`\n\n## 🧪 Plan de Pruebas y Criterios de Aceptación\n- [ ] Pruebas unitarias de componentes críticos\n- [ ] Verificación de integración end-to-end\n`
        : `# 🛠️ Technical Specification\n\n## 📌 Overview & Scope\n- \n\n## 🏗️ Architecture & Component Design\n- \n\n## 🔌 Interfaces & Data Contracts\n\`\`\`typescript\n// Type definitions\n\`\`\`\n\n## 🧪 Verification Plan & Acceptance Criteria\n- [ ] Unit test execution with 100% pass\n- [ ] End-to-end integration verification\n`,
  },
  {
    id: 'weeklyReview',
    titleKey: 'templates.weeklyReview',
    descKey: 'templates.weeklyReviewDesc',
    iconName: 'calendar',
    iconColor: 'text-rose-400',
    getContent: (isEs) =>
      isEs
        ? `# 📅 Revisión Semanal\n\n## 🏆 Victorias y Logros Principales\n- \n\n## 🚧 Obstáculos y Desafíos Resueltos\n- \n\n## 💡 Aprendizajes Clave\n- \n\n## 🎯 Metas y Foco para la Próxima Semana\n- [ ] Meta principal 1\n- [ ] Meta principal 2\n`
        : `# 📅 Weekly Review\n\n## 🏆 Key Wins & Accomplishments\n- \n\n## 🚧 Roadblocks & Solved Challenges\n- \n\n## 💡 Key Lessons Learned\n- \n\n## 🎯 Top Priorities for Next Sprint\n- [ ] Priority goal 1\n- [ ] Priority goal 2\n`,
  },
];
