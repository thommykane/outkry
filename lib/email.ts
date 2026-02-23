import nodemailer from "nodemailer";

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      })
    : null;

export async function sendNewPostNotification(params: {
  to: string;
  categoryName: string;
  postTitle: string;
  postUrl: string;
}) {
  if (!transporter) return;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const baseUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@outkry.com",
    to: params.to,
    subject: `New post in ${params.categoryName}: ${params.postTitle}`,
    text: `A new post was created in ${params.categoryName}.\n\n"${params.postTitle}"\n\nView it here: ${params.postUrl}`,
    html: `<p>A new post was created in <strong>${params.categoryName}</strong>.</p><p>"${params.postTitle}"</p><p><a href="${params.postUrl}">View post</a></p>`,
  });
}
