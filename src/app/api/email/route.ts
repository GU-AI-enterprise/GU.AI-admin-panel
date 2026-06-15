import { NextRequest, NextResponse } from "next/server";
import { transporterNoreply, transporterSupport, FROM_NOREPLY, FROM_SUPPORT } from "@/lib/mailer";

const DEFAULT_TO = "dathtse196321@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const to: string = body.to?.trim() || DEFAULT_TO;
    const subject: string = body.subject?.trim() || "(Không có tiêu đề)";
    const html: string = body.html || `<p>${body.text ?? ""}</p>`;
    const sender: "noreply" | "support" = body.sender === "support" ? "support" : "noreply";

    const transporter = sender === "support" ? transporterSupport : transporterNoreply;
    const from = sender === "support" ? FROM_SUPPORT : FROM_NOREPLY;

    await transporter.sendMail({ from, to, subject, html });

    return NextResponse.json({ success: true, to, subject, from });
  } catch (err: any) {
    console.error("[mailer]", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Lỗi không xác định" },
      { status: 500 }
    );
  }
}
