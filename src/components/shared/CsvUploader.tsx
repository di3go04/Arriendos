'use client';

import * as React from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { useState } from 'react';

interface CsvRow {
  [key: string]: string;
}

export function CsvUploader() {
  const [data, setData] = useState<CsvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error al procesar el archivo CSV.');
        } else {
          setData(results.data as CsvRow[]);
          setError(null);
          setSuccess(false);
        }
      },
      error: (err) => {
        setError(err.message);
      }
    });
  };

  const handleUploadToServer = async () => {
    if (data.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: data }),
      });

      if (!response.ok) {
        throw new Error('Fallo al guardar los datos en el servidor.');
      }

      setSuccess(true);
      setData([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        Importación Masiva
      </h3>
      
      <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center relative hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <FileText className="w-10 h-10 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Haz clic o arrastra un archivo .CSV aquí
          </p>
          <p className="text-xs text-neutral-400">Las columnas deben incluir: nombre, direccion, precio</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-danger/10 text-danger rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-success/10 text-success rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" />
          ¡Datos importados correctamente!
        </div>
      )}

      {data.length > 0 && !success && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Vista previa ({data.length} filas)</h4>
          <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-950 p-2 text-xs">
            <pre>{JSON.stringify(data.slice(0, 3), null, 2)}</pre>
            {data.length > 3 && <p className="text-neutral-500 mt-2 italic">... y {data.length - 3} filas más.</p>}
          </div>

          <button
            onClick={handleUploadToServer}
            disabled={loading}
            className="mt-4 w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading ? 'Importando...' : 'Confirmar Importación'}
          </button>
        </div>
      )}
    </div>
  );
}
