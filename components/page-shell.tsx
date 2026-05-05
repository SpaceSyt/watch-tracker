type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  wide?: boolean;
};

export function PageShell({
  eyebrow = "Watch Tracker",
  title,
  description,
  children,
  wide = false,
}: PageShellProps) {
  return (
    <section className="flex flex-1 items-start">
      <div
        className={`w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10 ${
          wide ? "" : "mx-auto max-w-6xl"
        }`}
      >
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
          {description}
        </p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
