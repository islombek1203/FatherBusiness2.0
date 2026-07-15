import path from "node:path";
import ReactPDF from "@react-pdf/renderer";
import type { ExportColumn } from "./types";

const { Document, Page, Text, View, StyleSheet, Font, renderToStream } = ReactPDF;

// Non-negotiable per the localization spec: PDFs must render Uzbek Cyrillic
// correctly, which the built-in PDF standard fonts cannot do. DejaVu Sans
// has full Cyrillic coverage; the .ttf files are vendored into public/fonts
// (not node_modules) so they're guaranteed present in the Docker image
// regardless of Next's standalone-output file tracing.
let fontRegistered = false;
function ensureFontRegistered() {
  if (fontRegistered) return;
  Font.register({
    family: "DejaVu Sans",
    fonts: [
      { src: path.join(process.cwd(), "public/fonts/DejaVuSans.ttf"), fontWeight: "normal" },
      { src: path.join(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: { paddingVertical: 28, paddingHorizontal: 24, fontFamily: "DejaVu Sans", fontSize: 9 },
  title: { fontSize: 14, marginBottom: 4, fontWeight: "bold" },
  generatedAt: { fontSize: 8, color: "#666666", marginBottom: 12 },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 5,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    paddingVertical: 4,
  },
  headerCell: { flex: 1, fontWeight: "bold", paddingHorizontal: 3 },
  cell: { flex: 1, paddingHorizontal: 3 },
});

export async function buildTablePdfBuffer<T>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
  generatedAtLabel: string
): Promise<Buffer> {
  ensureFontRegistered();

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.generatedAt}>{generatedAtLabel}</Text>
        <View style={styles.headerRow} fixed>
          {columns.map((column) => (
            <Text key={column.header} style={styles.headerCell}>
              {column.header}
            </Text>
          ))}
        </View>
        {rows.map((row, index) => (
          <View key={index} style={styles.row} wrap={false}>
            {columns.map((column) => (
              <Text key={column.header} style={styles.cell}>
                {column.accessor(row)}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );

  const stream = await renderToStream(doc);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
