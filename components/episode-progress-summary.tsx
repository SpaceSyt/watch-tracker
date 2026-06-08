"use client";

import { EntryStatus } from "@/app/generated/prisma/enums";
import { useI18n } from "@/components/language-preference";

function canShowEpisodeProgress(status: EntryStatus, mediaType: string) {
  return (
    mediaType === "TV" &&
    (status === EntryStatus.WATCHING || status === EntryStatus.COMPLETED)
  );
}

function formatEpisodeProgress(
  progressCurrent: number | null,
  totalEpisodes: number | null,
  notStarted: string,
  episodes: string,
) {
  const hasKnownTotal = totalEpisodes !== null && totalEpisodes > 0;

  if (progressCurrent === null) {
    return hasKnownTotal ? `${notStarted} / ${totalEpisodes} ${episodes}` : null;
  }

  if (!hasKnownTotal) {
    return progressCurrent === 0 ? notStarted : `${progressCurrent} ${episodes}`;
  }

  return progressCurrent === 0
    ? `${notStarted} / ${totalEpisodes} ${episodes}`
    : `${progressCurrent} / ${totalEpisodes} ${episodes}`;
}

export function EpisodeProgressSummary({
  status,
  mediaType,
  progressCurrent,
  totalEpisodes,
}: {
  status: EntryStatus;
  mediaType: string;
  progressCurrent: number | null;
  totalEpisodes: number | null;
}) {
  const dictionary = useI18n();

  if (!canShowEpisodeProgress(status, mediaType)) {
    return null;
  }

  const progress = formatEpisodeProgress(
    progressCurrent,
    totalEpisodes,
    dictionary.collectionContent.notStarted,
    dictionary.collectionContent.episodes,
  );

  if (!progress) {
    return null;
  }

  return (
    <p className="text-xs font-medium text-zinc-700">
      {dictionary.collectionContent.progress}: {progress}
    </p>
  );
}
