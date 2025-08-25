import type { Meme, Template } from "wasp/entities";
import { HttpError } from "wasp/server";
import type { GetAllMemes, GetMeme } from "wasp/server/operations";

type GetAllMemesArgs = void;
type GetAllMemesResult = Meme[];
export const getAllMemes: GetAllMemes<
  GetAllMemesArgs,
  GetAllMemesResult
> = async (_args, context) => {
  const memeIdeas = await context.entities.Meme.findMany({
    orderBy: { createdAt: "desc" },
    include: { template: true },
  });
  return memeIdeas;
};

type GetMemeArgs = { id: string };
type GetMemeResult = Meme & { template: Template };
export const getMeme: GetMeme<GetMemeArgs, GetMemeResult> = async (
  { id },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in");
  }
  const meme = await context.entities.Meme.findUniqueOrThrow({
    where: { id },
    include: { template: true },
  });
  return meme;
};
