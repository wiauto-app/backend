import { readFileSync } from "fs";
import * as path from "path";
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import * as nunjucks from "nunjucks";
import * as puppeteer from "puppeteer";

import type { OwnerDashboard } from "@/src/contexts/vehicles/types/owner-dashboard";

import { buildDashboardPdfView } from "./dashboard-pdf.view-model";
import { PdfExportConfig, PdfRenderError, PdfTimeoutError } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_CONCURRENT_RENDERS = 2;
const DEFAULT_MARGIN_MM = { top: 12, right: 12, bottom: 16, left: 12 };

const LATIN_RANGE =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT_RANGE =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

const INTER_FACES = [
  ...[400, 500, 600, 700].map((weight) => ({ weight, subset: "latin", range: LATIN_RANGE })),
  ...[400, 600, 700].map((weight) => ({ weight, subset: "latin-ext", range: LATIN_EXT_RANGE })),
];

const FOOTER_TEMPLATE = (margin: { left: number; right: number }) => `
  <div style="width:100%;padding:0 ${margin.right}mm 0 ${margin.left}mm;font-family:Helvetica,Arial,sans-serif;font-size:8px;color:#9ca3af;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact;">
    <span>WiAuto · Resumen y analytics</span>
    <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
  </div>`;

@Injectable()
export class PdfExportService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfExportService.name);
  private readonly templates = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(path.join(__dirname, "templates")),
    { autoescape: true },
  );
  private readonly fontCss = this.loadFontCss();
  private readonly logoSrc = this.loadLogoSrc();

  private browserPromise: Promise<puppeteer.Browser> | null = null;
  private activeRenders = 0;
  private readonly waiters: Array<() => void> = [];

  async generateDashboardPdf(
    data: OwnerDashboard,
    config: PdfExportConfig = {},
  ): Promise<Buffer> {
    const timeoutMs = config.timeout ?? DEFAULT_TIMEOUT_MS;
    const job = { cancelled: false };
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        job.cancelled = true;
        reject(new PdfTimeoutError(`PDF generation exceeded ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([this.renderWhenSlotIsFree(data, config, job), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  async onModuleDestroy(): Promise<void> {
    const browser = await this.browserPromise?.catch(() => null);
    this.browserPromise = null;

    if (browser) {
      await browser.close();
      this.logger.log("Puppeteer browser closed");
    }
  }

  private async renderWhenSlotIsFree(
    data: OwnerDashboard,
    config: PdfExportConfig,
    job: { cancelled: boolean },
  ): Promise<Buffer> {
    await this.acquireSlot();

    try {
      if (job.cancelled) {
        throw new PdfTimeoutError("PDF generation cancelled after timeout");
      }

      return await this.render(data, config);
    } finally {
      this.releaseSlot();
    }
  }

  private async acquireSlot(): Promise<void> {
    if (this.activeRenders < MAX_CONCURRENT_RENDERS) {
      this.activeRenders += 1;
      return;
    }

    await new Promise<void>((resolve) => this.waiters.push(resolve));
  }

  private releaseSlot(): void {
    const next = this.waiters.shift();

    if (next) {
      next();
      return;
    }

    this.activeRenders -= 1;
  }

  private async render(data: OwnerDashboard, config: PdfExportConfig): Promise<Buffer> {
    const html = this.renderHtml(data);
    const margin = config.margin ?? DEFAULT_MARGIN_MM;

    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      try {
        await page.setContent(html, { waitUntil: "load" });
        await page.evaluate("document.fonts.ready");

        const pdf = await page.pdf({
          format: config.format ?? "A4",
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: "<div></div>",
          footerTemplate: FOOTER_TEMPLATE(margin),
          margin: {
            top: `${margin.top}mm`,
            right: `${margin.right}mm`,
            bottom: `${margin.bottom}mm`,
            left: `${margin.left}mm`,
          },
        });

        return Buffer.from(pdf);
      } finally {
        await page.close().catch(() => undefined);
      }
    } catch (error) {
      this.logger.error("PDF generation failed", error);
      throw new PdfRenderError(`Failed to generate PDF: ${error}`);
    }
  }

  private renderHtml(data: OwnerDashboard): string {
    try {
      return this.templates.render("dashboard.html", {
        view: buildDashboardPdfView(data, new Date()),
        font_css: this.fontCss,
        logo_src: this.logoSrc,
      });
    } catch (error) {
      this.logger.error("Template rendering failed", error);
      throw new PdfRenderError(`Failed to render template: ${error}`);
    }
  }

  private getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer
        .launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        })
        .then((browser) => {
          browser.on("disconnected", () => {
            this.browserPromise = null;
          });

          return browser;
        })
        .catch((error) => {
          this.browserPromise = null;
          throw error;
        });
    }

    return this.browserPromise;
  }

  private loadFontCss(): string {
    try {
      return INTER_FACES.map(({ weight, subset, range }) => {
        const file = require.resolve(`@fontsource/inter/files/inter-${subset}-${weight}-normal.woff2`);
        const base64 = readFileSync(file).toString("base64");

        return `@font-face{font-family:"Inter";font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${base64}) format("woff2");unicode-range:${range};}`;
      }).join("\n");
    } catch (error) {
      this.logger.warn(`No se pudo cargar la fuente Inter, se usará Helvetica: ${error}`);
      return "";
    }
  }

  private loadLogoSrc(): string {
    const svg = readFileSync(path.join(__dirname, "templates", "logo-white.svg"));

    return `data:image/svg+xml;base64,${svg.toString("base64")}`;
  }
}
