import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const settings = await prisma.siteSetting.findUnique({ where: { id: "site-settings" } });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your brand, contact info, navigation, social links, and SEO defaults.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
          <Settings className="h-3.5 w-3.5" />
          v1.0
        </div>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
