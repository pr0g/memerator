import { type CreateMeme } from "wasp/server/operations";
import { type Meme } from "wasp/entities";

type CreateMemeArgs = { topics: string[]; audience: string };

export const createMeme: CreateMeme<CreateMemeArgs, Meme> = async (
  args,
  context
) => {
  const topicsFlattened = args.topics.join(", ");
  const meme = await context.entities.Meme.create({
    data: {
      text0: "",
      text1: "",
      topics: topicsFlattened,
      audience: args.audience,
      url: "",
      template: {},
      user: {},
    },
  });
  return meme;
};
