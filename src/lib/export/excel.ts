import ExcelJS from "exceljs";
import type { ExportColumn } from "./types";

export async function buildExcelBuffer<T>(
  sheetName: string,
  columns: ExportColumn<T>[],
  rows: T[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31)); // Excel sheet-name length limit

  sheet.columns = columns.map((column) => ({ header: column.header, key: column.header, width: 24 }));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(Object.fromEntries(columns.map((column) => [column.header, column.accessor(row)])));
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
