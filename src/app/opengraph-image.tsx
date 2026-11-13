import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/repositories/public-settings";

/**
 * Corporate social card. Personal roles and portraits do not appear here.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "JHConsulting: automação e dados para uma gestão mais eficiente";
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
          background: "linear-gradient(135deg, #04090F 0%, #09111A 55%, #1B406A 100%)",
          padding: "72px 80px",
          color: "#F5F7F9",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 56, borderRadius: 999, background: "#4488CA", display: "flex" }} />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, display: "flex" }}>
            {settings.companyName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5, display: "flex" }}>
            Automação e dados para uma gestão mais eficiente.
          </div>
          <div style={{ fontSize: 30, color: "#C3C8CD", lineHeight: 1.35, display: "flex" }}>Soluções sob medida para empresas</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 25, color: "#C3C8CD" }}>
          {/* Três pontos médios numa linha só viravam ruído; vírgula separa
            * igual e lê melhor em miniatura de rede social. */}
          <div style={{ display: "flex" }}>Automação, sistemas, APIs e dados</div>
          {settings.location ? <div style={{ display: "flex" }}>{settings.location}</div> : null}
        </div>
      </div>
    ),
    size
  );
}
