import type { Artifact } from '@/types';

export function parseArtifacts(rawText: string): { cleanText: string; artifacts: Artifact[] } {
  const artifacts: Artifact[] = [];
  const cleanText = rawText.replace(/<artifact>([\s\S]*?)<\/artifact>/g, (_, json) => {
    try {
      const art = JSON.parse(json.trim());
      artifacts.push(art);
    } catch { /* skip malformed */ }
    return '';
  }).trim();
  return { cleanText, artifacts };
}
