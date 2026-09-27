import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminHomePage() {
  const session = await requireAdmin();
  return (
    <section>
      <p className="section-kicker">Painel</p>
      <h1 className="section-title">Bem-vindo</h1>
      <p className="section-copy">Sessão administrativa ativa para {session.email}.</p>
    </section>
  );
}
