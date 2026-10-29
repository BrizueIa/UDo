export const BLOCKED_EXTENSIONS = new Set([
  'iso', 'img', 'dmg', 'vmdk', 'qcow2', 'exe', 'msi', 'bat', 'cmd', 'com',
  'scr', 'pif', 'vbs', 'ps1', 'dll', 'sys', 'so', 'dylib', 'bin', 'run',
  'appimage', 'sh',
]);

export const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico',
]);

export const CAD_EXTENSIONS = new Set([
  'stl', '3mf', 'step', 'stp', 'blend', 'obj', 'gcode', 'fbx', 'dae', 'iges',
]);

export const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'rs', 'py', 'json', 'yaml', 'yml', 'toml', 'html', 'css', 'sql', 'c', 'cpp', 'h',
]);

export const DOC_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt',
]);

export const SHEET_EXTENSIONS = new Set([
  'xls', 'xlsx', 'csv', 'tsv', 'ods',
]);

export const ARCHIVE_EXTENSIONS = new Set([
  'zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar',
]);

export const AUDIO_EXTENSIONS = new Set([
  'webm', 'ogg', 'oga', 'mp3', 'wav', 'm4a', 'flac', 'aac',
]);

export type FileCategory =
  | '3d'
  | 'pdf'
  | 'doc'
  | 'sheet'
  | 'code'
  | 'archive'
  | 'audio'
  | 'image'
  | 'generic';

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase();
}

export function isBlockedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return BLOCKED_EXTENSIONS.has(ext);
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return IMAGE_EXTENSIONS.has(ext);
}

export function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase().replace(/^\./, '');
  if (CAD_EXTENSIONS.has(ext)) return '3d';
  if (ext === 'pdf') return 'pdf';
  if (SHEET_EXTENSIONS.has(ext)) return 'sheet';
  if (DOC_EXTENSIONS.has(ext)) return 'doc';
  if (CODE_EXTENSIONS.has(ext)) return 'code';
  if (ARCHIVE_EXTENSIONS.has(ext)) return 'archive';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  return 'generic';
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i] || 'MB'}`;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]/g, '_');
}
