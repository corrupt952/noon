// Extract Notion ID from URL or return as-is if already an ID
export function parseNotionId(input: string): string {
  // If it's a URL, extract the ID
  if (input.startsWith("http")) {
    const url = new URL(input);
    const pathname = url.pathname;

    // Get the last segment which contains the ID
    // Format: /workspace/Page-Title-abc123def456 or /abc123def456
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "";

    // ID is the last 32 characters (without dashes) at the end of the segment
    // Or the segment might be just the ID
    const match = lastSegment.match(/([a-f0-9]{32})$|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    if (match) {
      return (match[1] || match[2]).replace(/-/g, "");
    }

    // Try to get ID from the last 32 hex chars of the segment (after removing dashes from title)
    const cleanSegment = lastSegment.replace(/-/g, "");
    const idMatch = cleanSegment.match(/([a-f0-9]{32})$/i);
    if (idMatch) {
      return idMatch[1];
    }

    throw new Error(`Could not extract Notion ID from URL: ${input}`);
  }

  // Already an ID, just clean it up
  return input.replace(/-/g, "");
}
