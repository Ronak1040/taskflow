import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/taskflow'),
  USE_IN_MEMORY_DB: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('taskflow_default_development_secret_key_32chars!'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('taskflow_cookie_signing_secret_min32chars!'),
  TOKEN_NAME: z.string().default('taskflow_token'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
export type EnvConfig = z.infer<typeof envSchema>;
