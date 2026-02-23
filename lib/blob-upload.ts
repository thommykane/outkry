import { put } from "@vercel/blob";

/**
 * Upload a buffer to Vercel Blob and return the public URL.
 * Requires BLOB_READ_WRITE_TOKEN (set automatically when you create a Blob store in Vercel).
 */
export async function uploadToBlob(buffer: Buffer, pathname: string): Promise<string> {
  const blob = await put(pathname, buffer, { access: "public" });
  return blob.url;
}

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
