import { NextRequest, NextResponse } from "next/server";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts;

export async function POST(request: NextRequest) {
    const { data } = await request.json();

    const docDefinition = {
        content: [
            { text: "Reporte", style: "header" },
            {
                table: {
                    headerRows: 1,
                    widths: ["*"],
                    body: [
                        [{ text: "Datos", style: "tableHeader" }],
                        ...data.map((d: any) => [{ text: JSON.stringify(d) }]),
                    ],
                },
            },
        ],
    };

    const pdfBuffer = await pdfMake.createPdf(docDefinition).getBuffer();

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=report.pdf",
        },
    });
}