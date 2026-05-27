// src/services/pdf.service.ts

import puppeteer, { Browser } from "puppeteer";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

const PDF_DIR = path.join(process.cwd(), "uploads", "pdfs");

if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

let LOGO_BASE64 = "";
const logoCandidates = [
  path.join(process.cwd(), "public", "logo.png"),
  path.join(process.cwd(), "uploads", "logo.png"),
  path.join(process.cwd(), "logo.png"),
];

for (const logoPath of logoCandidates) {
  try {
    if (fs.existsSync(logoPath)) {
      const data = fs.readFileSync(logoPath);
      LOGO_BASE64 = `data:image/png;base64,${data.toString("base64")}`;
      logger.info(`Logo loaded from ${logoPath}`);
      break;
    }
  } catch {
    /* skip */
  }
}

function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(amount) || 0,
  );
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function resolveImageSrc(imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("data:")) return imagePath;
  if (imagePath.startsWith("http")) return imagePath;

  const candidates = [
    path.join(process.cwd(), "uploads", imagePath),
    path.join(process.cwd(), "public", "uploads", imagePath),
    path.join(process.cwd(), imagePath),
  ];

  for (const fullPath of candidates) {
    try {
      if (fs.existsSync(fullPath)) {
        const data = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).slice(1).toLowerCase();
        const mime = ["jpg", "jpeg"].includes(ext)
          ? "jpeg"
          : ext === "png"
            ? "png"
            : ext === "webp"
              ? "webp"
              : ext === "gif"
                ? "gif"
                : "jpeg";
        return `data:image/${mime};base64,${data.toString("base64")}`;
      }
    } catch {
      /* skip */
    }
  }

  const baseUrl = process.env.API_BASE_URL || "http://localhost:5000";
  return `${baseUrl}/uploads/${imagePath}`;
}

function getPriceInclGst(item: any): number {
  const basePrice = Number(item.basePrice) || 0;
  const gstPercent = Number(item.gstPercent) || 18;
  return basePrice + (basePrice * gstPercent) / 100;
}

function getAmount(item: any): number {
  const basePrice = Number(item.basePrice) || 0;
  const quantity = Number(item.quantity) || 1;
  return basePrice * quantity;
}

function getGstAmount(item: any): number {
  const gstPercent = Number(item.gstPercent) || 18;
  const amount = getAmount(item);
  return (amount * gstPercent) / 100;
}

function getDiscountAmount(item: any): number {
  const discountPercent = Number(item.discountPercent) || 0;
  const amount = getAmount(item);
  return (amount * discountPercent) / 100;
}

function getTotalInclGst(item: any): number {
  const amount = getAmount(item);
  const gst = getGstAmount(item);
  const discount = getDiscountAmount(item);
  return amount + gst - discount;
}

function getMergedSelections(
  item: any,
): Array<{ label: string; values: string[] }> {
  const rows = (item.selections || []).flatMap((selection: any) =>
    (selection.values || [])
      .filter(
        (value: any) =>
          value &&
          typeof value.value === "string" &&
          value.value.trim() &&
          value.value !== "N.A.",
      )
      .map((value: any) => ({
        label: selection.selectionName || "Selection",
        value: value.value,
      })),
  );

  const grouped = new Map<string, string[]>();
  rows.forEach((row: any) => {
    if (!grouped.has(row.label)) {
      grouped.set(row.label, []);
    }
    grouped.get(row.label)!.push(row.value);
  });

  return Array.from(grouped.entries()).map(([label, values]) => ({
    label,
    values,
  }));
}

const termsAndConditions = [
  "The quotation is valid for a period of 30 days from the date of this offer.",
  "The order shall be processed only after receipt of the purchase order and 70% advance payment from the client.",
  "The order shall be dispatched only after receipt of the remaining 30% balance payment.",
  "The order shall be dispatched within 3 working days after receipt of the final payment.",
  "Transfer of property in goods shall occur once the goods are dispatched to the customer. Ecstatics shall ensure repair or replacement in case of transit damage.",
  "In case of cancellation of the order at any stage for any reason, the amount collected shall stand forfeited.",
  "After delivery, if the customer is unable to accept the products at site for any reason, the client shall be responsible for any damages to the products.",
  "Godown demurrage charges of ₹3,000 per week shall be levied if delivery is not accepted after intimation. Products will be held for a maximum of 4 weeks, post which the order will be cancelled and the amount collected will be forfeited.",
  "Invoice shall be issued in the name mentioned in the purchase order received from the client.",
  "All rights related to photography, videography, and promotional activities of the products before and after delivery are reserved with Ecstatics Spaces India Pvt. Ltd.",
  "Expenses related to logistics, transportation, unloading, and on-site placement of products shall be in the client's scope.",
  "A tolerance of up to 50mm shall be acceptable in the gross dimensions of the products.",
  "All products shall be dispatched from the Sangamner godown.",
  "All disputes are subject to Pune jurisdiction only.",
  "All prices are mentioned in INR.",
];

