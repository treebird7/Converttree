import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const runFile = promisify(execFile);
const script = path.resolve(__dirname, "../server/conversion_utils.py");
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("conversion pipeline behavior", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "converttree-behavior-"));
  });

  afterAll(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  async function convert(input: string, output: string, inputFormat: string, outputFormat: string) {
    await runFile("python3", [script, input, output, inputFormat, outputFormat]);
    expect(fs.statSync(output).size).toBeGreaterThan(0);
  }

  it("converts text through Markdown, DOCX, and PDF", async () => {
    const txt = path.join(tempDir, "source.txt");
    fs.writeFileSync(txt, "Hello ConvertTree\nA second line");

    const md = path.join(tempDir, "source.md");
    const docx = path.join(tempDir, "source.docx");
    const pdf = path.join(tempDir, "source.pdf");
    await convert(txt, md, "txt", "md");
    await convert(txt, docx, "txt", "docx");
    await convert(txt, pdf, "txt", "pdf");
    expect(fs.readFileSync(md, "utf8")).toContain("Hello ConvertTree");
  });

  it("converts DOCX back to text", async () => {
    const docx = path.join(tempDir, "roundtrip.docx");
    const txt = path.join(tempDir, "roundtrip.txt");
    fs.writeFileSync(path.join(tempDir, "roundtrip-source.txt"), "Round trip content");
    await convert(path.join(tempDir, "roundtrip-source.txt"), docx, "txt", "docx");
    await convert(docx, txt, "docx", "txt");
    expect(fs.readFileSync(txt, "utf8")).toContain("Round trip content");
  });

  it("converts PDF to text, Markdown, DOCX, and a page-image ZIP", async () => {
    const source = path.join(tempDir, "pages.txt");
    const pdf = path.join(tempDir, "pages.pdf");
    fs.writeFileSync(source, "PDF page content");
    await convert(source, pdf, "txt", "pdf");

    const txt = path.join(tempDir, "pages-out.txt");
    const md = path.join(tempDir, "pages-out.md");
    const docx = path.join(tempDir, "pages-out.docx");
    const zip = path.join(tempDir, "pages-out.zip");
    await convert(pdf, txt, "pdf", "txt");
    await convert(pdf, md, "pdf", "md");
    await convert(pdf, docx, "pdf", "docx");
    await convert(pdf, zip, "pdf", "zip");
    expect(fs.readFileSync(txt, "utf8")).toContain("PDF page content");
    expect(fs.readFileSync(md, "utf8")).toContain("Page 1");
    expect(fs.readFileSync(zip).subarray(0, 2).toString()).toBe("PK");
  });

  it("converts an image to PDF", async () => {
    const png = path.join(tempDir, "pixel.png");
    const pdf = path.join(tempDir, "pixel.pdf");
    fs.writeFileSync(png, onePixelPng);
    await convert(png, pdf, "png", "pdf");
    expect(fs.readFileSync(pdf).subarray(0, 4).toString()).toBe("%PDF");
  });
});
