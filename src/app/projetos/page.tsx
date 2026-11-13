import { permanentRedirect } from "next/navigation";

/** Legacy portfolio URLs now lead to the corporate services. No project data is loaded. */
export default function LegacyProjectsPage() {
  permanentRedirect("/#servicos");
}
