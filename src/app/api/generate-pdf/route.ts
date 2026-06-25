import { NextRequest, NextResponse } from "next/server";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { auth } from "@/lib/auth";

pdfMake.vfs = pdfFonts;

function formatCurrency(value: number | string, currency = "COP"): string {
  const num = typeof value === "string" ? Number.parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  if (Number.isNaN(num)) return String(value);
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(num);
  } catch {
    return `$${num.toLocaleString("es-CO")} ${currency}`;
  }
}

function detectTitle(data: Record<string, unknown>[]): string {
  const joined = JSON.stringify(data).toLowerCase();
  if (joined.includes("contrato") || joined.includes("arrendamiento")) return "Contrato de Arrendamiento";
  if (joined.includes("pago") || joined.includes("payment") || joined.includes("invoice")) return "Reporte Financiero";
  if (joined.includes("propiedad") || joined.includes("property")) return "Reporte de Propiedades";
  return "Reporte";
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { data, title: customTitle } = await request.json();
    const rows: Record<string, unknown>[] = Array.isArray(data) ? data : [];
    const title = customTitle || detectTitle(rows);

    const headerColumns = rows.length > 0 ? Object.keys(rows[0]) : ["Datos"];
    const bodyRows = rows.map((row) =>
      headerColumns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        const str = String(val);
        // Try to detect currency values
        if (/^\d+(\.\d{1,2})?$/.test(str) && col.toLowerCase().includes("price") || col.toLowerCase().includes("amount") || col.toLowerCase().includes("rent") || col.toLowerCase().includes("income")) {
          return formatCurrency(Number(val));
        }
        if (typeof val === "object") return JSON.stringify(val);
        return str;
      })
    );

    const docDefinition: Record<string, unknown> = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      header: {
        columns: [
          { text: "RentNow", alignment: "left", fontSize: 10, color: "#888888", margin: [40, 15, 0, 0] },
          { text: new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }), alignment: "right", fontSize: 8, color: "#aaaaaa", margin: [0, 15, 40, 0] },
        ],
      },
      footer: {
        columns: [
          { text: "Generado por RentNow — Plataforma de Gestión de Arrendamientos", alignment: "center", fontSize: 7, color: "#cccccc", margin: [40, 10, 40, 0] },
        ],
      },
      content: [
        { text: title, style: "header", alignment: "center", margin: [0, 0, 0, 20] },
        ...(rows.length === 0
          ? [{ text: "No hay datos disponibles", style: "body", alignment: "center", color: "#999" }]
          : [
              {
                table: {
                  headerRows: 1,
                  widths: headerColumns.map(() => "*"),
                  body: [
                    headerColumns.map((col) => ({
                      text: col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                      style: "tableHeader",
                    })),
                    ...bodyRows,
                  ],
                },
                layout: {
                  fillColor: (rowIndex: number) => (rowIndex === 0 ? "#1e3a5f" : rowIndex % 2 === 0 ? "#f8f9fa" : null),
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => "#dee2e6",
                  vLineColor: () => "#dee2e6",
                  paddingLeft: () => 8,
                  paddingRight: () => 8,
                  paddingTop: () => 6,
                  paddingBottom: () => 6,
                },
              },
            ]),
        ...(rows.length > 10
          ? [{ text: `\nTotal de registros: ${rows.length}`, style: "body", alignment: "right", color: "#666", fontSize: 9 }]
          : []),
      ],
      styles: {
        header: { fontSize: 18, bold: true, color: "#1e3a5f" },
        tableHeader: { fontSize: 8, bold: true, color: "#ffffff", fillColor: "#1e3a5f" },
        body: { fontSize: 8, color: "#333333" },
      },
      defaultStyle: { fontName: "Roboto" },
    };

    const pdfBuffer = await pdfMake.createPdf(docDefinition as Record<string, unknown>).getBuffer();

    const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}