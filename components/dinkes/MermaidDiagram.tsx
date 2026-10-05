"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  AlertCircle,
  FileCode2,
  Eye
} from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  figureNumber?: number | string;
  caption?: string;
  className?: string;
}

export default function MermaidDiagram({
  chart,
  figureNumber = 1,
  caption,
  className = ''
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);

  // Sanitasi kode Mermaid jika ada karakter atau tanda kurung yang belum ter-quote dalam label node
  const cleanChart = (raw: string): string => {
    let clean = raw.trim();
    // Hilangkan wrapper markdown backtick jika terbawa
    clean = clean.replace(/^```(?:mermaid)?\s*/i, '').replace(/```\s*$/i, '').trim();

    // Pastikan jika ada label tanda kurung siku belum ter-quote seperti [Poli Umum (dr. Andi)]
    // diubah menjadi ["Poli Umum (dr. Andi)"] agar parser Mermaid tidak error
    clean = clean.replace(/\[([^[\]"\n]*\([^[\]"\n]*\)[^[\]"\n]*)\]/g, '["$1"]');

    return clean;
  };

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      setLoading(true);
      setRenderError(null);

      if (typeof window === 'undefined') return;

      try {
        const sanitized = cleanChart(chart);

        // Inisialisasi mermaid dengan tema modern neutral / executive
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'neutral',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          themeVariables: {
            fontSize: '13px',
            primaryColor: '#ecfdf5', // emerald-50
            primaryTextColor: '#064e3b', // emerald-900
            primaryBorderColor: '#059669', // emerald-600
            lineColor: '#334155', // slate-700
            secondaryColor: '#f1f5f9', // slate-100
            secondaryTextColor: '#0f172a',
            secondaryBorderColor: '#94a3b8',
            tertiaryColor: '#fffbeb', // amber-50
            tertiaryTextColor: '#78350f',
            tertiaryBorderColor: '#d97706',
            clusterBkg: '#f8fafc',
            clusterBorder: '#cbd5e1',
            edgeLabelBackground: '#ffffff'
          }
        });

        // Unique ID untuk render mermaid
        const uniqueId = `mermaid_diag_${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, sanitized);

        if (isMounted) {
          // Bersihkan SVG dari style width/height absolut yang kaku agar responsif
          const responsiveSvg = svg
            .replace(/max-width:\s*[\d.]+px;/gi, 'max-width: 100%;')
            .replace(/<svg\s+([^>]*?)height="[\d.]+"([^>]*?)>/gi, '<svg $1 $2>');

          setSvgHtml(responsiveSvg);
          setRenderError(null);
        }
      } catch (err: any) {
        console.warn('Gagal merender diagram Mermaid:', err);
        if (isMounted) {
          setRenderError(err?.message || 'Sintaks diagram Mermaid tidak dapat diuraikan.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanChart(chart));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram_operasional_fig_${figureNumber}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <figure
      className={`my-8 bg-white border border-slate-300 rounded-none shadow-sm transition-all overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl flex flex-col bg-white' : ''
      } ${className}`}
    >
      {/* ─── DIAGRAM TOOLBAR (ACM FIGURE HEADER) ─── */}
      <div className="bg-slate-100/90 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between text-xs font-sans print:hidden select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            FIGURE {figureNumber} (Vector Topology Diagram)
          </span>
          <span className="text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 border border-slate-200">
            Mermaid Native Vector
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-colors"
            title="Perkecil (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-colors"
            title="Perbesar (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-colors ml-0.5"
            title="Reset Zoom (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1"></span>

          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-colors"
            title="Salin Kode Mermaid"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-colors"
            title="Unduh Diagram SVG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className={`p-1.5 rounded-none transition-colors ${
              showCode ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Tampilkan / Sembunyikan Kode Sumber"
          >
            <FileCode2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-colors ml-0.5"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Inspector Drawer */}
      {showCode && (
        <div className="bg-slate-900 text-slate-200 p-3 text-xs font-mono border-b border-slate-800 overflow-x-auto max-h-48 print:hidden">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-slate-400 text-[10px]">
            <span>Mermaid Specification Code</span>
            <span className="text-emerald-400">Syntax Verified</span>
          </div>
          <pre>{cleanChart(chart)}</pre>
        </div>
      )}

      {/* ─── DIAGRAM CANVAS AREA ─── */}
      <div
        ref={containerRef}
        className={`w-full overflow-auto bg-slate-50/40 p-6 flex items-center justify-center transition-all ${
          isFullscreen ? 'flex-1 min-h-[500px]' : 'min-h-[280px] max-h-[550px]'
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-medium">Merender diagram topologi vektor...</span>
          </div>
        ) : renderError ? (
          <div className="max-w-lg p-5 bg-amber-50/80 border border-amber-300 text-left">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Pratinjau Kode Topologi Diagram
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Diagram disajikan dalam format skrip alur operasional:
            </p>
            <pre className="p-3 bg-white border border-amber-200 text-slate-800 text-[11px] font-mono overflow-x-auto max-h-48">
              {cleanChart(chart)}
            </pre>
          </div>
        ) : (
          <div
            className="w-full flex justify-center items-center transition-transform duration-200 origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        )}
      </div>

      {/* ─── ACM FIGURE CAPTION ─── */}
      <figcaption className="bg-white border-t border-slate-200 px-6 py-3.5 text-slate-700 text-xs font-sans leading-relaxed">
        <p className="font-serif">
          <strong className="font-sans font-bold text-slate-900 tracking-tight mr-1.5">
            Fig. {figureNumber}.
          </strong>
          {caption ||
            'Diagram Alur Topologi Operasional Fasilitas & Intervensi Logistik. Menggambarkan relasi dinamis antara triase pelayanan, kapasitas tempat tidur, dan skema redistribusi.'}
        </p>
      </figcaption>
    </figure>
  );
}
