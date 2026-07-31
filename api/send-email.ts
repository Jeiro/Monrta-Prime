import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

type Detail = { label: string; value: string | number | undefined | null };

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");


const getHeaderValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

const normalizeOrigin = (value: string | undefined) => {
  if (!value) return "";
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
};

const isAllowedOrigin = (req: VercelRequest) => {
  const origin = normalizeOrigin(getHeaderValue(req.headers.origin));
  if (!origin) return true;

  const host = getHeaderValue(req.headers["x-forwarded-host"]) || getHeaderValue(req.headers.host);
  const protocol = getHeaderValue(req.headers["x-forwarded-proto"]) || "https";
  const sameHostOrigin = host ? normalizeOrigin(`${protocol}://${host}`) : "";
  const configuredOrigins = String(process.env.MONETA_PRIME_ALLOWED_ORIGINS || "")
    .split(",")
    .map(item => normalizeOrigin(item))
    .filter(Boolean);

  return origin === sameHostOrigin || configuredOrigins.includes(origin);
};

const isValidEmail = (value: unknown) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isReasonableMetadata = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}).length <= 12000;
  } catch {
    return false;
  }
};
const formatMoney = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return String(value || "$0.00");
};

const buildDetails = (details: Detail[]) => details
  .filter(detail => detail.value !== undefined && detail.value !== null && detail.value !== "")
  .map(detail => `
    <tr>
      <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">${escapeHtml(detail.label)}</td>
      <td style="padding: 8px 0; color: #f8fafc; text-align: right; font-weight: 700; word-break: break-word;">${escapeHtml(detail.value)}</td>
    </tr>
  `).join("");

