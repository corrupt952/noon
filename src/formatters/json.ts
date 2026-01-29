import type { PageData, PageFormatter } from "./index";

export const jsonFormatter: PageFormatter = {
  formatPage(data: PageData): string {
    return JSON.stringify(
      {
        id: data.page.id,
        title: data.page.title,
        blocks: data.blocks,
      },
      null,
      2,
    );
  },
};
