import { jsPDF } from 'jspdf';
import { Task, Employee } from '../types';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Report for a month is generated on the 1st of the following month. */
export const getReportGeneratedDate = (year: number, month: number) => {
  const d = new Date(year, month + 1, 1); // month is 0-based
  return `01 ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

export const getEffectiveTaskStatus = (task: Task) => {
  const today = new Date().toISOString().split('T')[0];
  if (task.status === 'Completed') return 'Completed';
  if (task.status === 'Overdue' || (task.dueDate && task.dueDate < today)) return 'Overdue';
  return task.status;
};

/** DB may return dueDate as full ISO datetime; normalize to local YYYY-MM-DD. */
export const normalizeDate = (v?: string) => {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getMonthlyTasks = (tasks: Task[], employeeId: string, year: number, month: number) => {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return tasks
    .map(t => ({ ...t, dueDate: normalizeDate(t.dueDate) }))
    .filter(t => t.employeeId === employeeId && t.dueDate.startsWith(prefix))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

const loadOne = async (url: string): Promise<{ data: string; w: number; h: number } | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    const objUrl = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = fail;
      i.src = objUrl;
    });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(objUrl);
    return { data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight };
  } catch {
    return null;
  }
};

const loadImage = async (url: string) => {
  const sources = Array.from(new Set([url, '/logo.png', `${window.location.origin}/logo.png`]));
  for (const s of sources) {
    const r = s ? await loadOne(s) : null;
    if (r) return r;
  }
  return null;
};

export const generateWorkReportPdf = async (opts: {
  employee: Employee;
  tasks: Task[];
  year: number;
  month: number;
  companyName?: string;
  logoUrl?: string;
}) => {
  const { employee, tasks, year, month, companyName = 'Company', logoUrl = '/logo.png' } = opts;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const logo = await loadImage(logoUrl);

  // Header (white background, black text)
  let tx = M;
  if (logo) {
    const lh = 28, lw = Math.min(40, (logo.w / logo.h) * lh);
    doc.addImage(logo.data, 'PNG', M, 3, lw, lh);
    tx = M + lw + 6;
  }
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MONTHLY WORK REPORT', tx, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, tx, 23);
  doc.text(`Generated on: ${getReportGeneratedDate(year, month)}`, W - M, 23, { align: 'right' });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(M, 34, W - M, 34);
  doc.setLineWidth(0.2);

  // Info block
  doc.setTextColor(30, 41, 59);
  let y = 46;
  const info: [string, string][] = [
    ['Employee Name', employee.name],
    ['Role', employee.role || '-'],
    ['Month', MONTH_NAMES[month]],
    ['Year', String(year)],
  ];
  doc.setFontSize(10);
  info.forEach(([k, v], i) => {
    const x = i % 2 === 0 ? M : W / 2;
    if (i % 2 === 0 && i > 0) y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`${k}:`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v, x + 30, y);
  });

  // Summary
  y += 10;
  const count = (s: string) => tasks.filter(t => getEffectiveTaskStatus(t) === s).length;
  const summary = [
    ['Total', tasks.length], ['Completed', count('Completed')],
    ['In Progress', count('In Progress')], ['To Do', count('To Do')], ['Overdue', count('Overdue')],
  ] as const;
  const boxW = (W - M * 2 - 4 * 3) / 5;
  summary.forEach(([label, val], i) => {
    const x = M + i * (boxW + 3);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, boxW, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(String(val), x + boxW / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, x + boxW / 2, y + 13, { align: 'center' });
  });
  y += 24;

  // Table
  const cols = [
    { h: 'S.No', w: 12 },
    { h: 'Date', w: 26 },
    { h: 'Task', w: 50 },
    { h: 'Description', w: 68 },
    { h: 'Status', w: 26 },
  ];
  const drawHead = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(M, y, W - M * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    let x = M;
    cols.forEach(c => { doc.text(c.h, x + 2, y + 5.5); x += c.w; });
    doc.setTextColor(30, 41, 59);
    y += 8;
  };
  drawHead();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (tasks.length === 0) {
    doc.text('No tasks recorded for this month.', W / 2, y + 8, { align: 'center' });
    y += 14;
  }
  tasks.forEach((t, idx) => {
    const status = getEffectiveTaskStatus(t);
    const nd = normalizeDate(t.dueDate);
    const dateStr = nd ? nd.split('-').reverse().join('-') : '-';
    const titleLines = doc.splitTextToSize(t.title || '-', cols[2].w - 4);
    const descLines = doc.splitTextToSize(t.description || '-', cols[3].w - 4);
    const rowH = Math.max(titleLines.length, descLines.length) * 4.5 + 4;

    if (y + rowH > H - 20) { doc.addPage(); y = 16; drawHead(); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); }

    if (idx % 2 === 1) { doc.setFillColor(248, 250, 252); doc.rect(M, y, W - M * 2, rowH, 'F'); }
    let x = M;
    doc.text(String(idx + 1), x + 2, y + 5.5); x += cols[0].w;
    doc.text(dateStr, x + 2, y + 5.5); x += cols[1].w;
    doc.text(titleLines, x + 2, y + 5.5); x += cols[2].w;
    doc.text(descLines, x + 2, y + 5.5); x += cols[3].w;
    const color: Record<string, [number, number, number]> = {
      Completed: [5, 150, 105], 'In Progress': [37, 99, 235], Overdue: [225, 29, 72], 'To Do': [71, 85, 105],
    };
    doc.setTextColor(...(color[status] || color['To Do']));
    doc.setFont('helvetica', 'bold');
    doc.text(status, x + 2, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.setDrawColor(226, 232, 240);
    doc.line(M, y + rowH, W - M, y + rowH);
    y += rowH;
  });

  // Footer with page numbers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${employee.name} • ${MONTH_NAMES[month]} ${year}`, M, H - 8);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 8, { align: 'right' });
  }

  const safeName = employee.name.replace(/[^a-z0-9]+/gi, '_');
  doc.save(`WorkReport_${safeName}_${year}-${String(month + 1).padStart(2, '0')}.pdf`);
};
