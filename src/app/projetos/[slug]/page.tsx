import { permanentRedirect } from "next/navigation";

/** Preserve old inbound links without keeping a public portfolio. */
export default function LegacyProjectPage() {
  permanentRedirect("/#servicos");
}