function buildProjectHTML(project: any): string {
  const customer = project.customer || {};
  const salesPersonName = project.salesPerson?.name || "—";
  const items = project.items || [];

  // ═══ CONSISTENT BORDER DEFINITIONS ═══
  const border = "1px solid #000";
  const borderThin = "1px solid #ccc";

  const logoHtml = LOGO_BASE64
    ? `<img src="${LOGO_BASE64}" alt="Logo" style="height:70px;width:auto;object-fit:contain;" />`
    : `<div style="font-size:28px;font-weight:700;">ecstatics.</div>`;

  const companyHeader = () => `
    <div style="border-bottom:${border};">
      <div style="padding:13px 20px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px;">
        <div style="flex:1;">
          <div style="font-size:12px;color:#333;line-height:1.5;">
            <div style="font-weight:600;">Ecstatics Spaces India Pvt. Ltd.</div>
            <div>3120, Ganga Trueno, Airport Road,</div>
            <div>Viman Nagar, Pune</div>
            <div style="margin-top:2px;">GST No: 27AAFCE9942B1ZM</div>
          </div>
        </div>
        <div style="flex-shrink:0;">${logoHtml}</div>
      </div>
    </div>`;

  const clientInfoRow = () => `
    <div style="display:flex;border-bottom:${border};">
      <div style="flex:1;padding:11px 20px;border-right:${border};font-size:13px;">
        <div style="display:flex;gap:8px;margin-bottom:5px;"><span style="color:#666;min-width:95px;">Client name</span><span style="font-weight:600;">${customer.name || ""}</span></div>
        <div style="display:flex;gap:8px;margin-bottom:5px;"><span style="color:#666;min-width:95px;">Contact No</span><span>${customer.mobile || ""}</span></div>
        <div style="display:flex;gap:8px;margin-bottom:5px;"><span style="color:#666;min-width:95px;">Project Name</span><span style="font-weight:600;">${project.projectName || "—"}</span></div>
        <div style="display:flex;gap:8px;"><span style="color:#666;min-width:95px;">Project No</span><span style="font-weight:600;">${project.projectNo || "—"}</span></div>
      </div>
      <div style="width:170px;min-width:170px;padding:11px 20px;font-size:14px;text-align:left;">
        <div style="color:#666;margin-bottom:5px;font-weight:600;">Date</div>
        <div style="font-weight:600;color:#111;">${formatDate(project.date)}</div>
      </div>
    </div>`;

  const pageFooter = () => `
    <div style="border-top:${border};padding:9px 20px;display:flex;justify-content:space-between;font-size:12px;color:#555;background-color:#fafafa;">
      <span>(+91) 7066 46 6060</span><span>info@esipl.in</span>
    </div>`;

  const productPageFooter = () => `
    <div style="padding:9px 20px;display:flex;justify-content:space-between;font-size:12px;color:#555;background-color:#fafafa;">
      <span>(+91) 7066 46 6060</span><span>info@esipl.in</span>
    </div>`;

  // ═══ PAGE 1: SUMMARY ═══
  const summaryRows = items
    .map(
      (item: any, index: number) => `
    <tr>
      <td style="border-bottom:${borderThin};border-right:${borderThin};padding:9px 12px;text-align:center;">${index + 1}</td>
      <td style="border-bottom:${borderThin};border-right:${borderThin};padding:9px 12px;font-weight:500;">${item.quotationCode}</td>
      <td style="border-bottom:${borderThin};border-right:${borderThin};padding:9px 12px;text-align:right;">${formatCurrency(getPriceInclGst(item))}</td>
      <td style="border-bottom:${borderThin};border-right:${borderThin};padding:9px 12px;text-align:center;">${item.quantity}</td>
      <td style="border-bottom:${borderThin};border-right:${borderThin};padding:9px 12px;text-align:right;font-weight:500;">${formatCurrency(item.totalWithGst)}</td>
    </tr>`,
    )
    .join("");

  const page1 = `
    <div class="pdf-page">
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="border:${border};flex:1;display:flex;flex-direction:column;">
          ${companyHeader()}
          ${clientInfoRow()}
          <div style="border-bottom:${border};padding:9px 20px;text-align:center;font-weight:600;font-size:16px;background-color:#f9f9f9;">Quotation Summary</div>
          <div style="flex:1;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background-color:#f3f4f6;">
                  <th style="border-bottom:${border};border-right:${borderThin};padding:9px 12px;text-align:center;font-weight:600;width:55px;font-size:12.5px;">Sr no</th>
                  <th style="border-bottom:${border};border-right:${borderThin};padding:9px 12px;text-align:left;font-weight:600;font-size:12.5px;">Code</th>
                  <th style="border-bottom:${border};border-right:${borderThin};padding:9px 12px;text-align:right;font-weight:600;font-size:12.5px;">Price <span style="font-weight:400;font-size:11px;color:#666;">(inc. of gst)</span></th>
                  <th style="border-bottom:${border};border-right:${borderThin};padding:9px 12px;text-align:center;font-weight:600;width:65px;font-size:12.5px;">Units</th>
                  <th style="border-bottom:${border};border-right:${borderThin};padding:9px 12px;text-align:right;font-weight:600;font-size:12.5px;">Total <span style="font-weight:400;font-size:11px;color:#666;">(incl. of gst)</span></th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
                <tr style="background-color:#f9f9f9;">
                  <td colspan="4" style="border-top:${border};border-bottom:${border};border-right:${borderThin};padding:11px 12px;text-align:center;font-weight:600;font-size:14px;">Grand Total <span style="font-weight:500;font-size:12px;color:#555;">(incl. of gst)</span></td>
                  <td style="border-top:${border};border-bottom:${border};border-right:${borderThin};padding:11px 12px;text-align:right;font-weight:600;font-size:14px;">${formatCurrency(project.grandTotalWithGst)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="border-top:${border};display:flex;">
            <div style="flex:1;padding:13px 20px;display:flex;flex-direction:column;justify-content:flex-end;">
              <div style="font-size:12px;color:#666;">Sales Manager</div>
              <div style="font-size:14px;font-weight:600;margin-top:3px;">${salesPersonName}</div>
            </div>
          </div>
          ${pageFooter()}
        </div>
      </div>
    </div>`;

  // ═══ PRODUCT DETAIL PAGES - FIXED LAYOUT ═══
  const productPages = items
    .map((item: any, index: number) => {
      const imageSrc = item.images?.[0] ? resolveImageSrc(item.images[0]) : "";

      const imageHtml = imageSrc
        ? `<div style="width:100%;padding-bottom:56.25%;position:relative;overflow:hidden;"><img src="${imageSrc}" alt="${item.quotationName || ""}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;" /></div>`
        : `<div style="width:100%;padding-bottom:56.25%;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;color:#999;font-size:17px;text-align:center;display:flex;align-items:center;justify-content:center;">No Image Available</div></div>`;

      // ─── Selections Table ───
      const mergedSelections = getMergedSelections(item);
      let selectionsTableHtml = "";

      if (mergedSelections.length > 0) {
        let selectionRows = "";
        mergedSelections.forEach((sel, selIdx) => {
          sel.values.forEach((value, idx) => {
            if (idx === 0) {
              selectionRows += `<tr><td rowspan="${sel.values.length}" style="padding:5px 13px;border-bottom:${borderThin};border-right:${borderThin};color:#555;width:60px;vertical-align:top;">${sel.label}</td><td style="padding:5px 13px;border-bottom:${borderThin};border-right:${borderThin};"> ${value}</td></tr>`;
            } else {
              selectionRows += `<tr><td style="padding:5px 13px;border-bottom:${borderThin};border-right:${borderThin};"> ${value}</td></tr>`;
            }
          });
        });

        selectionsTableHtml = `<table style="width:100%;border-collapse:collapse;"><tbody><tr><td colspan="2" style="padding:6px 13px;font-weight:600;font-size:13px;background-color:#f9f9f9;border-bottom:${borderThin};border-right:${borderThin};">Selections</td></tr>${selectionRows}</tbody></table>`;
      } else {
        selectionsTableHtml = `<table style="width:100%;border-collapse:collapse;"><tbody><tr><td colspan="2" style="padding:6px 13px;font-weight:600;font-size:13px;background-color:#f9f9f9;border-bottom:${borderThin};border-right:${borderThin};">Selections</td></tr><tr><td colspan="2" style="padding:5px 13px;color:#777;font-size:12px;border-right:${borderThin};">No selections selected</td></tr></tbody></table>`;
      }

      // ─── Description Table ───
      let descRows = "";
      const descData: Array<{ label: string; value: string }> = [];

      if (item.woodName) descData.push({ label: "Wood", value: item.woodName });
      if (item.polishName)
        descData.push({ label: "Polish", value: item.polishName });
      if (item.fabricName)
        descData.push({ label: "Fabric", value: item.fabricName });
      if (item.quotation?.length)
        descData.push({
          label: "Length",
          value: `${item.quotation.length} (mm)`,
        });
      if (item.quotation?.width)
        descData.push({
          label: "Width",
          value: `${item.quotation.width} (mm)`,
        });

      descData.forEach((data, idx) => {
        descRows += `<tr><td style="padding:5px 13px;border-bottom:${borderThin};border-right:${borderThin};color:#555;width:110px;">${data.label}</td><td style="padding:5px 13px;border-bottom:${borderThin};border-right:${borderThin};"> ${data.value}</td></tr>`;
      });

      const specialNoteHtml = item.specialNote
        ? `<div style="font-size:12px;color:#666;margin-top:5px;"><span style="font-weight:600;font-size:13px;">Special Note: </span><span style="color:#333;">${item.specialNote}</span></div>`
        : "";

      descRows += `<tr><td colspan="2" style="padding:9px 13px;vertical-align:bottom;border-right:${borderThin};">${specialNoteHtml}<div style="font-size:12px;color:#666;margin-top:5px;">Sales Manager</div><div style="font-weight:600;font-size:13px;">${salesPersonName}</div></td></tr>`;

      // ─── Pricing Table ───
      const pricingRows = `
        <tr><td style="padding:7px 13px;border-bottom:${borderThin};border-right:${borderThin};font-weight:500;">Price <span style="font-size:11px;color:#666;font-weight:400;">(inc. of gst)</span></td><td style="padding:7px 13px;border-bottom:${borderThin};border-right:${borderThin};text-align:right;font-weight:600;">${formatCurrency(getPriceInclGst(item))}</td></tr>
        <tr><td style="padding:7px 13px;border-bottom:${borderThin};border-right:${borderThin};">Discount <span style="font-size:12px;color:#666;">(${Number(item.discountPercent)}%)</span></td><td style="padding:7px 13px;border-bottom:${borderThin};border-right:${borderThin};text-align:right;color:#c00;font-weight:500;">-${formatCurrency(getDiscountAmount(item))}</td></tr>
        <tr><td style="padding:7px 13px;border-bottom:${borderThin};border-right:${borderThin};">Units</td><td style="padding:7px 13px;border-bottom:${borderThin};border-right:${borderThin};text-align:right;font-weight:500;">${item.quantity}</td></tr>
        <tr style="background-color:#f9f9f9;"><td style="padding:9px 13px;border-bottom:${borderThin};border-right:${borderThin};font-weight:600;font-size:14px;">Final Price <span style="font-size:11px;color:#555;font-weight:500;">(incl. of gst)</span></td><td style="padding:9px 13px;border-bottom:${borderThin};border-right:${borderThin};text-align:right;font-weight:600;font-size:14px;">${formatCurrency(getTotalInclGst(item))}</td></tr>
        <tr><td style="padding:7px 13px;border-right:${borderThin};text-align:left;">Quotation No</td><td style="padding:7px 13px;border-right:${borderThin};text-align:right;font-weight:600;font-size:14px;">${item.projectQuotationNo || index + 1}</td></tr>
      `;

      return `
      <div class="pdf-page">
        <div style="height:100%;display:flex;flex-direction:column;">
          <div style="border:${border};flex:1;display:flex;flex-direction:column;">
            ${companyHeader()}
            ${clientInfoRow()}
            <div style="display:flex;border-bottom:${border};">
              <div style="flex:1;padding:7px 13px;border-right:${border};font-weight:600;font-size:13px;background-color:#f9f9f9;">${item.quotationName || "-"}</div>
              <div style="width:170px;min-width:170px;display:flex;">
                <div style="flex:1;padding:7px 2px;border-right:${border};font-weight:600;font-size:13px;background-color:#f9f9f9;text-align:center;">CODE</div>
                <div style="flex:1;padding:7px 7px;font-weight:600;font-size:13px;word-break:break-word;">${item.quotationCode || "—"}</div>
              </div>
            </div>
            
            <div style="display:flex;border-bottom:${border};">
              <!-- LEFT COLUMN: Image + Description (60%) -->
              <div style="width:60%;border-right:${border};">
                <!-- Image Section -->
                <div style="border-bottom:${border};">
                  ${imageHtml}
                </div>
                <!-- Description Table -->
                <div style="font-size:13px;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tbody>${descRows}</tbody>
                  </table>
                </div>
              </div>

              <!-- RIGHT COLUMN: Selections + Pricing (40%) -->
              <div style="width:40%;">
                <!-- Selections Table -->
                <div style="border-bottom:${border};font-size:13px;">
                  ${selectionsTableHtml}
                </div>
                <!-- Pricing Table -->
                <div style="font-size:13px;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tbody>${pricingRows}</tbody>
                  </table>
                </div>
              </div>
            </div>

            ${productPageFooter()}
          </div>
        </div>
      </div>`;
    })
    .join("");

  // ═══ TERMS & CONDITIONS PAGE ═══
  const termsPage = `
    <div class="pdf-page">
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="border:${border};flex:1;display:flex;flex-direction:column;">
          ${companyHeader()}
          <div style="border-bottom:${border};padding:9px 20px;text-align:center;font-weight:600;font-size:16px;background-color:#f9f9f9;">Terms &amp; Conditions</div>
          <div style="flex:1;padding:18px 22px;font-size:12px;line-height:1.7;color:#222;"><ol style="padding-left:18px;margin:0;">${termsAndConditions.map((t) => `<li style="margin-bottom:7px;padding-left:4px;">${t}</li>`).join("")}</ol></div>
          ${pageFooter()}
        </div>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 210mm; margin: 0; padding: 0; }
    body { font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { size: A4; margin: 0; }
    .pdf-page { width: 210mm; height: 297mm; padding: 12mm; margin: 0; overflow: hidden; box-sizing: border-box; page-break-after: always; page-break-inside: avoid; position: relative; }
    .pdf-page:last-child { page-break-after: auto; }
    img { max-width: 100%; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    table { border-spacing: 0; }
  </style>
</head>
<body>${page1}${productPages}${termsPage}</body>
</html>`;
}

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
        "--disable-web-security",
      ],
      defaultViewport: { width: 1920, height: 1080 },
    });
  }
  return browserInstance;
}