const resolveEvent = (eventType: string, metadata: any) => {
  const amount = metadata.amount ?? metadata.allocation ?? metadata.payoutAmount;
  const commonDetails: Detail[] = [
    { label: "Reference", value: metadata.reference || metadata.transactionId || metadata.claimId || metadata.eventId },
    { label: "Status", value: metadata.status },
    { label: "Date", value: metadata.date || new Date().toUTCString() }
  ];

  switch (eventType) {
    case "WELCOME":
      return {
        subject: `Welcome to ${metadata.companyName}`,
        heading: "Welcome to your trading workspace",
        intro: "Your account has been created successfully. You can now access your dashboard, wallet, investment plans, copy trading, and verification tools.",
        accent: "#10b981",
        details: [
          { label: "Account", value: metadata.email },
          { label: "Profile", value: metadata.name }
        ]
      };
    case "EMAIL_VERIFICATION":
      return {
        subject: `Verify your ${metadata.companyName} email`,
        heading: "Verify your email address",
        intro: "Please complete email verification to help keep your account secure.",
        accent: "#3b82f6",
        details: [
          { label: "Account", value: metadata.email },
          { label: "Verification Link", value: metadata.verificationLink }
        ]
      };
    case "SECURITY_ALERT":
      return {
        subject: `[Security Alert] New login detected - ${metadata.companyName}`,
        heading: "New login notification",
        intro: "A sign-in event was detected for your account. If this was not you, reset your password and contact support immediately.",
        accent: "#ef4444",
        details: [
          { label: "Time", value: metadata.time || new Date().toUTCString() },
          { label: "IP Address", value: metadata.ip || "Unknown" },
          { label: "Location", value: metadata.location || "Unknown" },
          { label: "Device", value: metadata.device || "Web session" }
        ]
      };
    case "DEPOSIT_SUBMITTED":
      return {
        subject: `Deposit submitted - ${metadata.companyName}`,
        heading: "Deposit submitted for review",
        intro: "We received your deposit submission. Treasury review will verify the payment details before crediting your balance.",
        accent: "#38bdf8",
        details: [
          { label: "Amount", value: formatMoney(amount) },
          { label: "Asset / Network", value: metadata.asset },
          { label: "Transaction Hash", value: metadata.txHash },
          ...commonDetails
        ]
      };
    case "DEPOSIT_SUCCESS":
    case "DEPOSIT_APPROVED":
      return {
        subject: `Deposit approved - ${metadata.companyName}`,
        heading: "Deposit credited",
        intro: "Your deposit has been approved and credited to your wallet balance.",
        accent: "#10b981",
        details: [
          { label: "Amount", value: formatMoney(amount) },
          { label: "Asset / Network", value: metadata.asset },
          { label: "Transaction Hash", value: metadata.txHash },
          ...commonDetails
        ]
      };
    case "DEPOSIT_REJECTED":
      return {
        subject: `Deposit rejected - ${metadata.companyName}`,
        heading: "Deposit could not be verified",
        intro: "Your deposit submission was reviewed but could not be verified. Please review the note below or contact support.",
        accent: "#ef4444",
        details: [
          { label: "Amount", value: formatMoney(amount) },
          { label: "Asset / Network", value: metadata.asset },
          { label: "Reason", value: metadata.reason || metadata.notes },
          ...commonDetails
        ]
      };
    case "WITHDRAWAL_SUBMITTED":
      return {
        subject: `Withdrawal submitted - ${metadata.companyName}`,
        heading: "Withdrawal request received",
        intro: "Your withdrawal request has been queued for review and security checks.",
        accent: "#38bdf8",
        details: [
          { label: "Amount", value: formatMoney(amount) },
          { label: "Asset", value: metadata.asset },
          { label: "Destination", value: metadata.walletAddress || metadata.destination },
          ...commonDetails
        ]
      };
    case "WITHDRAWAL_SUCCESS":
    case "WITHDRAWAL_APPROVED":
      return {
        subject: `Withdrawal approved - ${metadata.companyName}`,
        heading: "Withdrawal processed",
        intro: "Your withdrawal has been approved and marked as dispatched.",
        accent: "#3b82f6",
        details: [
          { label: "Amount", value: formatMoney(amount) },
          { label: "Asset", value: metadata.asset },
          { label: "Destination", value: metadata.walletAddress || metadata.destination },
          ...commonDetails
        ]
      };
    case "WITHDRAWAL_REJECTED":
      return {
        subject: `Withdrawal rejected - ${metadata.companyName}`,
        heading: "Withdrawal declined",
        intro: "Your withdrawal request was declined after review. Any reserved funds have been returned where applicable.",
        accent: "#ef4444",
        details: [
          { label: "Amount", value: formatMoney(amount) },
          { label: "Asset", value: metadata.asset },
          { label: "Reason", value: metadata.reason || metadata.notes },
          ...commonDetails
        ]
      };
    case "INVESTMENT_STARTED":
      return {
        subject: `Investment purchase confirmed - ${metadata.companyName}`,
        heading: "Investment started",
        intro: "Your investment allocation has been activated and is now tracking toward maturity.",
        accent: "#f59e0b",
        details: [
          { label: "Plan", value: metadata.planName || metadata.investmentName },
          { label: "Amount", value: formatMoney(amount) },
          { label: "Expected Return", value: formatMoney(metadata.totalReturn) },
          { label: "Maturity", value: metadata.endDate },
          ...commonDetails
        ]
      };
    case "PROFIT_DISTRIBUTION":
    case "INVESTMENT_COMPLETED":
      return {
        subject: `Investment payout credited - ${metadata.companyName}`,
        heading: "Investment matured",
        intro: "Your completed investment payout has been credited to your wallet balance.",
        accent: "#10b981",
        details: [
          { label: "Investment", value: metadata.planName || metadata.investmentName || metadata.source },
          { label: "Payout", value: formatMoney(metadata.payoutAmount || metadata.profit || amount) },
          { label: "Profit", value: metadata.profit ? formatMoney(metadata.profit) : undefined },
          ...commonDetails
        ]
      };
    case "COPY_TRADE_ACTIVE":
    case "COPY_TRADE_STARTED":
      return {
        subject: `Copy trade started - ${metadata.companyName}`,
        heading: "Copy trade activated",
        intro: "Your portfolio is now following the selected trader according to your allocation.",
        accent: "#a855f7",
        details: [
          { label: "Trader", value: metadata.traderName },
          { label: "Allocation", value: formatMoney(amount) },
          { label: "Expected Return", value: formatMoney(metadata.totalReturn) },
          ...commonDetails
        ]
      };
    case "COPY_TRADE_COMPLETED":
      return {
        subject: `Copy trade completed - ${metadata.companyName}`,
        heading: "Copy trade settlement credited",
        intro: "Your copy trade has completed and the settlement has been credited to your wallet balance.",
        accent: "#10b981",
        details: [
          { label: "Trader", value: metadata.traderName },
          { label: "Payout", value: formatMoney(metadata.payoutAmount || amount) },
          { label: "Profit", value: metadata.profit ? formatMoney(metadata.profit) : undefined },
          ...commonDetails
        ]
      };
    case "COPY_TRADE_CANCELLED":
      return {
        subject: `Copy trade cancelled - ${metadata.companyName}`,
        heading: "Copy trade cancelled",
        intro: "Your copy trade has been cancelled and any reserved allocation has been returned to your wallet balance.",
        accent: "#f59e0b",
        details: [
          { label: "Trader", value: metadata.traderName },
          { label: "Returned", value: formatMoney(metadata.refundAmount ?? amount) },
          ...commonDetails
        ]
      };
    case "SUPPORT_TICKET_CREATED":
      return {
        subject: `Support ticket received - ${metadata.companyName}`,
        heading: "We've received your ticket",
        intro: "Thanks for reaching out. Your support ticket has been created and our team will review it shortly. You'll be notified when we reply.",
        accent: "#38bdf8",
        details: [
          { label: "Subject", value: metadata.subject },
          { label: "Category", value: metadata.category },
          ...commonDetails
        ]
      };
    case "SUPPORT_TICKET_REPLY":
      return {
        subject: `New reply on your support ticket - ${metadata.companyName}`,
        heading: "There's a new reply on your ticket",
        intro: metadata.replyPreview
          ? `A new reply has been posted to your support ticket: "${metadata.replyPreview}"`
          : "A new reply has been posted to your support ticket. Open your dashboard to view the full conversation.",
        accent: "#3b82f6",
        details: [
          { label: "Subject", value: metadata.subject },
          ...commonDetails
        ]
      };
    case "KYC_SUBMITTED":
      return {
        subject: `KYC submitted - ${metadata.companyName}`,
        heading: "Verification submitted",
        intro: "Your KYC documents have been received and are being reviewed.",
        accent: "#38bdf8",
        details: [
          { label: "Document Type", value: metadata.documentType || metadata.idType },
          ...commonDetails
        ]
      };
    case "KYC_APPROVED":
      return {
        subject: `KYC approved - ${metadata.companyName}`,
        heading: "Verification approved",
        intro: "Your identity verification has been approved. Eligible account features are now available.",
        accent: "#10b981",
        details: commonDetails
      };
    case "KYC_REJECTED":
      return {
        subject: `KYC rejected - ${metadata.companyName}`,
        heading: "Verification needs attention",
        intro: "Your KYC submission was reviewed but could not be approved. Please review the reason and resubmit when ready.",
        accent: "#ef4444",
        details: [
          { label: "Reason", value: metadata.reason || metadata.notes },
          ...commonDetails
        ]
      };
    case "AIRDROP_CLAIM_SUBMITTED":
      return {
        subject: `Airdrop claim submitted - ${metadata.companyName}`,
        heading: "Airdrop claim received",
        intro: "Your airdrop claim has been submitted and is awaiting review.",
        accent: "#38bdf8",
        details: [
          { label: "Campaign", value: metadata.campaignTitle },
          { label: "Token", value: metadata.token },
          { label: "Reward", value: metadata.rewardAmount },
          ...commonDetails
        ]
      };
    case "AIRDROP_CLAIM_APPROVED":
      return {
        subject: `Airdrop claim approved - ${metadata.companyName}`,
        heading: "Airdrop reward credited",
        intro: "Your airdrop claim was approved and the reward has been credited.",
        accent: "#10b981",
        details: [
          { label: "Campaign", value: metadata.campaignTitle },
          { label: "Token", value: metadata.token },
          { label: "Reward", value: metadata.rewardAmount },
          ...commonDetails
        ]
      };
    case "AIRDROP_CLAIM_REJECTED":
      return {
        subject: `Airdrop claim rejected - ${metadata.companyName}`,
        heading: "Airdrop claim rejected",
        intro: "Your airdrop claim was reviewed but could not be approved.",
        accent: "#ef4444",
        details: [
          { label: "Campaign", value: metadata.campaignTitle },
          { label: "Token", value: metadata.token },
          { label: "Reason", value: metadata.reason || metadata.notes },
          ...commonDetails
        ]
      };
    case "ANNOUNCEMENT":
      return {
        subject: `${metadata.title || "Platform announcement"} - ${metadata.companyName}`,
        heading: metadata.title || "Platform announcement",
        intro: metadata.content || "A new platform announcement is available in your dashboard.",
        accent: metadata.priority === "Critical" ? "#ef4444" : "#f59e0b",
        details: [
          { label: "Priority", value: metadata.priority },
          { label: "Published", value: metadata.date || new Date().toUTCString() }
        ]
      };
    case "TOPUP_SUCCESS":
      return {
        subject: `Investment top-up confirmed - ${metadata.companyName}`,
        heading: "Top-up successful",
        intro: "Your active investment allocation has been increased.",
        accent: "#10b981",
        details: [
          { label: "Investment", value: metadata.investmentName },
          { label: "Top-up Amount", value: formatMoney(amount) },
          ...commonDetails
        ]
      };
    default:
      throw new Error(`Unknown eventType: ${eventType}`);
  }
};

