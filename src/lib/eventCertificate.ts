const NAVY: [number, number, number] = [14, 42, 71];
const GOLD: [number, number, number] = [201, 162, 39];

export async function generateEventCertificate(opts: {
  attendeeName: string;
  eventName: string;
  eventDate: string; // ISO
  churchName?: string | null;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.width;
  const h = doc.internal.pageSize.height;

  // Moldura
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.3);
  doc.rect(13, 13, w - 26, h - 26);

  doc.setTextColor(...GOLD);
  doc.setFontSize(11);
  doc.text("CEC FAMILY", w / 2, 30, { align: "center" });

  doc.setTextColor(...NAVY);
  doc.setFontSize(26);
  doc.text("Certificado de Participação", w / 2, 50, { align: "center" });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(w / 2 - 40, 56, w / 2 + 40, 56);

  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  doc.text("Certificamos que", w / 2, 75, { align: "center" });

  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  doc.text(opts.attendeeName, w / 2, 90, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  const dateLabel = new Date(opts.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const churchLine = opts.churchName ? ` (${opts.churchName})` : "";
  doc.text(`participou do evento "${opts.eventName}"${churchLine}, realizado em ${dateLabel}.`, w / 2, 102, { align: "center", maxWidth: w - 60 });

  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Certificado emitido eletronicamente em ${new Date().toLocaleDateString("pt-BR")}.`, w / 2, h - 20, { align: "center" });

  doc.save(`certificado-${opts.eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}
