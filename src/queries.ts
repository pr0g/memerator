import { type Meme } from "wasp/entities";
import { type GetAllMemes } from "wasp/server/operations";

export const getAllMemes: GetAllMemes<void, Meme[]> = async (
  _args,
  context
) => {
  const memeIdeas = await context.entities.Meme.findMany({
    orderBy: { createdAt: "desc" },
    include: { template: true },
  });
  return memeIdeas;
};
