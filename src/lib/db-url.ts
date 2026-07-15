// Prisma's connection string convention includes query params (like
// ?schema=public) that libpq command-line tools (pg_dump/pg_restore/psql)
// don't recognize and reject outright ("invalid URI query parameter").
// This strips those down to a URL those tools accept, returning the schema
// name separately so callers can pass it via --schema instead.
export function getPgToolsConnection(): { url: string; schema: string } {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");

  const url = new URL(raw);
  const schema = url.searchParams.get("schema") ?? "public";

  const LIBPQ_RECOGNIZED_PARAMS = new Set(["sslmode", "connect_timeout", "application_name"]);
  for (const key of [...url.searchParams.keys()]) {
    if (!LIBPQ_RECOGNIZED_PARAMS.has(key)) {
      url.searchParams.delete(key);
    }
  }

  return { url: url.toString(), schema };
}
