"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export const ExportButton = ({
  data,
  type,
}: {
  data: any[];
  type: "pdf" | "excel";
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      if (type === "pdf") {
        await new Promise((r) => setTimeout(r, 1500));
        toast({ type: "success", message: "PDF generado correctamente" });
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        toast({ type: "success", message: "Excel generado correctamente" });
      }
    } catch {
      toast({ type: "error", message: `Error al generar ${type.toUpperCase()}` });
    } finally {
      setLoading(false);
    }
  };

  const Icon = type === "pdf" ? FileDown : FileSpreadsheet;

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {loading
        ? `Generando ${type.toUpperCase()}...`
        : `Exportar ${type.toUpperCase()}`}
    </button>
  );
};
