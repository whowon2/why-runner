import type React from "react";
import { Link } from "@/i18n/navigation";

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

type Section = { heading: string; blocks: Block[] };

const INLINE_PATTERN = /\[\[([^|\]]+)\|([^\]]+)\]\]|\*\*([^*]+)\*\*/g;

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));

    const [, linkLabel, linkHref, boldText] = match;
    if (linkHref !== undefined) {
      parts.push(
        <Link key={key++} href={linkHref}>
          {linkLabel}
        </Link>,
      );
    } else {
      parts.push(<strong key={key++}>{boldText}</strong>);
    }

    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}

export function LegalContent({
  intro,
  sections,
}: {
  intro: string;
  sections: Section[];
}) {
  return (
    <>
      <p>{renderInline(intro)}</p>
      {sections.map((section) => (
        <div key={section.heading}>
          <h2>{section.heading}</h2>
          {section.blocks.map((block, i) =>
            block.type === "ul" ? (
              <ul key={i}>
                {block.items.map((item) => (
                  <li key={item}>{renderInline(item)}</li>
                ))}
              </ul>
            ) : (
              <p key={i}>{renderInline(block.text)}</p>
            ),
          )}
        </div>
      ))}
    </>
  );
}
