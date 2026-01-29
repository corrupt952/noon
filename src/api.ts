import { Client } from "@notionhq/client";
import pLimit from "p-limit";
import { getToken, isTokenExpired, type TokenData } from "./config";
import { refreshToken, startAuthFlow } from "./auth";
import {
  getCache,
  saveCache,
  isCacheValid,
  type SlimBlockData,
  type SlimPageData,
  type CachedPage,
} from "./cache";

let notionClient: Client | null = null;

// Rate limit: 3 requests/sec for Notion API
const CONCURRENCY_LIMIT = 3;
const limit = pLimit(CONCURRENCY_LIMIT);

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

// Get all block children with pagination
export async function getAllBlockChildren(blockId: string): Promise<any[]> {
  const client = await getClient();
  const allBlocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    allBlocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return allBlocks;
}

// Fetch blocks recursively with rate limiting (preserves order)
export async function fetchBlocksRecursive(
  blockId: string,
  slimBlockFn: (block: any) => SlimBlockData
): Promise<SlimBlockData[]> {
  async function fetchChildren(parentId: string): Promise<SlimBlockData[]> {
    const blocks = await limit(() => getAllBlockChildren(parentId));

    // Process all blocks in parallel while preserving order
    const processedBlocks = await Promise.all(
      blocks.map(async (block) => {
        const slimBlock = slimBlockFn(block);

        if (block.has_children && block.type !== "child_page" && block.type !== "child_database") {
          slimBlock.children = await fetchChildren(block.id);
        }

        return slimBlock;
      })
    );

    return processedBlocks;
  }

  return fetchChildren(blockId);
}

// Get page with caching support
export async function getPageWithCache(
  pageId: string,
  slimBlockFn: (block: any) => SlimBlockData,
  extractTitle: (page: any) => string
): Promise<{ page: SlimPageData; blocks: SlimBlockData[]; fromCache: boolean }> {
  // Step 1: Get page metadata
  const page = await getPage(pageId);
  const lastEditedTime = (page as any).last_edited_time;

  // Step 2: Check cache
  const cached = getCache(pageId);
  if (cached && isCacheValid(cached, lastEditedTime)) {
    return {
      page: cached.page,
      blocks: cached.blocks,
      fromCache: true,
    };
  }

  // Step 3: Fetch blocks recursively
  const blocks = await fetchBlocksRecursive(pageId, slimBlockFn);

  // Step 4: Build slim page data
  const slimPage: SlimPageData = {
    id: page.id,
    title: extractTitle(page),
    url: (page as any).url,
  };

  // Step 5: Save to cache
  const cacheData: CachedPage = {
    pageId,
    lastEditedTime,
    fetchedAt: Date.now(),
    page: slimPage,
    blocks,
  };
  saveCache(cacheData);

  return {
    page: slimPage,
    blocks,
    fromCache: false,
  };
}

