import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Organize sua agenda",
    description:
      "Horários claros para cada barbeiro, respeitando a duração de cada serviço.",
  },
  {
    number: "02",
    title: "Registre cada atendimento",
    description:
      "O histórico do cliente ajuda sua equipe a cuidar de cada detalhe.",
  },
  {
    number: "03",
    title: "Mantenha seus clientes por perto",
    description:
      "Identifique quem está há algum tempo sem voltar e retome o contato.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <Link
          href="/"
          aria-label="BarberFlow — início"
          className="text-xl font-bold tracking-tight"
        >
          Barber<span className="text-emerald-700">Flow</span>
          <span className="ml-1 text-emerald-700">.</span>
        </Link>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          Em desenvolvimento
        </span>
      </header>
      <main id="conteudo" className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <section aria-labelledby="titulo" className="py-14 sm:py-24">
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Seu dia a dia, mais simples
          </p>
          <h1
            id="titulo"
            className="max-w-3xl text-4xl leading-tight font-bold tracking-tight sm:text-6xl"
          >
            Mais tempo para cuidar de quem senta na sua cadeira.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Agenda, atendimentos e clientes em um só lugar. O BarberFlow está
            sendo preparado para facilitar a rotina da sua barbearia.
          </p>
          <a
            href="#como-funciona"
            className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-emerald-800 px-6 py-3 font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          >
            Conheça a proposta{" "}
            <span aria-hidden="true" className="ml-3">
              ↓
            </span>
          </a>
        </section>
        <section
          id="como-funciona"
          aria-labelledby="proposta"
          className="scroll-mt-8"
        >
          <h2 id="proposta" className="mb-6 text-2xl font-bold tracking-tight">
            Uma rotina que flui.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span
                  aria-hidden="true"
                  className="text-sm font-semibold text-emerald-700"
                >
                  {step.number}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-slate-500">
            As funcionalidades serão disponibilizadas por etapas. Agendamentos e
            cadastro ainda não estão disponíveis.
          </p>
        </section>
      </main>
      <footer className="mx-auto max-w-6xl border-t border-slate-200 px-6 py-6 text-sm text-slate-500 sm:px-10">
        BarberFlow · Feito para a rotina da barbearia.
      </footer>
    </div>
  );
}
