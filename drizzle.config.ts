import type { Config } from 'drizzle-kit';

export default {
  dialect: 'sqlite',
  schema: './src/app/db/schema.ts',
  out: './migrations',
  driver: 'd1-http',
} satisfies Config;