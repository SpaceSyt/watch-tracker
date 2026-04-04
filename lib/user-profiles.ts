import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export async function getOrCreateUserProfile(authUser: User) {
  return prisma.userProfile.upsert({
    where: {
      authUserId: authUser.id,
    },
    update: {
      avatarUrl: authUser.user_metadata.avatar_url ?? null,
    },
    create: {
      authUserId: authUser.id,
      avatarUrl: authUser.user_metadata.avatar_url ?? null,
    },
  });
}
