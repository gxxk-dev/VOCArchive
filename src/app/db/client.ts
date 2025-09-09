import { drizzle } from 'drizzle-orm/d1';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

// Drizzle client for Cloudflare Workers environment
export function createDrizzleClient(db: D1Database) {
  return drizzle(db, { schema });
}

// For development/testing environment (if needed)
export function createDrizzleClientFromUrl(url: string, authToken?: string) {
  const client = createClient({
    url,
    authToken
  });
  // Type assertion for development environment compatibility
  return drizzle(client as unknown as D1Database, { schema });
}

// Export type for the database client
export type DrizzleDB = ReturnType<typeof createDrizzleClient>;