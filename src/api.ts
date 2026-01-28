import { Client } from "@notionhq/client";
import { getToken, isTokenExpired, type TokenData } from "./config";
import { refreshToken, startAuthFlow } from "./auth";

let notionClient: Client | null = null;

async function ensureValidToken(): Promise<TokenData> {
  let token = getToken();

  if (!token) {
    token = await startAuthFlow();
  } else if (isTokenExpired(token) && token.refresh_token) {
    console.log("Token expired, refreshing...");
    token = await refreshToken(token.refresh_token);
  }

  return token;
}

export async function getClient(): Promise<Client> {
  if (notionClient) return notionClient;

  const token = await ensureValidToken();
  notionClient = new Client({ auth: token.access_token });
  return notionClient;
}

// ============ Search ============

export async function search(query: string, filter?: "page" | "database") {
  const client = await getClient();
  const params: Parameters<typeof client.search>[0] = { query };

  if (filter) {
    params.filter = { property: "object", value: filter };
  }

  return client.search(params);
}

// ============ Pages ============

export async function getPage(pageId: string) {
  const client = await getClient();
  return client.pages.retrieve({ page_id: pageId });
}

export async function getPageContent(pageId: string) {
  const client = await getClient();
  const blocks = await client.blocks.children.list({ block_id: pageId });
  return blocks;
}

// ============ Databases ============

export async function getDatabase(databaseId: string) {
  const client = await getClient();
  return client.databases.retrieve({ database_id: databaseId });
}

export async function queryDatabase(
  databaseId: string,
  filter?: object,
  sorts?: object[]
) {
  const client = await getClient();
  const params: Parameters<typeof client.databases.query>[0] = {
    database_id: databaseId,
  };

  if (filter) params.filter = filter as any;
  if (sorts) params.sorts = sorts as any;

  return client.databases.query(params);
}

// ============ Blocks ============

export async function getBlock(blockId: string) {
  const client = await getClient();
  return client.blocks.retrieve({ block_id: blockId });
}

export async function getBlockChildren(blockId: string) {
  const client = await getClient();
  return client.blocks.children.list({ block_id: blockId });
}

