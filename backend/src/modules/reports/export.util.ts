import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Response } from "express";

export interface ReportColumn {
  key: string;
  header: string;
  width?: number;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export function sendCsv(res: Response, filename: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

  const lines = [
    columns.map((c) => escape(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escape(cellToString(row[c.key]))).join(",")),
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.send(lines.join("\n"));
}

export async function sendExcel(
  res: Response,
  filename: string,
  columns: ReportColumn[],
  rows: Record<string, unknown>[]
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

export function sendPdf(
  res: Response,
  filename: string,
  title: string,
  columns: ReportColumn[],
  rows: Record<string, unknown>[]
) {
  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).text(title, { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor("#666").text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  const startX = doc.x;
  let y = doc.y;
  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / columns.length;
  const rowHeight = 18;

  const drawRow = (values: string[], bold: boolean) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8).fillColor("#000");
    values.forEach((val, i) => {
      doc.text(val, startX + i * colWidth, y, { width: colWidth - 4, ellipsis: true });
    });
    y += rowHeight;
  };

  drawRow(columns.map((c) => c.header), true);
  doc
    .moveTo(startX, y - 4)
    .lineTo(doc.page.width - doc.page.margins.right, y - 4)
    .strokeColor("#ccc")
    .stroke();

  rows.forEach((row) => {
    if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage({ margin: 30, size: "A4", layout: "landscape" });
      y = doc.y;
    }
    drawRow(
      columns.map((c) => cellToString(row[c.key])),
      false
    );
  });

  doc.end();
}
