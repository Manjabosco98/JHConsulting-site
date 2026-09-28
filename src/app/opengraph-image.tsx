import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/repositories/public-settings";

/**
 * Default social card. Generated from the institutional settings instead of a
 * committed PNG, so renaming the company or changing the role in /admin also
 * changes the image — no design tool and no redeploy.
 *
 * Pages that have their own image (a project with a cover) override this.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "JHConsulting — tecnologia aplicada a problemas reais";
export const revalidate = 3600;

export default async function OpenGraphImage() {
  const settings = await getSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #060a12 0%, #0b1424 55%, #0a1a30 100%)",
          padding: "72px 80px",
          color: "#e8eefc",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 56, borderRadius: 999, background: "#2563eb", display: "flex" }} />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, display: "flex" }}>
            {settings.companyName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5, display: "flex" }}>
            Tecnologia aplicada a problemas reais
          </div>
          {settings.role ? (
            <div style={{ fontSize: 30, color: "#93a4c4", lineHeight: 1.35, display: "flex" }}>{settings.role}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 25, color: "#7f90b0" }}>
          <div style={{ display: "flex" }}>Automação · Sistemas · APIs · Dados</div>
          {settings.location ? <div style={{ display: "flex" }}>{settings.location}</div> : null}
        </div>
      </div>
    ),
    size
  );
}
