import { Reel } from "@/shared/types/reel";

const isAbsoluteUrl = (value?: string) =>
  Boolean(value && /^(https?:)?\/\//i.test(value));

const unique = (list: (string | null | undefined)[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    if (!item) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
};

export const resolveReelPlaybackCandidates = (reel: Reel): string[] => {
  const direct = [reel.stream_url, reel.m3u8_url, reel.video_url, reel.flussonic_vod_path]
    .filter((v): v is string => Boolean(v))
    .filter(isAbsoluteUrl);

  const rawPath =
    reel.video_path ||
    reel.flussonic_vod_path ||
    reel.stream_url ||
    reel.video_url ||
    reel.m3u8_url;
  if (!rawPath) return unique(direct);

  if (isAbsoluteUrl(rawPath)) {
    return unique([rawPath, ...direct]);
  }

  const normalized = rawPath.replace(/^\//, "");

  const m3u8 = `https://stream.alloplay.uz/vod/${normalized}/master.m3u8`;
  const directMp4 = `https://stream.alloplay.uz/vod/${normalized}`;

  return unique([m3u8, directMp4, ...direct]);
};

export const resolveReelStreamUrl = (reel: Reel): string | null =>
  resolveReelPlaybackCandidates(reel)[0] ?? null;
