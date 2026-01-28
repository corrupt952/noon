import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  workspace_id?: string;
  workspace_name?: string;
}

export interface Config {
  client_id?: string;
  client_secret?: string;
  token?: TokenData;
}

const CONFIG_DIR = join(homedir(), ".config", "noon");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function saveToken(token: TokenData): void {
  const config = loadConfig();
  config.token = token;
  saveConfig(config);
}

export function getToken(): TokenData | undefined {
  const config = loadConfig();
  return config.token;
}

export function clearToken(): void {
  const config = loadConfig();
  delete config.token;
  saveConfig(config);
}

export function isTokenExpired(token: TokenData): boolean {
  if (!token.expires_at) return false;
  return Date.now() >= token.expires_at - 60000; // 1分前に期限切れとみなす
}
