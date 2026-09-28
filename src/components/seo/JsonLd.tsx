/**
 * Structured data block. The `<` escaping matters because every string here can
 * come from text edited in /admin: without it, a value containing "</script>"
 * would break out of the tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
