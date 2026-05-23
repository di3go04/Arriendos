import ExcelJS from "exceljs";

export const generateExcel = async (data: any[]) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Reporte");
    if (data.length === 0) return "";
    ws.addRow(Object.keys(data[0]));
    data.forEach((row) => ws.addRow(Object.values(row)));
    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer).toString("base64");
};