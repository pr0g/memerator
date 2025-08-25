import { HttpError } from "wasp/server";
import OpenAI from "openai";
import { fetchMemeTemplates, generateMemeImage } from "./utils";

import type { CreateMeme, EditMeme } from "wasp/server/operations";
import type { Meme, Template } from "wasp/entities";

type CreateMemeArgs = { topics: string[]; audience: string };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const createMeme: CreateMeme<CreateMemeArgs, Meme> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in");
  }
  if (context.user.credits === 0 && !context.user.isAdmin) {
    throw new HttpError(403, "You have no credits remaining");
  }

  let templates: Template[] = await context.entities.Template.findMany({});
  if (templates.length === 0) {
    const memeTemplates = await fetchMemeTemplates();
    templates = await Promise.all(
      memeTemplates.map(async (template: any) => {
        const addedTemplate = await context.entities.Template.upsert({
          where: { id: template.id },
          create: {
            id: template.id,
            name: template.name,
            url: template.url,
            width: template.width,
            height: template.height,
            boxCount: template.box_count,
          },
          update: {},
        });
        return addedTemplate;
      })
    );
  }

  templates = templates.filter((template) => template.boxCount <= 2);
  const randomTemplate =
    templates[Math.floor(Math.random() * templates.length)];

  console.log("random template: ", randomTemplate);

  const topicsFlattened = args.topics.join(", ");
  const systemPrompt = `You are a meme idea generator. You will use the imgflip api to generate a meme based on an idea you suggest. Given a random template name and topics, generate a meme for the intended audience. Only use the template provided`;
  const userPrompt = `Topics: ${topicsFlattened}\n Intended audience: ${args.audience}\n Template ${randomTemplate.name}`;

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "generateMemeImage",
        description:
          "Generate a meme using the imgflip API based on the given idea",
        parameters: {
          type: "object",
          properties: {
            text0: {
              type: "string",
              description: "The text for the top caption of the meme",
            },
            text1: {
              type: "string",
              description: "The text for the bottom caption of the meme",
            },
          },
          required: ["text0", "text1"],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  ];

  let openAiResponse: OpenAI.Chat.Completions.ChatCompletion;
  try {
    openAiResponse = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools,
    });
  } catch (e: unknown) {
    console.error("Error calling OpenAI: ", e);
    throw new HttpError(500, "Error calling OpenAI");
  }

  console.log(openAiResponse.choices[0]);

  if (!openAiResponse.choices[0].message.tool_calls) {
    throw new HttpError(500, "No function call in OpenAI response");
  }

  const toolCall = openAiResponse.choices[0].message.tool_calls[0];
  const functionCall =
    toolCall as OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;

  const name = functionCall.function.name;
  console.log("Function call:", name);

  const functionArgs = JSON.parse(functionCall.function.arguments);
  const memeIdeaText0 = functionArgs.text0;
  const memeIdeaText1 = functionArgs.text1;

  console.log("Meme idea args:", memeIdeaText0, memeIdeaText1);

  const memeUrl = await generateMemeImage({
    templateId: randomTemplate.id,
    text0: memeIdeaText0,
    text1: memeIdeaText1,
  });

  const meme = await context.entities.Meme.create({
    data: {
      text0: memeIdeaText0,
      text1: memeIdeaText1,
      topics: topicsFlattened,
      audience: args.audience,
      url: memeUrl,
      template: { connect: { id: randomTemplate.id } },
      user: { connect: { id: context.user.id } },
    },
  });

  return meme;
};

type EditMemeArgs = Pick<Meme, "id" | "text0" | "text1">;
type EditMemeResult = Meme;
export const editMeme: EditMeme<EditMemeArgs, EditMemeResult> = async (
  { id, text0, text1 },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in");
  }
  const meme = await context.entities.Meme.findFirstOrThrow({
    where: { id },
    include: { template: true },
  });
  if (!context.user.isAdmin && meme.userId != context.user.id) {
    throw new HttpError(403, "You are not the creator of this meme");
  }
  const memeUrl = await generateMemeImage({
    templateId: meme.template.id,
    text0,
    text1,
  });
  const newMeme = await context.entities.Meme.update({
    where: { id },
    data: {
      text0,
      text1,
      url: memeUrl,
    },
  });
  return newMeme;
};
