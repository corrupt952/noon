import type { SlimBlock } from "../notion/block";
import type { SlimPage } from "../notion/page";

export interface PageData {
  page: SlimPage;
  blocks: SlimBlock[];
}

export interface PageFormatter {
  formatPage(data: PageData): string;
}

export { toonFormatter } from "./toon";
export { jsonFormatter } from "./json";
export { markdownFormatter } from "./markdown";
