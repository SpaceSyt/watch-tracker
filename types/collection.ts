import type { EntryStatus } from "@/app/generated/prisma/enums";

export type CustomListOption = {
  id: string;
  name: string;
};

export type CollectionEntry = {
  id: string;
  status: EntryStatus;
  rating: number | null;
  review: string | null;
  progressCurrent: number | null;
  updatedAt: string;
  titleName: string;
  titlePosterUrl: string | null;
  titleExternalSource: string;
  titleExternalId: string;
  titleMediaType: string;
  titleReleaseDate: string | null;
  titleTotalEpisodes: number | null;
  customLists: CustomListOption[];
};
