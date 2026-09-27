import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminSettings } from "@/lib/repositories/settings";
import { publicImageUrl } from "@/lib/storage/images";
import { formatDateTime } from "@/lib/admin/labels";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingsForm, type SettingsFormValues } from "@/components/admin/settings/SettingsForm";
import { ProfilePhotoForm } from "@/components/admin/settings/ProfilePhotoForm";
import { saveSettingsAction, updateProfilePhotoAction } from "./actions";
import { settingsTextFields } from "@/lib/validation/settings";

export const metadata: Metadata = { title: "Configurações" };

const labels: Partial<Record<(typeof settingsTextFields)[number], string>> = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  linkedin_url: "LinkedIn",
  github_url: "GitHub",
  instagram_url: "Instagram"
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getAdminSettings(await createClient());

  // Missing row: the form starts empty and the first save creates it.
  const values = Object.fromEntries(
    settingsTextFields.map((field) => [field, settings?.[field] ?? ""])
  ) as SettingsFormValues;

  const pending = (["email", "whatsapp", "linkedin_url", "github_url"] as const)
    .filter((field) => !values[field])
    .map((field) => labels[field]);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Configurações"
        description={settings?.updated_at ? `Informações institucionais, contato público e redes sociais. Atualizado em ${formatDateTime(settings.updated_at)}.` : "Informações institucionais, contato público e redes sociais."}
      />

      {pending.length ? (
        <p role="status" className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>Campos públicos ainda sem preenchimento: {pending.join(", ")}. Enquanto estiverem vazios, esses links não aparecem no site.</span>
        </p>
      ) : null}

      <ProfilePhotoForm
        action={updateProfilePhotoAction}
        currentUrl={publicImageUrl(settings?.profile_image)}
        professionalName={values.professional_name || "profissional"}
      />

      <SettingsForm action={saveSettingsAction} initialValues={values} />
    </div>
  );
}
