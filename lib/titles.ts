import { MediaType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type FindOrCreateTitleInput = {
  externalSource: string;
  externalId: string;
  title: string;
  mediaType: MediaType;
  originalTitle?: string | null;
  description?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  releaseDate?: Date | null;
  totalEpisodes?: number | null;
};

export async function findOrCreateTitle(input: FindOrCreateTitleInput) {
  return prisma.title.upsert({
    where: {
      externalSource_externalId: {
        externalSource: input.externalSource,
        externalId: input.externalId,
      },
    },
    update: {
      title: input.title,
      mediaType: input.mediaType,
      originalTitle: input.originalTitle ?? null,
      description: input.description ?? null,
      posterUrl: input.posterUrl ?? null,
      backdropUrl: input.backdropUrl ?? null,
      releaseDate: input.releaseDate ?? null,
      totalEpisodes: input.totalEpisodes ?? null,
    },
    create: {
      externalSource: input.externalSource,
      externalId: input.externalId,
      title: input.title,
      mediaType: input.mediaType,
      originalTitle: input.originalTitle ?? null,
      description: input.description ?? null,
      posterUrl: input.posterUrl ?? null,
      backdropUrl: input.backdropUrl ?? null,
      releaseDate: input.releaseDate ?? null,
      totalEpisodes: input.totalEpisodes ?? null,
    },
  });
}
