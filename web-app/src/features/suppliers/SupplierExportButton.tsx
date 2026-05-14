import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, File, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/Button';
import type { Supplier } from '@/types/supplier.types';
import { formatCurrency } from '@/utils/format';

interface SupplierExportButtonProps {
  suppliers: Supplier[];
  search?: string;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const FILENAME = `suppliers-report-${TODAY}`;

function prepareRows(suppliers: Supplier[]) {
  return suppliers.map((s, i) => ({
    '#': i + 1,
    'Supplier Name': s.name,
    'Contact Person': s.contactPerson || 'N/A',
    'Phone': s.phone,
    'Email': s.email || 'N/A',
    'GST Number': s.gstNumber || 'N/A',
    'Outstanding Amount': s.balanceToPay,
    'Rating': s.rating ? Number(s.rating).toFixed(1) : 'N/A',
    'Risk Level': s.aiRiskStatus || 'LOW',
    'Lead Time (days)': s.leadTimeDays ?? 'N/A',
    'Tags': (s.tags || []).join(', '),
    'Created At': new Date(s.createdAt).toLocaleDateString('en-IN'),
  }));
}

function exportCSV(suppliers: Supplier[]) {
  const rows = prepareRows(suppliers);
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h as keyof typeof row];
        const str = String(val ?? '');
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${FILENAME}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(suppliers: Supplier[]) {
  const rows = prepareRows(suppliers);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 4 }, { wch: 25 }, { wch: 20 }, { wch: 16 }, { wch: 28 },
    { wch: 18 }, { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
  XLSX.writeFile(wb, `${FILENAME}.xlsx`);
}

function exportPDF(suppliers: Supplier[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('Supplier Intelligence Report', 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}  |  Total: ${suppliers.length} suppliers`, 14, 23);

  // Summary row
  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.balanceToPay || 0), 0);
  const highRisk = suppliers.filter(s => s.aiRiskStatus === 'HIGH').length;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(
    `Outstanding: ${formatCurrency(totalOutstanding)}   |   High Risk: ${highRisk}`,
    14, 29
  );

  const body = suppliers.map((s, i) => [
    i + 1,
    s.name,
    s.contactPerson || 'N/A',
    s.phone,
    s.email || 'N/A',
    formatCurrency(s.balanceToPay ?? 0),
    s.rating ? Number(s.rating).toFixed(1) : 'N/A',
    s.aiRiskStatus || 'LOW',
    s.leadTimeDays ?? 'N/A',
    new Date(s.createdAt).toLocaleDateString('en-IN'),
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Supplier', 'Contact', 'Phone', 'Email', 'Outstanding', 'Rating', 'Risk', 'Lead Days', 'Added']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 7 },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `RetailFlow AI — Confidential | Page ${p} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  doc.save(`${FILENAME}.pdf`);
}

const FORMAT_OPTIONS: { format: ExportFormat; label: string; icon: React.ReactNode; ext: string }[] = [
  { format: 'csv',   label: 'CSV File',       icon: <File className="w-4 h-4 text-emerald-400" />,        ext: '.csv' },
  { format: 'excel', label: 'Excel (.xlsx)',   icon: <FileSpreadsheet className="w-4 h-4 text-green-500" />, ext: '.xlsx' },
  { format: 'pdf',   label: 'PDF Report',     icon: <FileText className="w-4 h-4 text-rose-400" />,       ext: '.pdf' },
];

export function SupplierExportButton({ suppliers, search }: SupplierExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    if (suppliers.length === 0) {
      toast.error('No supplier data to export. Add suppliers first.');
      setOpen(false);
      return;
    }

    setExporting(format);
    setOpen(false);

    try {
      // Small delay to let the UI update before heavy computation
      await new Promise(r => setTimeout(r, 50));

      if (format === 'csv')   exportCSV(suppliers);
      if (format === 'excel') exportExcel(suppliers);
      if (format === 'pdf')   exportPDF(suppliers);

      const filterNote = search ? ` (filtered by "${search}")` : '';
      toast.success(`Exported ${suppliers.length} suppliers as ${format.toUpperCase()}${filterNote}`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        icon={
          exporting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />
        }
        onClick={() => !exporting && setOpen(prev => !prev)}
        disabled={!!exporting}
        className="gap-1.5"
      >
        {exporting ? `Exporting ${exporting.toUpperCase()}…` : 'Export'}
        {!exporting && <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/60">
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Export Format
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
              {search ? ` • "${search}"` : ''}
            </p>
          </div>

          {/* Options */}
          <div className="py-1">
            {FORMAT_OPTIONS.map(({ format, label, icon, ext }) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left group"
              >
                <span className="flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-tight">{label}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {`${FILENAME}${ext}`}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/40">
            <p className="text-[10px] text-[var(--text-muted)]">
              Exports current filtered view only
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
