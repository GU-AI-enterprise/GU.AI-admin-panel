import nodemailer from "nodemailer";

const baseConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
};

export const transporterNoreply = nodemailer.createTransport({
  ...baseConfig,
  auth: {
    user: process.env.SMTP_NOREPLY_USER,
    pass: process.env.SMTP_NOREPLY_PASS,
  },
});

export const transporterSupport = nodemailer.createTransport({
  ...baseConfig,
  auth: {
    user: process.env.SMTP_SUPPORT_USER,
    pass: process.env.SMTP_SUPPORT_PASS,
  },
});

const FROM_NAME = process.env.MAIL_FROM_NAME ?? "GU.AI";
export const FROM_NOREPLY = `"${FROM_NAME}" <${process.env.SMTP_NOREPLY_USER}>`;
export const FROM_SUPPORT  = `"${FROM_NAME}" <${process.env.SMTP_SUPPORT_USER}>`;
