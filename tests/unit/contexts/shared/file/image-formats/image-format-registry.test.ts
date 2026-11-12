import { describe, expect, it } from "vitest";

import { ImageFormatRegistry } from "@/src/contexts/shared/file/image-formats/image-format-registry.service";

const buildIsoBmffBuffer = (majorBrand: string, compatibleBrand?: string): Buffer => {
  const buffer = Buffer.alloc(32, 0);
  buffer.write("ftyp", 4, "ascii");
  buffer.write(majorBrand, 8, "ascii");
  if (compatibleBrand) {
    buffer.write(compatibleBrand, 16, "ascii");
  }
  return buffer;
};

describe("ImageFormatRegistry", () => {
  const registry = new ImageFormatRegistry();

  it("resuelve AVIF antes que HEIC cuando comparten contenedor mif1", () => {
    const avifLike = buildIsoBmffBuffer("mif1", "avif");
    const adapter = registry.resolve({ buffer: avifLike });
    expect(adapter.id).toBe("avif");
  });

  it("resuelve HEIC por magic bytes", () => {
    const heic = buildIsoBmffBuffer("heic");
    const adapter = registry.resolve({ buffer: heic });
    expect(adapter.id).toBe("heic-heif");
  });

  it("precedencia AVIF → HEIC en listAdapters", () => {
    const ids = registry.listAdapters().map((adapter) => adapter.id);
    expect(ids.indexOf("avif")).toBeLessThan(ids.indexOf("heic-heif"));
  });

  it("acepta JPEG por magic bytes", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const adapter = registry.resolve({ buffer: jpeg });
    expect(adapter.id).toBe("jpeg-png-webp");
  });
});