function buildEmail(eventType: string, metadata: any = {}): { subject: string; html: string } {
  const companyName = metadata.companyName || process.env.MONETA_PRIME_COMPANY_NAME || "Moneta Prime";
  const supportEmail = metadata.supportEmail || process.env.MONETA_PRIME_SUPPORT_EMAIL || "support@PLACEHOLDER-DOMAIN.example";
  const senderName = metadata.senderName || companyName;
  const logoUrl = metadata.logoUrl || process.env.MONETA_PRIME_LOGO_URL || "";
  const greetingName = metadata.name || metadata.userName || "Trader";
  const event = resolveEvent(eventType, { ...metadata, companyName, supportEmail, senderName });
  const detailRows = buildDetails(event.details || []);
  const logoMarkup = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(companyName)}" style="max-width: 180px; height: auto; display: inline-block;" />`
    : `<div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: lowercase;">orbit<span style="color: #F7931A;">rio</span></div>`;

  return {
    subject: event.subject,
    html: `
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; background-color: #030509; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #030509; padding: 40px 18px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 620px; overflow: hidden; background-color: #0b101a; border: 1px solid #1a2233; border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.35);">
                  <tr><td style="padding: 34px 40px 18px; text-align: center;">${logoMarkup}</td></tr>
                  <tr>
                    <td style="padding: 8px 40px 34px;">
                      <p style="margin: 0 0 10px; color: ${event.accent}; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(companyName)}</p>
                      <h1 style="margin: 0 0 18px; color: #f8fafc; font-size: 24px; line-height: 1.25; font-weight: 800;">${escapeHtml(event.heading)}</h1>
                      <p style="margin: 0 0 18px; color: #cbd5e1; font-size: 15px; line-height: 24px;">Hello ${escapeHtml(greetingName)},</p>
                      <p style="margin: 0 0 26px; color: #94a3b8; font-size: 15px; line-height: 24px;">${escapeHtml(event.intro)}</p>
                      ${detailRows ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px 18px; font-size: 13px;">${detailRows}</table>` : ""}
                      <p style="margin: 26px 0 0; color: #94a3b8; font-size: 13px; line-height: 21px;">Need help? Contact support at <a href="mailto:${escapeHtml(supportEmail)}" style="color: #F7931A; text-decoration: none;">${escapeHtml(supportEmail)}</a>.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 22px 40px 34px; border-top: 1px solid #1a2233; color: #64748b; font-size: 12px; line-height: 18px; text-align: center;">
                      &copy; ${new Date().getFullYear()} ${escapeHtml(companyName)}. This message was sent by ${escapeHtml(senderName)}.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ success: false, error: "Origin not allowed" });
  }

  try {
    const { to, eventType, metadata = {} } = req.body;

    if (!isValidEmail(to)) {
      return res.status(400).json({ success: false, error: "A valid recipient email is required." });
    }
    if (!isReasonableMetadata(metadata)) {
      return res.status(400).json({ success: false, error: "Metadata payload is too large or invalid." });
    }
    if (!eventType) {
      return res.status(400).json({ success: false, error: "Missing required field: eventType" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Email send aborted: RESEND_API_KEY is not configured.");
      return res.status(500).json({ success: false, error: "RESEND_API_KEY is not configured in environment variables." });
    }

    // No silent fallback to onboarding@resend.dev — that address only delivers
    // to the Resend account owner, so real-user sends would fail while the old
    // code reported success. A missing sender is a hard config error.
    const sender = process.env.RESEND_FROM_EMAIL;
    if (!sender) {
      console.error("Email send aborted: RESEND_FROM_EMAIL is not configured. Refusing to fall back to onboarding@resend.dev (cannot deliver to real recipients).");
      return res.status(500).json({ success: false, error: "RESEND_FROM_EMAIL is not configured. Set it to a verified sender address." });
    }

    const resend = new Resend(apiKey);
    const replyTo = metadata.replyToEmail || metadata.supportEmail || undefined;
    const { subject, html } = buildEmail(eventType, metadata);

    // resend.emails.send resolves with { data, error } and does NOT throw on
    // API-level rejections (unverified domain/sender, rate limits, etc.).
    // Surface that error instead of blindly returning success.
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: sender,
      to: [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {})
    });

    if (emailError) {
      console.error(`Resend rejected ${eventType} email to ${to}:`, emailError);
      return res.status(502).json({ success: false, error: (emailError as any).message || String(emailError) });
    }

    return res.status(200).json({
      success: true,
      message: `Transactional email for ${eventType} dispatched successfully.`,
      data: emailData,
    });
  } catch (error: any) {
    console.error("Resend transactional email delivery failed:", error);
    return res.status(500).json({ success: false, error: error.message || String(error) });
  }
}