export async function generateProjectPDF(project: any): Promise<string> {
  const html = buildProjectHTML(project);
  const pdfPath = path.join(PDF_DIR, `${project.id}.pdf`);

  let page: any = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount <= maxRetries) {
    try {
      const browser = await getBrowser();
      page = await browser.newPage();

      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });

      await page.setContent(html, {
        waitUntil: ["domcontentloaded"],
        timeout: 90_000,
      });

      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      await page.close();
      logger.info(
        `PDF generated successfully → ${pdfPath} (retries: ${retryCount})`,
      );
      return pdfPath;
    } catch (err: any) {
      logger.error(
        `PDF generation attempt ${retryCount + 1} failed:`,
        err.message,
      );
      retryCount++;

      if (retryCount > maxRetries) {
        throw new Error(
          `PDF generation failed after ${maxRetries} retries: ${err.message}`,
        );
      }

      await page?.close().catch(() => {});
      page = null;

      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(5000 * Math.pow(2, retryCount), 30000)),
      );
    }
  }

  logger.info(`PDF generated → ${pdfPath}`);
  return pdfPath;
}

export function getProjectPDFPath(projectId: string): string {
  return path.join(PDF_DIR, `${projectId}.pdf`);
}

export function projectPDFExists(projectId: string): boolean {
  return fs.existsSync(getProjectPDFPath(projectId));
}

export function deleteProjectPDF(projectId: string): void {
  const p = getProjectPDFPath(projectId);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    logger.info(`PDF deleted → ${p}`);
  }
}

process.on("exit", () => {
  browserInstance?.close().catch(() => {});
});
