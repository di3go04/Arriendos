import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generatePDF = (data: Record<string, unknown>[]) => {
    const docDefinition = {
        content: [
            { text: "Reporte", style: "header" },
            {
                table: {
                    headerRows: 1,
                    widths: ["*"],
                    body: [
                        [{ text: "Datos", style: "tableHeader" }],
                        ...data.map((d) => [{ text: JSON.stringify(d) }]),
                    ],
                },
            },
        ],
    };
    return pdfMake.createPdf(docDefinition).getBase64();
};