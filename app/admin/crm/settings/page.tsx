import { CrmSettingsClient } from "./client";

export default async function CrmSettingsPage() {
  const smtpUser = process.env.SMTP_USER || "";
  const [localPart, domain] = smtpUser.split("@");
  const maskedAccount = smtpUser
    ? `${localPart.slice(0, 2)}${"*".repeat(Math.max(2, localPart.length - 2))}@${domain}`
    : "Not configured";
  const emailConfig = {
    smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    imapConfigured: Boolean(
      (process.env.IMAP_HOST || process.env.SMTP_HOST) &&
      (process.env.IMAP_USER || process.env.SMTP_USER) &&
      (process.env.IMAP_PASS || process.env.SMTP_PASS)
    ),
    account: maskedAccount,
    fetchDays: Number(process.env.IMAP_FETCH_DAYS) || 7,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CRM Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Data management, import/export, and compliance</p>
      </div>

      <CrmSettingsClient emailConfig={emailConfig} />
    </div>
  );
}
