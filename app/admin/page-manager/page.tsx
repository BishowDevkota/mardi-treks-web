import { prisma } from "@/lib/prisma";
import { PageManagerForm } from "./page-manager-form";

export default async function PageManagerPage() {
  const settings = await prisma.siteSetting.findUnique({
    where: { id: "site-settings" },
    select: { pageContent: true },
  });

  let pageContent: any = {};
  if (settings?.pageContent) {
    try { pageContent = JSON.parse(settings.pageContent); } catch {}
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Page Manager</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage content for About Us, Contact, Blog pages, and Footer.
        </p>
      </div>
      <PageManagerForm pageContent={pageContent} />
    </div>
  );
}
