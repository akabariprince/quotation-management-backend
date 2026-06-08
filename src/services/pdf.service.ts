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

function getSelectionBoxes(item: any): string[] {
  const mergedSelections = getMergedSelections(item);
  const boxes: string[] = [];

  const multiValueItems: { label: string; values: string[] }[] = [];
  const singleValueItems: { label: string; values: string[] }[] = [];

  mergedSelections.forEach((sel) => {
    if (sel.values.length >= 2) {
      multiValueItems.push(sel);
    } else if (sel.values.length === 1) {
      singleValueItems.push(sel);
    }
  });

  multiValueItems.forEach((sel) => {
    sel.values.slice(0, 2).forEach((value) => {
      boxes.push(`${sel.label}: ${value}`);
    });
  });

  singleValueItems.forEach((sel) => {
    boxes.push(`${sel.label}: ${sel.values[0]}`);
  });

  while (boxes.length < 20) {
    boxes.push("");
  }

  return boxes.slice(0, 20);
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

  const border = "1px solid #000";
  // const borderThin = "1px solid #ccc";

  const logoHtml = LOGO_BASE64
    ? `<img src="${LOGO_BASE64}" alt="Logo" style="height:75px;width:auto;object-fit:contain;" />`
    : `<div style="font-size:30px;font-weight:700;">ecstatics.</div>`;

  const companyHeader = () => `
    <div style="border-bottom:${border};">
      <div style="padding:12px 17px;display:flex;justify-content:space-between;align-items:flex-start;gap:17px;">
        <div style="flex:1;">
          <div style="font-size:13px;color:#333;line-height:1.5;">
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
      <div style="flex:1;padding:11px 17px;border-right:${border};font-size:14px;">
        <div style="display:flex;gap:8px;margin-bottom:5px;"><span style="color:#666;min-width:100px;">Client name</span><span style="font-weight:600;">${customer.name || ""}</span></div>
        <div style="display:flex;gap:8px;margin-bottom:5px;"><span style="color:#666;min-width:100px;">Contact No</span><span>${customer.mobile || ""}</span></div>
        <div style="display:flex;gap:8px;margin-bottom:5px;"><span style="color:#666;min-width:100px;">Project Name</span><span style="font-weight:600;">${project.projectName || "—"}</span></div>
        <div style="display:flex;gap:8px;"><span style="color:#666;min-width:100px;">Project No</span><span style="font-weight:600;">${project.projectNo || "—"}</span></div>
      </div>
      <div style="width:170px;min-width:170px;padding:11px 17px;font-size:15px;text-align:left;">
        <div style="color:#666;margin-bottom:5px;font-weight:600;">Date</div>
        <div style="font-weight:600;color:#111;">${formatDate(project.date)}</div>
      </div>
    </div>`;

  const pageFooter = () => `
    <div style="border-top:${border};padding:9px 17px;display:flex;justify-content:space-between;font-size:13px;color:#555;background-color:#fafafa;">
      <span>(+91) 7066 46 6060</span><span>info@esipl.in</span>
    </div>`;

  const summaryRows = items
    .map(
      (item: any, index: number) => `
    <tr>
      <td style="border-bottom:${border};border-right:${border};padding:10px 12px;text-align:center;font-size:14px;">${index + 1}</td>
      <td style="border-bottom:${border};border-right:${border};padding:10px 12px;font-weight:500;font-size:14px;">${item.quotationCode}</td>
      <td style="border-bottom:${border};border-right:${border};padding:10px 12px;text-align:right;font-size:14px;">${formatCurrency(getPriceInclGst(item))}</td>
      <td style="border-bottom:${border};border-right:${border};padding:10px 12px;text-align:center;font-size:14px;">${item.quantity}</td>
      <td style="border-bottom:${border};padding:10px 12px;text-align:right;font-weight:500;font-size:14px;">${formatCurrency(item.totalWithGst)}</td>
    </tr>`,
    )
    .join("");

  const page1 = `
    <div class="pdf-page">
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="border:${border};flex:1;display:flex;flex-direction:column;">
          ${companyHeader()}
          ${clientInfoRow()}
          <div style="border-bottom:${border};padding:10px 17px;text-align:center;font-weight:600;font-size:17px;background-color:#f9f9f9;">Quotation Summary</div>
          <div style="flex:1;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background-color:#f3f4f6;">
                  <th style="border-bottom:${border};border-right:${border};padding:10px 12px;text-align:center;font-weight:600;width:60px;font-size:13.5px;">Sr no</th>
                  <th style="border-bottom:${border};border-right:${border};padding:10px 12px;text-align:left;font-weight:600;font-size:13.5px;">Code</th>
                  <th style="border-bottom:${border};border-right:${border};padding:10px 12px;text-align:right;font-weight:600;font-size:13.5px;">Price <span style="font-weight:400;font-size:12px;color:#666;">(inc. of gst)</span></th>
                  <th style="border-bottom:${border};border-right:${border};padding:10px 12px;text-align:center;font-weight:600;width:70px;font-size:13.5px;">Units</th>
                  <th style="border-bottom:${border};padding:10px 12px;text-align:right;font-weight:600;font-size:13.5px;">Total <span style="font-weight:400;font-size:12px;color:#666;">(incl. of gst)</span></th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
                <tr style="background-color:#f9f9f9;border-bottom:${border};">
                  <td colspan="4" style="border-top:${border};border-right:${border};padding:12px;text-align:center;font-weight:600;font-size:15px;">Grand Total <span style="font-weight:500;font-size:13px;color:#555;">(incl. of gst)</span></td>
                  <td style="border-top:${border};padding:12px;text-align:right;font-weight:600;font-size:15px;">${formatCurrency(project.grandTotalWithGst)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="border-top:${border};display:flex;">
            <div style="flex:1;padding:13px 17px;display:flex;flex-direction:column;justify-content:flex-end;">
              <div style="font-size:13px;color:#666;">Sales Manager</div>
              <div style="font-size:15px;font-weight:600;margin-top:3px;">${salesPersonName}</div>
            </div>
          </div>
          ${pageFooter()}
        </div>
      </div>
    </div>`;

  const productPages = items
    .map((item: any, index: number) => {
      const imageSrc = item.images?.[0] ? resolveImageSrc(item.images[0]) : "";

      const imageHtml = imageSrc
        ? `<div style="width:100%;padding-bottom:56.25%;position:relative;overflow:hidden;"><img src="${imageSrc}" alt="${item.quotationName || ""}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;" /></div>`
        : `<div style="width:100%;padding-bottom:56.25%;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;color:#999;font-size:18px;text-align:center;display:flex;align-items:center;justify-content:center;">No Image Available</div></div>`;

      const selectionBoxes = getSelectionBoxes(item);
      let selectionsGridHtml = "";

      for (let row = 0; row < 4; row++) {
        let rowHtml = "<tr>";
        for (let col = 0; col < 5; col++) {
          const boxIndex = col * 4 + row;
          const boxContent = selectionBoxes[boxIndex] || "";
          const borderRight = col < 4 ? `border-right:${border};` : "";
          const borderBottom = row < 3 ? `border-bottom:${border};` : "";

          rowHtml += `<td style="${borderRight}${borderBottom}padding:10px 11px;font-size:13px;width:20%;height:54px;overflow:hidden;word-wrap:break-word;vertical-align:top;text-align:left;line-height:1.2;">${boxContent}</td>`;
        }
        rowHtml += "</tr>";
        selectionsGridHtml += rowHtml;
      }

      const selectionsTableHtml = `
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr><th colspan="5" style="padding:7px 14px;font-weight:600;font-size:14px;background-color:#f9f9f9;border-bottom:${border};text-align:left;">Selection Details</th></tr>
          </thead>
          <tbody>${selectionsGridHtml}</tbody>
        </table>`;

      let dimensionRows = "";
      const dimensionData: Array<{ label: string; value: string }> = [];

      if (item.quotation?.length)
        dimensionData.push({
          label: "Length (L)",
          value: `${item.quotation.length} mm`,
        });
      if (item.quotation?.width)
        dimensionData.push({
          label: "Width (W)",
          value: `${item.quotation.width} mm`,
        });
      if (item.quotation?.height)
        dimensionData.push({
          label: "Height (H)",
          value: `${item.quotation.height} mm`,
        });

      if (dimensionData.length === 0) {
        dimensionRows = `<tr><td colspan="2" style="padding:7px 14px;color:#777;font-size:13px;">No dimensions available</td></tr>`;
      } else {
        dimensionData.forEach((data, idx) => {
          const borderBottom =
            idx < dimensionData.length - 1
              ? `border-bottom:${border};`
              : "";
          dimensionRows += `<tr><td style="padding:7px 14px;${borderBottom}border-right:${border};color:#555;width:40%;font-weight:500;font-size:13px;line-height:1.3;">${data.label}</td><td style="padding:7px 14px;${borderBottom}font-weight:600;font-size:13px;line-height:1.3;">${data.value}</td></tr>`;
        });
      }

      const emptyRowsNeeded = Math.max(0, 3 - dimensionData.length);
      for (let i = 0; i < emptyRowsNeeded; i++) {
        dimensionRows += `<tr><td colspan="2" style="padding:7px 14px;height:32px;">&nbsp;</td></tr>`;
      }

      let notesContent = "";
      const descData: Array<{ label: string; value: string }> = [];

      if (item.woodName) descData.push({ label: "Wood", value: item.woodName });
      if (item.polishName)
        descData.push({ label: "Polish", value: item.polishName });
      if (item.fabricName)
        descData.push({ label: "Fabric", value: item.fabricName });

      if (descData.length > 0) {
        descData.forEach((data) => {
          notesContent += `<div style="margin-bottom:6px;font-size:13px;"><span style="font-weight:500;color:#555;">${data.label}:</span> <span>${data.value}</span></div>`;
        });
      }

      if (item.specialNote) {
        notesContent += `<div style="margin-top:10px;"><div style="font-weight:600;font-size:13px;color:#333;margin-bottom:4px;">Special Note:</div><div style="font-size:12px;color:#333;line-height:1.5;">${item.specialNote}</div></div>`;
      }

      notesContent += `<div style="margin-top:10px;"><div style="font-size:12px;color:#666;">Sales Manager</div><div style="font-size:14px;font-weight:600;margin-top:2px;">${salesPersonName}</div></div>`;

      const notesHtml = `
        <div style="height:100%;display:flex;flex-direction:column;">
          <div style="padding:14px 14px;font-weight:600;font-size:14px;background-color:#f9f9f9;border-bottom:${border};">General Notes</div>
          <div style="flex:1;padding:10px 14px;">
            ${notesContent || `<div style="font-size:13px;color:#777;">No notes available</div>`}
          </div>
        </div>`;

      const pricingRows = `
      <tr><td colspan="2" style="padding:7px 14px;font-weight:600;font-size:14px;background-color:#f9f9f9;border-bottom:${border};">Cost & GST Details</td></tr>
      <tr><td style="padding:7px 14px;border-bottom:${border};border-right:${border};font-weight:500;font-size:13px;width:45%;line-height:1.3;">Price<br><span style="font-size:10px;color:#666;font-weight:400;">(inc. of gst)</span></td><td style="padding:7px 14px;border-bottom:${border};text-align:right;font-weight:600;font-size:13px;width:55%;line-height:1.3;">${formatCurrency(getPriceInclGst(item))}</td></tr>
      <tr><td style="padding:7px 14px;border-bottom:${border};border-right:${border};font-size:13px;width:45%;line-height:1.3;">Discount <span style="font-size:11px;color:#666;">(${Number(item.discountPercent)}%)</span></td><td style="padding:7px 14px;border-bottom:${border};text-align:right;color:#c00;font-weight:500;font-size:13px;width:55%;line-height:1.3;">-${formatCurrency(getDiscountAmount(item))}</td></tr>
      <tr><td style="padding:7px 14px;border-bottom:${border};border-right:${border};font-size:13px;width:45%;line-height:1.3;">Units</td><td style="padding:7px 14px;border-bottom:${border};text-align:right;font-weight:500;font-size:13px;width:55%;line-height:1.3;">${item.quantity}</td></tr>
      <tr style="background-color:#f9f9f9;"><td style="padding:7px 14px;border-bottom:${border};border-right:${border};font-weight:600;font-size:13px;width:45%;line-height:1.3;">Final Price<br><span style="font-size:10px;color:#555;font-weight:500;">(incl. of gst)</span></td><td style="padding:7px 14px;border-bottom:${border};text-align:right;font-weight:600;font-size:14px;width:55%;line-height:1.3;">${formatCurrency(getTotalInclGst(item))}</td></tr>
      <tr><td style="padding:7px 14px;border-right:${border};font-size:13px;width:45%;line-height:1.3;">Quotation No</td><td style="padding:7px 14px;text-align:right;font-weight:600;font-size:11px;width:55%;line-height:1.3;word-wrap:break-word;overflow-wrap:break-word;">${item.projectQuotationNo || index + 1}</td></tr>
    `;

      return `
    <div class="pdf-page">
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="border:${border};height:100%;display:flex;flex-direction:column;">
          
          ${companyHeader()}
          ${clientInfoRow()}
          
          
          
          <div style="border-bottom:${border};">
            ${selectionsTableHtml}
          </div>

          <div style="display:flex;border-bottom:${border};">
            <div style="flex:1;padding:7px 14px;border-right:${border};font-weight:600;font-size:14px;background-color:#f9f9f9;">${item.quotationName || "-"}</div>
           <div style="width:35%;display:flex;">
            <div style="padding:7px 14px;border-right:${border};font-weight:600;font-size:14px;background-color:#f9f9f9;text-align:left;width:45%;">
              CODE
            </div>
            <div style="padding:7px 14px;font-weight:600;font-size:13px;word-break:break-word;width:55%;">
              ${item.quotationCode || "—"}
            </div>
          </div>
          </div>
          
          <div style="display:flex;border-bottom:${border};">
            <div style="width:65%;border-right:${border};">
              ${imageHtml}
            </div>
            <div style="width:35%;">
              <table style="width:100%;border-collapse:collapse;height:100%;">
                <tbody>${pricingRows}</tbody>
              </table>
            </div>
          </div>
          
          <div style="display:flex;border-bottom:${border};flex:1;">
            <div style="width:50%;border-right:${border};display:flex;flex-direction:column;">
              <table style="width:100%;border-collapse:collapse;height:100%;">
                <tbody>
                  <tr><td colspan="2" style="padding:7px 14px;font-weight:600;font-size:14px;background-color:#f9f9f9;border-bottom:${border};">Dimensions</td></tr>
                  ${dimensionRows}
                </tbody>
              </table>
            </div>
            <div style="width:50%;">
              ${notesHtml}
            </div>
          </div>
          
          <div style="display:flex;">
            <div style="flex:1;padding:11px 17px;border-right:${border};">
              <div style="font-size:13px;color:#666;margin-bottom:3px;">Customer Signature</div>
              <div style="height:32px;border-bottom:1px solid #ddd;margin-top:6px;"></div>
            </div>
            <div style="flex:1;padding:11px 17px;">
              <div style="font-size:13px;color:#666;margin-bottom:3px;">Company Signature</div>
              <div style="height:32px;border-bottom:1px solid #ddd;margin-top:6px;"></div>
            </div>
          </div>
          
          ${pageFooter()}
          
        </div>
      </div>
    </div>`;
    })
    .join("");

  const termsPage = `
    <div class="pdf-page">
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="border:${border};flex:1;display:flex;flex-direction:column;">
          ${companyHeader()}
          <div style="border-bottom:${border};padding:10px 17px;text-align:center;font-weight:600;font-size:17px;background-color:#f9f9f9;">Terms &amp; Conditions</div>
          <div style="flex:1;padding:18px 20px;font-size:13px;line-height:1.65;color:#222;"><ol style="padding-left:18px;margin:0;">${termsAndConditions.map((t) => `<li style="margin-bottom:7px;padding-left:4px;">${t}</li>`).join("")}</ol></div>
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
    .pdf-page { width: 210mm; height: 297mm; padding: 10mm 10mm; margin: 0; overflow: hidden; box-sizing: border-box; page-break-after: always; page-break-inside: avoid; position: relative; }
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
  const { sanitizeSegment, getDateStamp, getUniqueNo } = require("./pdfPrintLog.service");

  // Remove any existing PDF file for this project ID first to avoid duplicates
  deleteProjectPDF(project.id);

  const projectName = sanitizeSegment(project.projectName || "Project");
  const now = new Date(project.date ? `${project.date}T00:00:00` : new Date());
  const dateStamp = getDateStamp(now);
  const uniqueNo = getUniqueNo(new Date(project.createdAt || new Date()));
  const fileName = `esipl_${projectName}_${dateStamp}_${uniqueNo}_${project.id}.pdf`;
  const pdfPath = path.join(PDF_DIR, fileName);

  const html = buildProjectHTML(project);

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
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }
  const files = fs.readdirSync(PDF_DIR);
  const matched = files.find((f) => f.endsWith(`_${projectId}.pdf`));
  if (matched) {
    return path.join(PDF_DIR, matched);
  }
  return path.join(PDF_DIR, `temp_${projectId}.pdf`);
}

export function projectPDFExists(projectId: string): boolean {
  const p = getProjectPDFPath(projectId);
  return fs.existsSync(p) && !p.endsWith(`temp_${projectId}.pdf`);
}

export function deleteProjectPDF(projectId: string): void {
  const p = getProjectPDFPath(projectId);
  if (fs.existsSync(p) && !p.endsWith(`temp_${projectId}.pdf`)) {
    fs.unlinkSync(p);
    logger.info(`PDF deleted → ${p}`);
  }
  const oldPath = path.join(PDF_DIR, `${projectId}.pdf`);
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
    logger.info(`Old style PDF deleted → ${oldPath}`);
  }
}

process.on("exit", () => {
  browserInstance?.close().catch(() => {});
});