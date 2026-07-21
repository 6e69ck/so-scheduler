import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Robustly load global root workspace .env (/home/nick/code/soaring-eagles/.env)
const cwd = process.cwd();
loadEnvConfig(path.resolve(cwd, '../..'));
loadEnvConfig(path.resolve(cwd, '..'));
loadEnvConfig(cwd);

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
