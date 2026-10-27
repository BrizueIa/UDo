import { SubjectItem, FolderItem, NoteItem } from '../types';

export const initialSubjects: SubjectItem[] = [
  {
    id: 'subj-3d',
    name: '3D',
    color: '#f97316', // Orange dot
    order: 0,
  },
  {
    id: 'subj-loteria',
    name: 'Lotería app',
    color: '#10b981', // Green dot
    order: 1,
  },
  {
    id: 'subj-stardew',
    name: 'StardewValley',
    color: '#6366f1', // Indigo/Blue dot
    order: 2,
  },
];

export const initialFolders: FolderItem[] = [
  {
    id: 'fold-plantas',
    subjectId: 'subj-3d',
    name: 'Plantas',
    isExpanded: true,
    order: 0,
  },
  {
    id: 'fold-eucce',
    subjectId: 'subj-3d',
    name: 'EUCCE',
    isExpanded: false,
    order: 1,
  },
];

export const initialNotes: NoteItem[] = [
  {
    id: 'note-disenos',
    folderId: 'fold-plantas',
    subjectId: 'subj-3d',
    title: 'Diseños',
    content: `### Ideas y Referencias de Diseños Botánicos

Explorar macetas geométricas y articuladas con autorriego para plantas de interior.

- [x] Dimensionar tolerancias para boquilla de 0.4mm
- [ ] Diseñar depósito de agua con indicador visual de nivel
- [ ] Probar filamento PLA mate color menta
- [ ] Exportar archivos STL y STEP para corte

> **Nota:** La base debe tener un ángulo mínimo de 45° para evitar soportes innecesarios en la impresión.`,
    isCompleted: false,
    isPinned: true,
    tags: ['Modelado', 'Prototipo'],
    links: [
      {
        id: 'link-1',
        title: 'Modelos en Printables',
        url: 'https://www.printables.com',
      },
      {
        id: 'link-2',
        title: 'Inspiración Pinterest Plantas',
        url: 'https://pinterest.com',
      },
    ],
    sketches: [
      {
        id: 'sketch-1',
        title: 'Maceta Menta 3D',
        // Minimalist inline SVG of a cute potted plant matching the reference thumbnail
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%23ffffff"/><path d="M50 40 Q40 25 35 32 Q35 48 48 45" fill="%2322c55e"/><path d="M60 35 Q60 15 68 20 Q70 40 60 45" fill="%2316a34a"/><path d="M70 40 Q80 25 85 32 Q85 48 72 45" fill="%2322c55e"/><path d="M42 55 L78 55 L72 90 L48 90 Z" fill="%23a7f3d0" stroke="%236ee7b7" stroke-width="2"/><ellipse cx="60" cy="55" rx="18" ry="4" fill="%236ee7b7"/></svg>',
        createdAt: '2026-10-27T03:00:00Z',
      },
    ],
    createdAt: '2026-10-27T02:00:00Z',
    updatedAt: 'Hoy, 10:15 AM',
    focusMinutes: 25,
  },
  {
    id: 'note-laminar',
    folderId: 'fold-plantas',
    subjectId: 'subj-3d',
    title: 'Laminar',
    content: 'Configurar parámetros de laminado en OrcaSlicer / PrusaSlicer con 3 perímetros y 15% infill giroscópico.',
    isCompleted: false,
    isPinned: false,
    tags: ['Slicer'],
    links: [],
    sketches: [],
    createdAt: '2026-10-27T02:10:00Z',
    updatedAt: 'Ayer',
  },
  {
    id: 'note-costos',
    folderId: 'fold-plantas',
    subjectId: 'subj-3d',
    title: 'Costos, presupuestos',
    content: 'Cálculo de gramos por pieza (~85g de filamento) + consumo eléctrico.',
    isCompleted: false,
    isPinned: false,
    tags: ['Presupuesto'],
    links: [],
    sketches: [],
    createdAt: '2026-10-27T02:15:00Z',
    updatedAt: 'Ayer',
  },
  {
    id: 'note-cotizacion',
    folderId: 'fold-plantas',
    subjectId: 'subj-3d',
    title: 'Cotización',
    content: 'Cotización aprobada por el cliente para el lote inicial de 5 piezas.',
    isCompleted: true,
    isPinned: false,
    tags: ['Cliente'],
    links: [],
    sketches: [],
    createdAt: '2026-10-27T01:30:00Z',
    updatedAt: '24 Oct',
  },
  {
    id: 'note-analisis',
    folderId: 'fold-eucce',
    subjectId: 'subj-3d',
    title: 'Análisis',
    content: 'Análisis de requerimientos para el módulo EUCCE.',
    isCompleted: false,
    isPinned: false,
    tags: ['Arquitectura'],
    links: [],
    sketches: [],
    createdAt: '2026-10-26T18:00:00Z',
    updatedAt: '23 Oct',
  },
  {
    id: 'note-docker',
    folderId: 'fold-eucce',
    subjectId: 'subj-3d',
    title: 'Dockerización',
    content: 'Componer archivo docker-compose.yml con volúmenes persistentes y red aislada.',
    isCompleted: false,
    isPinned: false,
    tags: ['DevOps'],
    links: [],
    sketches: [],
    createdAt: '2026-10-26T19:00:00Z',
    updatedAt: '23 Oct',
  },
];
