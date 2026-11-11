import { randomUUID } from "node:crypto";
import { mkdir, open, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Asset } from "@/lib/types";
import { isAuthenticated } from "./auth";
import { getDataDirectory, getStorageMode, getSupabaseConfig } from "./config";
import { getPublishedContent } from "./content";
import { ApiError, storageUnavailable } from "./errors";
import { readBody } from "./http";
import { supabaseRequest } from "./supabase";
import { publishedMediaIds } from "./validation";
import { getNetlifyAdapter } from "./netlify";

export const MAX_IMAGE_BYTES = 4_000_000;
const MAX_MULTIPART_BYTES = 4_200_000;
const validId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export async function uploadMedia(request: Request): Promise<Asset> {
  const mode = getStorageMode();
  if (mode === "unconfigured") return storageUnavailable();
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("multipart/form-data;"))
    throw new ApiError(
      415,
      "Choose an image to upload.",
      "INVALID_CONTENT_TYPE",
    );
  const body = await readBody(request, MAX_MULTIPART_BYTES);
  let form: FormData;
  try {
    form = await new Response(body.buffer as ArrayBuffer, {
      headers: { "content-type": type },
    }).formData();
  } catch {
    throw new ApiError(
      400,
      "The image upload could not be read.",
      "INVALID_UPLOAD",
    );
  }
  const file = form.get("file");
  if (!file || typeof file === "string" || !(file instanceof File))
    throw new ApiError(400, "Choose an image file.", "IMAGE_REQUIRED");
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES)
    throw new ApiError(
      413,
      "Choose an image smaller than 4 MB.",
      "IMAGE_TOO_LARGE",
    );
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new ApiError(
      415,
      "Use a JPEG, PNG, or WebP image.",
      "UNSUPPORTED_IMAGE",
    );
  const original = Buffer.from(await file.arrayBuffer());
  let encoded: { data: Buffer; info: sharp.OutputInfo };
  try {
    const pipeline = sharp(original, {
      limitInputPixels: 40_000_000,
      failOn: "error",
    });
    const metadata = await pipeline.metadata();
    if (
      !metadata.format ||
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      (metadata.pages || 1) > 1
    ) {
      throw new Error("Unsupported image format");
    }
    // Re-encoding strips metadata and prevents uploaded active content/polyglots
    // from being served as the original file. Transparent logos remain transparent.
    encoded = await pipeline
      .rotate()
      .resize({
        width: 2_560,
        height: 2_560,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 86, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ApiError(
      415,
      "This file could not be decoded as a safe, still JPEG, PNG, or WebP image.",
      "INVALID_IMAGE",
    );
  }
  const id = randomUUID();
  if (mode === "local") {
    const directory = path.join(getDataDirectory(), "media");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const handle = await open(path.join(directory, id + ".webp"), "wx", 0o600);
    try {
      await handle.writeFile(encoded.data);
      await handle.sync();
    } finally {
      await handle.close();
    }
  } else if (mode === "netlify") {
    await getNetlifyAdapter().saveMedia(
      id,
      new Uint8Array(encoded.data).buffer,
    );
  } else {
    const { bucket } = getSupabaseConfig();
    const bucketResponse = await supabaseRequest(
      "/storage/v1/bucket/" + bucket,
    );
    const bucketDetails = (await bucketResponse.json()) as { public?: boolean };
    if (bucketDetails.public !== false) {
      throw new ApiError(
        503,
        "The image bucket must be private before uploads can be saved.",
        "PRIVATE_STORAGE_REQUIRED",
      );
    }
    await supabaseRequest(
      "/storage/v1/object/" + bucket + "/media/" + id + ".webp",
      {
        method: "POST",
        headers: {
          "content-type": "image/webp",
          "x-upsert": "false",
          "cache-control": "0",
        },
        body: new Uint8Array(encoded.data),
      },
    );
  }
  return {
    id,
    src: "/api/media/" + id,
    label:
      file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[<>\u0000-\u001f]/g, "")
        .slice(0, 200) || "Uploaded image",
    alt: "",
    width: encoded.info.width,
    height: encoded.info.height,
    mime: "image/webp",
  };
}

export async function mediaResponse(
  request: Request,
  id: string,
): Promise<Response> {
  if (!validId.test(id))
    throw new ApiError(404, "Image not found.", "NOT_FOUND");
  const authenticated = await isAuthenticated(request);
  if (!authenticated && !publishedMediaIds(await getPublishedContent()).has(id))
    throw new ApiError(404, "Image not found.", "NOT_FOUND");
  const mode = getStorageMode();
  let image: Uint8Array;
  if (mode === "local") {
    try {
      image = new Uint8Array(
        await readFile(path.join(getDataDirectory(), "media", id + ".webp")),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        throw new ApiError(404, "Image not found.", "NOT_FOUND");
      throw error;
    }
  } else if (mode === "supabase") {
    const { bucket } = getSupabaseConfig();
    const response = await supabaseRequest(
      "/storage/v1/object/authenticated/" + bucket + "/media/" + id + ".webp",
    );
    image = new Uint8Array(await response.arrayBuffer());
  } else if (mode === "netlify") {
    const bytes = await getNetlifyAdapter().readMedia(id);
    if (!bytes) throw new ApiError(404, "Image not found.", "NOT_FOUND");
    image = new Uint8Array(bytes);
  } else {
    return storageUnavailable();
  }
  // No shared caching: unpublishing an image must also revoke public access.
  return new Response(image.buffer as ArrayBuffer, {
    headers: {
      "content-type": "image/webp",
      "content-length": String(image.byteLength),
      "cache-control": "private, no-store",
      vary: "Cookie",
      "x-content-type-options": "nosniff",
      "content-disposition": 'inline; filename="' + id + '.webp"',
    },
  });
}
