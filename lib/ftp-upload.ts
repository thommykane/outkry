import { Readable } from "stream";
import { Client } from "basic-ftp";

export type FtpConfig = {
  host: string;
  user: string;
  password: string;
  secure?: boolean;
};

/**
 * Upload a buffer to SiteGround (or any FTP) and return the public URL.
 * Requires env: FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR, FTP_PUBLIC_URL.
 * FTP_REMOTE_DIR = e.g. "public_html/uploads" (path on server).
 * FTP_PUBLIC_URL = e.g. "https://outkry.com/uploads" (no trailing slash).
 */
export async function uploadToFtp(
  buffer: Buffer,
  filename: string,
  subdir: string = ""
): Promise<string> {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const remoteDir = process.env.FTP_REMOTE_DIR;
  const publicUrlBase = process.env.FTP_PUBLIC_URL;

  if (!host || !user || !password || !remoteDir || !publicUrlBase) {
    throw new Error("FTP upload: set FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR, FTP_PUBLIC_URL");
  }

  const remotePath = subdir ? `${remoteDir}/${subdir}` : remoteDir;
  const remoteFile = subdir ? `${remotePath}/${filename}` : `${remoteDir}/${filename}`;
  const publicUrl = subdir
    ? `${publicUrlBase.replace(/\/$/, "")}/${subdir}/${filename}`
    : `${publicUrlBase.replace(/\/$/, "")}/${filename}`;

  const client = new Client(60_000);
  client.ftp.verbose = false;

  try {
    await client.access({
      host,
      user,
      password,
      secure: process.env.FTP_SECURE === "true",
    });

    await client.ensureDir(remotePath);
    await client.uploadFrom(Readable.from(buffer), remoteFile);
    return publicUrl;
  } finally {
    client.close();
  }
}

export function isFtpConfigured(): boolean {
  return Boolean(
    process.env.FTP_HOST &&
      process.env.FTP_USER &&
      process.env.FTP_PASSWORD &&
      process.env.FTP_REMOTE_DIR &&
      process.env.FTP_PUBLIC_URL
  );
}
