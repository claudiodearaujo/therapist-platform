import { readFileSync } from 'node:fs';
import path from 'node:path';
/** Supabase SQL connections must verify both encryption and the provider CA. */
export function postgresConnectionOptions(connectionString: string) {
  const url = new URL(connectionString);
  if (!url.hostname.endsWith('.supabase.com') && !url.hostname.endsWith('.supabase.co')) return { connectionString };
  // pg's URI parser otherwise overrides the explicit SSL object with weaker sslmode options.
  for (const key of ['sslmode','sslcert','sslkey','sslrootcert','sslaccept']) url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ca: readFileSync(path.resolve(__dirname, '../../supabase-ca.crt'), 'utf8') },
  };
}
