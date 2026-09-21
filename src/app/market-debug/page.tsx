import { headers } from "next/headers";

// TEMPORARY diagnostic — shows which market headers the page actually
// receives on the host. Header names only, plus the two market values; never
// cookies or authorization. Removed as soon as the host behaviour is known.
export const dynamic = "force-dynamic";

export default async function MarketDebugPage() {
  const h = await headers();
  const names = [...h.keys()].filter((k) => k !== "cookie" && k !== "authorization").sort();
  return (
    <pre className="whitespace-pre-wrap p-8 text-xs">
      {JSON.stringify(
        {
          "x-market": h.get("x-market"),
          "x-app-path": h.get("x-app-path"),
          "x-matched-path": h.get("x-matched-path"),
          "x-middleware-rewrite": h.get("x-middleware-rewrite"),
          names,
        },
        null,
        2,
      )}
    </pre>
  );
}
