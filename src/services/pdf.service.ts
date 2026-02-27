// src/services/pdf.service.ts

import puppeteer, { Browser } from "puppeteer";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

// ─── Constants ───────────────────────────────────────────
const PDF_DIR = path.join(process.cwd(), "uploads", "pdfs");

if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// ─── Logo base64 (load once at startup) ──────────────────
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

// ─── Helpers ─────────────────────────────────────────────
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
        const mime =
          ext === "jpg"
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

// ─── Terms & Conditions ──────────────────────────────────
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

// ═══════════════════════════════════════════════════════════
// HTML TEMPLATE BUILDER
// ═══════════════════════════════════════════════════════════
function buildProjectHTML(project: any): string {
  const customer = project.customer || {};
  const salesPersonName = project.salesPerson?.name || "—";
  const items = project.items || [];

  const border = "1.5px solid #000";
  const borderThin = "1px solid #000";

  // ── Logo HTML ──
  const logoHtml = LOGO_BASE64
    ? `<img src="${LOGO_BASE64}" alt="Logo" style="height:52px;width:auto;object-fit:contain;" />`
    : `<div style="font-size:28px;font-weight:800;letter-spacing:-1px;line-height:1;">ecstatics<span>.</span></div>`;

  // ── Company Header ──────────────────────────────────────
  // ★ FE has display:flex COMMENTED OUT on inner div → logo & text stack vertically
  const companyHeader = (rightLabel: string) => `
    <div style="display:flex;border-bottom:${border};">
      <div style="flex:1;padding:12px 20px;border-right:${border};align-items:center;">
        <div style="flex-shrink:0;">
          ${logoHtml}
        </div>
        <div style="font-size:9px;color:#333;line-height:1.5;">
          <div style="font-weight:600;">Ecstatics Spaces India Pvt. Ltd.</div>
          <div>3120, Ganga Trueno, Airport Road,</div>
          <div>Viman Nagar, Pune</div>
          <div style="margin-top:2px;">GST No: 27AAFCE9942B1ZM</div>
        </div>
      </div>
      <div style="width:160px;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="font-size:20px;font-weight:700;letter-spacing:0.5px;">${rightLabel}</div>
      </div>
    </div>`;

  // ── Client Info Row ─────────────────────────────────────
  const clientInfoRow = () => `
    <div style="display:flex;border-bottom:${border};">
      <div style="flex:1;padding:10px 20px;border-right:${border};font-size:10px;">
        <div style="display:flex;gap:8px;margin-bottom:4px;">
          <span style="color:#666;min-width:75px;">Client name</span>
          <span style="font-weight:600;">${customer.name || ""}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <span style="color:#666;min-width:75px;">Contact No</span>
          <span>${customer.mobile || ""}</span>
        </div>
      </div>
      <div style="width:160px;padding:10px 20px;font-size:10px;text-align:right;">
        <div style="color:#666;margin-bottom:4px;">Date</div>
        <div style="font-weight:600;">${formatDate(project.date)}</div>
      </div>
    </div>`;

  // ── Page Footer (with border-top) ──
  const pageFooter = () => `
    <div style="border-top:${border};padding:8px 20px;display:flex;justify-content:space-between;font-size:9px;color:#555;background-color:#fafafa;">
      <span>(+91) 7066 46 6060</span>
      <span>info@esipl.in</span>
    </div>`;

  // ── Product Page Footer (NO border-top — matches FE) ───
  const productPageFooter = () => `
    <div style="padding:8px 20px;display:flex;justify-content:space-between;font-size:9px;color:#555;background-color:#fafafa;">
      <span>(+91) 7066 46 6060</span>
      <span>info@esipl.in</span>
    </div>`;

  // ═══ PAGE 1 — QUOTATION SUMMARY ════════════════════════

  const summaryRows = items
    .map(
      (item: any, index: number) => `
    <tr>
      <td style="border-bottom:1px solid #ccc;border-right:${borderThin};padding:8px 12px;text-align:center;">${index + 1}</td>
      <td style="border-bottom:1px solid #ccc;border-right:${borderThin};padding:8px 12px;font-weight:500;">${item.quotationName + "  (" + item.quotationCode + ")"}</td>
      <td style="border-bottom:1px solid #ccc;border-right:${borderThin};padding:8px 12px;text-align:right;">${formatCurrency(item.finalPrice)}</td>
      <td style="border-bottom:1px solid #ccc;border-right:${borderThin};padding:8px 12px;text-align:center;">${item.quantity}</td>
      <td style="border-bottom:1px solid #ccc;padding:8px 12px;text-align:right;font-weight:500;">${formatCurrency(item.total)}</td>
    </tr>`,
    )
    .join("");

  const page1 = `
    <div class="pdf-page">
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="border:${border};flex:1;display:flex;flex-direction:column;padding:0;">

          ${companyHeader("Quotation")}
          ${clientInfoRow()}

          <!-- Summary Title -->
          <div style="border-bottom:${border};padding:8px 20px;text-align:center;font-weight:700;font-size:13px;background-color:#f9f9f9;">
            Quotation Summary
          </div>

          <!-- Summary Table -->
          <div style="flex:1;">
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
              <thead>
                <tr style="background-color:#f3f4f6;">
                  <th style="border-bottom:${border};border-right:${borderThin};padding:8px 12px;text-align:center;font-weight:700;width:50px;font-size:9.5px;">Sr no</th>
                  <th style="border-bottom:${border};border-right:${borderThin};padding:8px 12px;text-align:left;font-weight:700;font-size:9.5px;">Code</th>
                  <th style="border-bottom:${border};border-right:${borderThin};padding:8px 12px;text-align:right;font-weight:700;font-size:9.5px;">Final Price</th>
                  <th style="border-bottom:${border};border-right:${borderThin};padding:8px 12px;text-align:center;font-weight:700;width:60px;font-size:9.5px;">Units</th>
                  <th style="border-bottom:${border};padding:8px 12px;text-align:right;font-weight:700;font-size:9.5px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
                <tr style="background-color:#f9f9f9;">
                  <td colspan="4" style="border-top:${border};border-right:${borderThin};padding:10px 12px;text-align:center;font-weight:800;font-size:11px;">Grand Total</td>
                  <td style="border-top:${border};padding:10px 12px;text-align:right;font-weight:800;font-size:11px;">${formatCurrency(project.grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom: Sales Manager + GST -->
          <div style="border-top:${border};display:flex;">
            <div style="flex:1;padding:12px 20px;border-right:${border};display:flex;flex-direction:column;justify-content:flex-end;">
              <div style="font-size:9px;color:#666;">Sales Manager</div>
              <div style="font-size:11px;font-weight:600;margin-top:2px;">${salesPersonName}</div>
            </div>
            <div style="width:260px;">
              <table style="width:100%;border-collapse:collapse;font-size:10px;">
                <tbody>
                  <tr>
                    <td style="padding:6px 12px;border-bottom:1px solid #ccc;font-weight:500;">Grand Total</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #ccc;text-align:center;width:45px;"></td>
                    <td style="padding:6px 12px;border-bottom:1px solid #ccc;text-align:right;font-weight:500;">${formatCurrency(project.grandTotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 12px;border-bottom:1px solid #ccc;">IGST</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #ccc;text-align:center;">0%</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #ccc;text-align:right;">0</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 12px;border-bottom:1px solid #ccc;">CGST</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #ccc;text-align:center;">9%</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #ccc;text-align:right;">${formatCurrency(project.cgst)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 12px;border-bottom:1px solid #ccc;">SGST</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #ccc;text-align:center;">9%</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #ccc;text-align:right;">${formatCurrency(project.sgst)}</td>
                  </tr>
                  <tr style="background-color:#f3f4f6;">
                    <td style="padding:8px 12px;font-weight:800;font-size:10px;">Grand Total With GST</td>
                    <td style="padding:8px 8px;text-align:center;font-weight:700;">18%</td>
                    <td style="padding:8px 12px;text-align:right;font-weight:800;font-size:11px;">${formatCurrency(project.grandTotalWithGst)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          ${pageFooter()}
        </div>
      </div>
    </div>`;

  // ═══ PRODUCT DETAIL PAGES ══════════════════════════════

  const productPages = items
    .map((item: any, index: number) => {
      const imageSrc = item.images?.[0] ? resolveImageSrc(item.images[0]) : "";

      // ── Notes ──
      let notesHtml = `<div>1. ${item.quotationName || ""}</div>`;
      if (item.woodName) {
        notesHtml += `<div>2. Base frame &amp; support <span style="display:inline-block;width:4px;"></span>: ${item.woodName} with ${item.polishName || ""}</div>`;
      }
      if (item.fabricName) {
        const n = item.woodName ? "3" : "2";
        notesHtml += `<div>${n}. Upholstery <span style="display:inline-block;width:4px;"></span>: ${item.fabricName}</div>`;
      }
      if (item.notes?.length > 0 && !item.woodName && !item.fabricName) {
        item.notes.forEach((note: string, i: number) => {
          notesHtml += `<div>${i + 1}. ${note}</div>`;
        });
      }

      // ── Description rows ──
      let descRows = `
        <tr>
          <td colspan="2" style="padding:5px 12px;border-bottom:${borderThin};font-weight:600;font-size:10px;">Description</td>
        </tr>`;

      if (item.woodName) {
        descRows += `
        <tr>
          <td style="padding:4px 12px;border-bottom:${borderThin};color:#555;width:100px;">Wood</td>
          <td style="padding:4px 12px;border-bottom:${borderThin};">: ${item.woodName}</td>
        </tr>`;
      }
      if (item.polishName) {
        descRows += `
        <tr>
          <td style="padding:4px 12px;border-bottom:${borderThin};color:#555;">Polish</td>
          <td style="padding:4px 12px;border-bottom:${borderThin};">: ${item.polishName}</td>
        </tr>`;
      }
      if (item.fabricName) {
        descRows += `
        <tr>
          <td style="padding:4px 12px;border-bottom:${borderThin};color:#555;">Fabric</td>
          <td style="padding:4px 12px;border-bottom:${borderThin};">: ${item.fabricName}</td>
        </tr>`;
      }
      if (!item.woodName && !item.polishName && !item.fabricName) {
        descRows += `
        <tr>
          <td style="padding:4px 12px;border-bottom:${borderThin};color:#555;">Length</td>
          <td style="padding:4px 12px;border-bottom:${borderThin};">${
            (item as any).length ? (item as any).length + " (mm)" : "—"
          }</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;border-bottom:${borderThin};color:#555;">Width</td>
          <td style="padding:4px 12px;border-bottom:${borderThin};">${
            (item as any).width ? (item as any).width + " (mm)" : "—"
          }</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;border-bottom:${borderThin};color:#555;">Special Note</td>
          <td style="padding:4px 12px;border-bottom:${borderThin};">${item.specialNote || "—"}</td>
        </tr>`;
      }
      descRows += `
        <tr>
          <td colspan="2" style="padding:8px 12px;vertical-align:bottom;">
            <div style="font-size:9px;color:#666;margin-top:4px;">Sales Manager</div>
            <div style="font-weight:600;font-size:10px;">${salesPersonName}</div>
          </td>
        </tr>`;

      // ── Image HTML ──
      const imageHtml = imageSrc
        ? `<img src="${imageSrc}" alt="${item.productName || ""}" style="max-height:400px;max-width:100%;width:auto;height:auto;object-fit:contain;display:block;" />`
        : `<div style="color:#999;font-size:14px;text-align:center;padding:40px;">No Image Available</div>`;

      return `
      <div class="pdf-page">
        <div style="height:100%;display:flex;flex-direction:column;">
          <div style="border:${border};flex:1;display:flex;flex-direction:column;">

            ${companyHeader("Quotation")}

            <!-- Notes -->
            <div style="border-bottom:${border};padding:10px 20px;font-size:9.5px;line-height:1.7;">
              <div style="font-weight:700;margin-bottom:4px;">Notes:</div>
              ${notesHtml}
            </div>

            ${clientInfoRow()}

            <!-- Reference Image Header + CODE -->
            <div style="display:flex;border-bottom:${borderThin};">
              <div style="flex:1;padding:6px 12px;border-right:${borderThin};font-weight:600;font-size:10px;background-color:#f9f9f9;">
                ${item.quotationName || "-"}
              </div>
              <div style="display:flex;">
                <div style="padding:6px 12px;border-right:${borderThin};font-weight:700;font-size:10px;background-color:#f9f9f9;">CODE</div>
                <div style="padding:6px 16px;font-weight:600;font-size:10px;">${item.quotationCode || ""}</div>
              </div>
            </div>

            <!-- Large Image -->
            <div style="display:flex;align-items:center;justify-content:center;border-bottom:${borderThin};">
              ${imageHtml}
            </div>

            <!-- Bottom: Description + Pricing -->
            <div style="display:flex;border-bottom:${border};">

              <!-- Left — Description -->
              <div style="width:50%;border-right:${border};font-size:10px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tbody>${descRows}</tbody>
                </table>
              </div>

              <!-- Right — Pricing -->
              <div style="width:50%;font-size:10px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tbody>
                    <tr>
                      <td style="padding:5px 12px;border-bottom:${borderThin};">Price</td>
                      <td style="padding:5px 8px;border-bottom:${borderThin};text-align:center;width:40px;"></td>
                      <td style="padding:5px 12px;border-bottom:${borderThin};text-align:right;">${formatCurrency(item.basePrice)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 12px;border-bottom:${borderThin};">Discount</td>
                      <td style="padding:5px 8px;border-bottom:${borderThin};text-align:center;">${Number(item.discountPercent)}%</td>
                      <td style="padding:5px 12px;border-bottom:${borderThin};text-align:right;">${formatCurrency(item.discountAmount)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 12px;border-bottom:${borderThin};">Final Price</td>
                      <td style="padding:5px 8px;border-bottom:${borderThin};"></td>
                      <td style="padding:5px 12px;border-bottom:${borderThin};text-align:right;">${formatCurrency(item.finalPrice)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 12px;border-bottom:${borderThin};">Units</td>
                      <td style="padding:5px 8px;border-bottom:${borderThin};"></td>
                      <td style="padding:5px 12px;border-bottom:${borderThin};text-align:right;">${item.quantity}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 12px;border-bottom:${borderThin};font-weight:600;">Total</td>
                      <td style="padding:5px 8px;border-bottom:${borderThin};"></td>
                      <td style="padding:5px 12px;border-bottom:${borderThin};text-align:right;font-weight:600;">${formatCurrency(item.total)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 12px;border-bottom:${borderThin};">IGST</td>
                      <td style="padding:5px 8px;border-bottom:${borderThin};text-align:center;">0%</td>
                      <td style="padding:5px 12px;border-bottom:${borderThin};text-align:right;">0</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 12px;border-bottom:${borderThin};">CGST</td>
                      <td style="padding:5px 8px;border-bottom:${borderThin};text-align:center;">9%</td>
                      <td style="padding:5px 12px;border-bottom:${borderThin};text-align:right;">${formatCurrency(item.cgst)}</td>
                    </tr>
                    <tr style="background-color:#f9f9f9;">
                      <td style="padding:5px 12px;border-bottom:${borderThin};font-weight:700;">Total With GST</td>
                      <td style="padding:5px 8px;border-bottom:${borderThin};"></td>
                      <td style="padding:5px 12px;border-bottom:${borderThin};text-align:right;font-weight:700;">${formatCurrency(item.totalWithGst)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 12px;text-align:center;" colspan="2">Quotation</td>
                      <td style="padding:5px 12px;text-align:right;font-weight:700;font-size:13px;">${index + 1}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            ${productPageFooter()}

          </div>
        </div>
      </div>`;
    })
    .join("");

  // ═══ TERMS & CONDITIONS PAGE (matches FE exactly) ══════

  const termsPage = `
    <div class="pdf-page">
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="border:${border};flex:1;display:flex;flex-direction:column;">

          <!-- Header — matches FE T&C header exactly -->
          <div style="display:flex;border-bottom:${border};">
            <div style="flex:1;padding:12px 20px;border-right:${border};align-items:center;">
              <div style="flex-shrink:0;">
                ${logoHtml}
              </div>
              <div style="font-size:9px;color:#333;line-height:1.5;">
                <div style="font-weight:600;">Ecstatics Spaces India Pvt. Ltd.</div>
              </div>
            </div>
            <div style="width:200px;display:flex;align-items:center;justify-content:center;">
              <div style="font-size:16px;font-weight:700;">Terms &amp; Conditions</div>
            </div>
          </div>

          <!-- Terms Content -->
          <div style="flex:1;padding:20px 24px;font-size:10px;line-height:1.8;color:#222;">
            <ol style="padding-left:18px;margin:0;">
              ${termsAndConditions.map((t) => `<li style="margin-bottom:8px;padding-left:4px;">${t}</li>`).join("")}
            </ol>
          </div>

          ${pageFooter()}
        </div>
      </div>
    </div>`;

  // ═══ FULL DOCUMENT ══════════════════════════════════════

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 210mm;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @page {
      size: A4;
      margin: 0;
    }

    .pdf-page {
      width: 210mm;
      height: 297mm;
      padding: 12mm;
      margin: 0;
      overflow: hidden;
      box-sizing: border-box;
      page-break-after: always;
      page-break-inside: avoid;
      position: relative;
    }

    .pdf-page:last-child {
      page-break-after: auto;
    }

    img {
      max-width: 100%;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    table {
      border-spacing: 0;
    }
  </style>
</head>
<body>
  ${page1}
  ${productPages}
  ${termsPage}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
// PUPPETEER BROWSER POOL
// ═══════════════════════════════════════════════════════════
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
      ],
    });
  }
  return browserInstance;
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════

export async function generateProjectPDF(project: any): Promise<string> {
  const html = buildProjectHTML(project);
  const pdfPath = path.join(PDF_DIR, `${project.id}.pdf`);

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30_000,
    });

    await page.evaluateHandle("document.fonts.ready");

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    logger.info(`PDF generated → ${pdfPath}`);
    return pdfPath;
  } catch (err) {
    logger.error("PDF generation failed:", err);
    throw err;
  } finally {
    if (page) await page.close().catch(() => {});
  }
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
