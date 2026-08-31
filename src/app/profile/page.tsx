import { ProfileForm } from "@/components/profile/ProfileForm";
import { requireAuthenticatedAccount } from "@/lib/auth/require-role";
export default async function ProfilePage() {
  const account = await requireAuthenticatedAccount();
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f6f1] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-[2rem] bg-slate-950 p-7 text-white">
          <span className="grid size-14 place-items-center rounded-2xl bg-orange-500 text-xl font-black text-slate-950">
            {account.displayName.charAt(0).toUpperCase()}
          </span>
          <p className="mt-7 font-mono text-[10px] font-black uppercase tracking-[.2em] text-orange-400">
            Cuenta personal
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            {account.displayName}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {roleLabel(account.role)}
          </p>
          <p className="mt-8 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-400">
            Actualiza tus datos de contacto. Tu rol y correo de acceso se
            mantienen protegidos.
          </p>
        </aside>
        <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,.8)] sm:p-9">
          <p className="font-mono text-[10px] font-black uppercase tracking-[.18em] text-orange-700">
            Mi perfil
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Información de cuenta
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Estos datos se usan para identificarte dentro de PRTracker.
          </p>
          <div className="mt-8">
            <ProfileForm
              birthDate={account.birthDate}
              email={account.email}
              firstName={account.firstName}
              lastName={account.lastName}
              phone={account.phone}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
function roleLabel(role: string) {
  return (
    (
      {
        admin: "Administrador",
        trainer: "Trainer",
        client: "Cliente",
      } as Record<string, string>
    )[role] ?? role
  );
}
