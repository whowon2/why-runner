import type React from "react";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-4xl px-4 py-16 space-y-4 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-foreground">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">Última atualização: {updatedAt}</p>
      {children}
    </article>
  );
}
