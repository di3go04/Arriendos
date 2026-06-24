import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Fetch landlord properties to ensure we match only owned properties if needed
    await supabase
      .from('properties')
      .select('id, title')
      .eq('owner_id', user.id);

    // Fetch landlord expenses
    const { data: expenses, error: expensesErr } = await supabase
      .from('expenses')
      .select('*, property:properties(title)')
      .eq('owner_id', user.id)
      .order('expense_date', { ascending: false });

    if (expensesErr) throw expensesErr;

    // Create a new Exceljs Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RentNow SaaS Platform';
    workbook.lastModifiedBy = 'RentNow SaaS';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 1. SHEET 1: RESUMEN FINANCIERO
    const summarySheet = workbook.addWorksheet('Resumen de Gastos', {
      views: [{ showGridLines: true }]
    });

    // Custom Category map
    const categoryLabels: Record<string, string> = {
      maintenance: 'Mantenimiento',
      utilities: 'Servicios Públicos',
      taxes: 'Impuestos',
      insurance: 'Seguros',
      other: 'Otros',
    };

    // Calculate sum by categories
    const totalByCategory = (expenses || []).reduce((acc: Record<string, number>, e: { category: string; amount: number }) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    const totalSum = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

    // Title Row
    summarySheet.mergeCells('A1:E2');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'RENTNOW - REPORTE COMERCIAL DE GASTOS';
    titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' } // Slate 900 (RentNow Primary)
    };

    // Meta details block
    summarySheet.getCell('A4').value = 'Generado Por:';
    summarySheet.getCell('A4').font = { bold: true };
    summarySheet.getCell('B4').value = user.email;

    summarySheet.getCell('A5').value = 'Fecha de Exportación:';
    summarySheet.getCell('A5').font = { bold: true };
    summarySheet.getCell('B5').value = new Date().toLocaleDateString('es-CO');

    summarySheet.getCell('D4').value = 'Total Global:';
    summarySheet.getCell('D4').font = { bold: true };
    summarySheet.getCell('E4').value = totalSum;
    summarySheet.getCell('E4').numFmt = '"$"#,##0.00;("$"#,##0.00);"-"';
    summarySheet.getCell('E4').font = { bold: true, color: { argb: 'FF10B981' } }; // Emerald 500

    // Spacing
    summarySheet.addRow([]);

    // Table Headers for Categories
    const catHeaders = ['Categoría', 'Gasto Total ($ COP)'];
    const catRow = summarySheet.addRow(catHeaders);
    catRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    catRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' } // Slate 800
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF475569' } }
      };
    });

    Object.entries(totalByCategory).forEach(([cat, val]) => {
      const row = summarySheet.addRow([
        categoryLabels[cat] || cat,
        val
      ]);
      row.getCell(2).numFmt = '"$"#,##0.00';
    });

    // 2. SHEET 2: DETALLE DE GASTOS INDIVIDUALES
    const detailSheet = workbook.addWorksheet('Detalle de Gastos', {
      views: [{ showGridLines: true }]
    });

    // Setup headers
    const detailHeaders = [
      'Propiedad / Inmueble',
      'Categoría',
      'Descripción / Detalle',
      'Fecha del Gasto',
      'Monto ($ COP)'
    ];

    detailSheet.addRow(['RENTNOW - BITÁCORA DETALLADA DE GASTOS']).font = {
      size: 14,
      bold: true,
      color: { argb: 'FF0F172A' }
    };
    detailSheet.addRow([]); // empty row

    const headerRow = detailSheet.addRow(detailHeaders);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' } // Brand color blue/indigo
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } }
      };
    });

    // Add individual expense rows
    (expenses || []).forEach((e) => {
      const row = detailSheet.addRow([
        e.property?.title || 'Sin propiedad asignada',
        categoryLabels[e.category] || e.category,
        e.description || 'Sin descripción',
        e.expense_date ? new Date(e.expense_date).toLocaleDateString('es-CO') : '—',
        Number(e.amount)
      ]);

      // Format currencies
      row.getCell(5).numFmt = '"$"#,##0.00';
    });

    // Auto-fit column widths for both sheets
    workbook.worksheets.forEach((sheet) => {
      sheet.columns.forEach((column) => {
        let maxLen = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const value = cell.value ? cell.value.toString() : '';
          if (value.length > maxLen) {
            maxLen = value.length;
          }
        });
        column.width = Math.max(maxLen + 4, 12);
      });
    });

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="RentNow_Reporte_Gastos.xlsx"',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (error: unknown) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al exportar Excel' }, { status: 500 });
  }
}
