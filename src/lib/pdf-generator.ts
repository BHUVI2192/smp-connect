import jsPDF from "jspdf";

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------
export interface LetterPdfData {
  subject: string;
  body: string;
  recipientName: string;
  recipientDesignation?: string;
  recipientAddress?: string;
  letterDate: string;
  referenceNo?: string;
  department?: string;
  signatureUrl?: string;
}

export interface RailwayEqPdfData {
  passengerName: string;
  passengerAge: string;
  passengerGender: string;
  fromStation: string;
  toStation: string;
  travelDate: string;
  coachPreference: string;
  pnrNo: string;
  trainNo?: string;
  trainName?: string;
  remarks?: string;
  signatureUrl?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const A4_W = 210; // mm
const A4_H = 297; // mm
const MARGIN_L = 25; // left margin mm
const MARGIN_R = 25; // right margin mm
const MARGIN_T = 20; // top margin mm
const CONTENT_W = A4_W - MARGIN_L - MARGIN_R; // 160 mm

// ---------------------------------------------------------------------------
// Helper: Draw the official MP Office letterhead header
// ---------------------------------------------------------------------------
function drawLetterhead(pdf: jsPDF, yStart: number): number {
  let y = yStart;

  // Ashoka Chakra circle
  pdf.setFillColor(13, 45, 100); // deep blue
  pdf.circle(MARGIN_L + 8, y + 8, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("MP", MARGIN_L + 8, y + 9.5, { align: "center" });

  // Title block (right of circle)
  const titleX = MARGIN_L + 19;
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text("MEMBER OF PARLIAMENT", titleX, y + 3, { charSpace: 1.5 });

  pdf.setTextColor(13, 45, 100);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text("OFFICE OF THE HON'BLE MEMBER OF PARLIAMENT", titleX, y + 10);

  pdf.setTextColor(110, 110, 110);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("Lok Sabha  •  Constituency Name, Karnataka", titleX, y + 16);

  y += 22;

  // Divider line
  pdf.setDrawColor(13, 45, 100);
  pdf.setLineWidth(0.6);
  pdf.line(MARGIN_L, y, A4_W - MARGIN_R, y);

  return y + 7; // return y after header
}

// ---------------------------------------------------------------------------
// Helper: Wrap and print body text, respecting page breaks
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Helper: Wrap and print body text, respecting page breaks and smart-fit
// ---------------------------------------------------------------------------
function printWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  pageH: number,
  marginBottom: number,
  onPageAdd?: (pdf: jsPDF) => void
): number {
  const lines = pdf.splitTextToSize(text, maxWidth);
  
  // Smart-fit threshold matching the preview (~4 lines)
  const availableSpace = pageH - marginBottom - y;
  const totalNeeded = lines.length * lineHeight;
  const SMART_FIT_THRESHOLD_MM = 24; // ~4 lines at 6mm each
  
  if (totalNeeded > availableSpace && totalNeeded <= availableSpace + SMART_FIT_THRESHOLD_MM) {
    const originalSize = pdf.getFontSize();
    // Shrink font from 11pt to 10pt (approx 9% shrink)
    pdf.setFontSize(originalSize * 0.9);
    const newLh = lineHeight * 0.9;
    const newLines = pdf.splitTextToSize(text, maxWidth);
    
    for (const line of newLines) {
      pdf.text(line, x, y);
      y += newLh;
    }
    pdf.setFontSize(originalSize); // reset
    return y;
  }

  // Normal multi-page flow
  for (const line of lines) {
    if (y + lineHeight > pageH - marginBottom) {
      pdf.addPage();
      if (onPageAdd) onPageAdd(pdf);
      y = MARGIN_T + 25; // start below the repeating header
    }
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Helper: Strip HTML tags from body content
// ---------------------------------------------------------------------------
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Helper: Format date string to readable form
// ---------------------------------------------------------------------------
function fmtDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// PUBLIC: Generate Letter PDF
// ---------------------------------------------------------------------------
export async function generateLetterPdf(
  data: LetterPdfData,
  filename = "Letter.pdf"
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lh = 6; // line height mm
  const FOOTER_Y = A4_H - 16;

  let y = MARGIN_T;
  y = drawLetterhead(pdf, y);

  // ── Reference & Date row ──
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text("Ref. No.", MARGIN_L, y);
  pdf.text("Date", A4_W - MARGIN_R, y, { align: "right" });

  y += 4.5;
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 20, 20);
  pdf.text(data.referenceNo || "MP/____/____", MARGIN_L, y);
  pdf.text(fmtDate(data.letterDate), A4_W - MARGIN_R, y, { align: "right" });

  y += 10;

  // ── Department (Optional) ──
  if (data.department) {
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(110, 110, 110);
    pdf.text("Department", MARGIN_L, y);
    y += 5;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 30, 30);
    pdf.text(data.department, MARGIN_L, y);
    y += 10;
  }

  // ── Recipient ──
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(30, 30, 30);
  pdf.text("To,", MARGIN_L, y); y += lh;
  pdf.setFont("helvetica", "bold");
  pdf.text(data.recipientName || "________________", MARGIN_L, y); y += lh;
  pdf.setFont("helvetica", "normal");
  if (data.recipientDesignation) {
    pdf.text(data.recipientDesignation, MARGIN_L, y); y += lh;
  }
  if (data.recipientAddress) {
    const addrLines = pdf.splitTextToSize(data.recipientAddress, CONTENT_W * 0.6);
    pdf.text(addrLines, MARGIN_L, y);
    y += addrLines.length * lh;
  }
  y += 5;

  // ── Subject ──
  const subjLabel = "Subject: ";
  const subjText = data.subject || "____________";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(subjLabel, MARGIN_L, y);
  const subjLabelW = pdf.getTextWidth(subjLabel);
  pdf.setFont("helvetica", "normal");
  // underline subject text
  const subjLines = pdf.splitTextToSize(subjText, CONTENT_W - subjLabelW);
  pdf.text(subjLines[0], MARGIN_L + subjLabelW, y);
  // underline
  pdf.setDrawColor(30, 30, 30);
  pdf.setLineWidth(0.2);
  pdf.line(
    MARGIN_L + subjLabelW,
    y + 0.8,
    MARGIN_L + subjLabelW + pdf.getTextWidth(subjLines[0]),
    y + 0.8
  );
  y += lh;
  if (subjLines.length > 1) {
    for (let i = 1; i < subjLines.length; i++) {
      pdf.text(subjLines[i], MARGIN_L + subjLabelW, y);
      pdf.line(
        MARGIN_L + subjLabelW,
        y + 0.8,
        MARGIN_L + subjLabelW + pdf.getTextWidth(subjLines[i]),
        y + 0.8
      );
      y += lh;
    }
  }
  y += 6;

  // ── Salutation ──
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Respected Sir/Madam,", MARGIN_L, y); y += lh + 2;

  // ── Body ──
  const bodyText = stripHtml(data.body || "");
  const onPageAdd = (p: jsPDF) => {
    // Mini-header for following pages
    p.setFontSize(8);
    p.setTextColor(150, 150, 150);
    p.setFont("helvetica", "normal");
    p.text("Office of the Hon'ble Member of Parliament", MARGIN_L, MARGIN_T + 5);
    p.text(`Ref: ${data.referenceNo || "MP/---"}`, A4_W - MARGIN_R, MARGIN_T + 5, { align: "right" });
    p.setDrawColor(200, 200, 200);
    p.setLineWidth(0.1);
    p.line(MARGIN_L, MARGIN_T + 8, A4_W - MARGIN_R, MARGIN_T + 8);
    p.setTextColor(30, 30, 30);
    p.setFontSize(10);
  };

  y = printWrappedText(pdf, bodyText, MARGIN_L, y, CONTENT_W, lh, FOOTER_Y - 45, 10, onPageAdd);
  y += 8;

  // ── Closing ──
  if (y + 55 > FOOTER_Y) { pdf.addPage(); y = MARGIN_T; }
  pdf.text("Thanking you,", MARGIN_L, y); y += lh;
  pdf.text("Yours faithfully,", MARGIN_L, y); y += lh + 2;

  // ── Signature ──
  if (data.signatureUrl) {
    try {
      await loadImageIntoPdf(pdf, data.signatureUrl, MARGIN_L, y, 45, 22);
      y += 24;
    } catch {
      y += 20;
    }
  } else {
    // dashed line placeholder
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(MARGIN_L, y + 18, MARGIN_L + 50, y + 18);
    pdf.setLineDashPattern([], 0);
    y += 22;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Hon'ble Member of Parliament", MARGIN_L, y); y += lh;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 90, 90);
  pdf.text("Constituency Name, Karnataka", MARGIN_L, y);

  // ── Footer ──
  drawFooter(pdf);

  pdf.save(filename);
}

// ---------------------------------------------------------------------------
// PUBLIC: Generate Railway EQ PDF
// ---------------------------------------------------------------------------
export async function generateRailwayEqPdf(
  data: RailwayEqPdfData,
  filename = "RailwayEQ.pdf"
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lh = 6;
  const FOOTER_Y = A4_H - 16;

  let y = MARGIN_T;
  y = drawLetterhead(pdf, y);

  // ── Ref & Date ──
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text("Ref. No.", MARGIN_L, y);
  pdf.text("Date", A4_W - MARGIN_R, y, { align: "right" });
  y += 4.5;
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 20, 20);
  pdf.text("MP/EQ/____/____", MARGIN_L, y);
  pdf.text(fmtDate(new Date().toISOString()), A4_W - MARGIN_R, y, { align: "right" });
  y += 10;

  // ── Recipient ──
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("To,", MARGIN_L, y); y += lh;
  pdf.setFont("helvetica", "bold");
  pdf.text("The Divisional Railway Manager,", MARGIN_L, y); y += lh;
  pdf.setFont("helvetica", "normal");
  pdf.text("Indian Railways,", MARGIN_L, y); y += lh;
  pdf.text("Concerned Division.", MARGIN_L, y); y += lh + 5;

  // ── Subject ──
  const subj = `Request for release of Emergency Quota for Train No. ${data.trainNo || "_______"}`;
  pdf.setFont("helvetica", "bold");
  pdf.text("Subject: ", MARGIN_L, y);
  const sLabelW = pdf.getTextWidth("Subject: ");
  pdf.setFont("helvetica", "normal");
  const sLines = pdf.splitTextToSize(subj, CONTENT_W - sLabelW);
  pdf.text(sLines, MARGIN_L + sLabelW, y);
  y += sLines.length * lh + 5;

  // ── Salutation ──
  pdf.text("Respected Sir/Madam,", MARGIN_L, y); y += lh + 2;

  // ── Intro paragraph ──
  const introPara = `This is to kindly request you to release the Emergency Quota against PNR No. ${data.pnrNo || ".........."} for the upcoming journey on ${fmtDate(data.travelDate)}.`;
  y = printWrappedText(pdf, introPara, MARGIN_L, y, CONTENT_W, lh, FOOTER_Y - 90, 20);
  y += 4;

  pdf.setFont("helvetica", "bold");
  pdf.text("The passenger details are as follows:", MARGIN_L, y); y += lh + 2;
  pdf.setFont("helvetica", "normal");

  // ── Details Table ──
  const tableRows: [string, string][] = [
    ["Passenger Name", data.passengerName || "___________________"],
    ["Age / Gender", `${data.passengerAge ? data.passengerAge + " Yrs" : "___ Yrs"} / ${data.passengerGender || "___"}`],
    ["Train No. & Name", `${data.trainNo || "_______"}  —  ${data.trainName || "________________"}`],
    ["Route", `${data.fromStation || "_______"}  to  ${data.toStation || "_______"}`],
    ["Class / Coach", data.coachPreference || "_______"],
    ["PNR Number", data.pnrNo || ".........."],
  ];

  const colLabelW = 55;
  const rowH = 8;
  const tableX = MARGIN_L;
  const tableW = CONTENT_W;

  // Table background & border
  pdf.setDrawColor(200, 200, 200);
  pdf.setFillColor(246, 248, 250);
  pdf.setLineWidth(0.2);

  tableRows.forEach(([label, value], i) => {
    const ry = y + i * rowH;
    // Even row shade
    if (i % 2 === 0) {
      pdf.setFillColor(246, 248, 250);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.rect(tableX, ry - 5.5, tableW, rowH, "F");
    pdf.rect(tableX, ry - 5.5, tableW, rowH); // border

    // Label
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(40, 40, 40);
    pdf.text(label, tableX + 3, ry);

    // Vertical divider
    pdf.line(tableX + colLabelW, ry - 5.5, tableX + colLabelW, ry + rowH - 5.5);

    // Value
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(value, tableX + colLabelW + 4, ry);
  });

  y += tableRows.length * rowH + 6;

  if (data.remarks) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Note: ", MARGIN_L, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.remarks, MARGIN_L + pdf.getTextWidth("Note: "), y);
    y += lh + 3;
  }

  // ── Closing paragraph ──
  const closePara = "I request you to kindly consider this matter favorably and release the requested Emergency Quota.";
  y = printWrappedText(pdf, closePara, MARGIN_L, y, CONTENT_W, lh, FOOTER_Y - 55, 20);
  y += 8;

  // ── Closing ──
  if (y + 50 > FOOTER_Y) { pdf.addPage(); y = MARGIN_T; }
  pdf.text("Thanking you,", MARGIN_L, y); y += lh;
  pdf.text("Yours faithfully,", MARGIN_L, y); y += lh + 2;

  // Signature
  if (data.signatureUrl) {
    try {
      await loadImageIntoPdf(pdf, data.signatureUrl, MARGIN_L, y, 45, 22);
      y += 24;
    } catch {
      y += 20;
    }
  } else {
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(MARGIN_L, y + 18, MARGIN_L + 50, y + 18);
    pdf.setLineDashPattern([], 0);
    y += 22;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(20, 20, 20);
  pdf.text("Hon'ble Member of Parliament", MARGIN_L, y); y += lh;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 90, 90);
  pdf.text("Constituency Name, Karnataka", MARGIN_L, y);

  drawFooter(pdf);
  pdf.save(filename);
}

// ---------------------------------------------------------------------------
// Helper: Footer on every current page
// ---------------------------------------------------------------------------
function drawFooter(pdf: jsPDF) {
  const totalPages = pdf.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    pdf.setPage(pg);
    const footerY = A4_H - 12;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_L, footerY - 4, A4_W - MARGIN_R, footerY - 4);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(140, 140, 140);
    pdf.text(
      "Office Address: Parliament House / Constituency Office  •  Phone: +91-XXXXX-XXXXX  •  Email: mp@smp.com",
      A4_W / 2,
      footerY,
      { align: "center" }
    );
    if (totalPages > 1) {
      pdf.text(`Page ${pg} of ${totalPages}`, A4_W - MARGIN_R, footerY, {
        align: "right",
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Helper: Load an image URL into jsPDF
// ---------------------------------------------------------------------------
function loadImageIntoPdf(
  pdf: jsPDF,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          pdf.addImage(dataUrl, "PNG", x, y, w, h);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

// ---------------------------------------------------------------------------
// LEGACY: Screenshot-based PDF (keep as fallback, not used by default)
// ---------------------------------------------------------------------------
export async function downloadAsPdf(
  elementId: string,
  filename = "document.pdf"
): Promise<void> {
  // No longer used — replaced by programmatic PDF generation
  throw new Error(
    `downloadAsPdf is deprecated. Use generateLetterPdf or generateRailwayEqPdf instead. (elementId: ${elementId}, filename: ${filename})`
  );
}
