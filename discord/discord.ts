import { REST } from "@discordjs/rest";
import { Routes, ChannelType } from "discord-api-types/v10";

const TOKEN = process.env.DISCORD_TOKEN || "";
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || "";
const GUILD_ID = process.env.DISCORD_GUILD_ID || "";

// REST adds "Bot " for us;  ensure this isn't present by mistake.
export const client = new REST({ version: "10" }).setToken(TOKEN.replace("Bot ", ""));

type CreateThreadArgs = {
  name: string;
  pr: number;
  user: string;
  url: string;
  body: string;
};

type DiscordEmbed = {
  url?: string;
  type?: "image" | "video" | "link" | "rich";
  title?: string;
  description?: string;
  timestamp?: string;
  color?: number;

  footer?: {
    text?: string;
    icon_url?: string;
  };

  author?: {
    url?: string;
    name?: string;
    icon_url?: string;
  };

  provider?: {
    url?: string;
    name?: string;
  };

  fields?: Array<{
    name?: string;
    value?: string;
    inline?: boolean;
  }>;

  image?: {
    url?: string;
    width?: number;
    height?: number;
  };
};

export type Thread = {
  flags: number;
  guild_id: string;
  id: string;
  owner_id: string;
  parent_id: string;
  last_message_id: string;
  name: string;
  member_count: number;
  message_count: number;
  total_messages_sent: number;
  type: ChannelType;
};

type ActiveThreadsResult = {
  threads: Array<Thread>;
};

export const findImages = (body: string): Array<string> => {
  const re = new RegExp(/\!\[\w+\]\((?<url>https:\/\/[\w-\.\/]+)\)/g);

  const matches = [];
  let item: any;
  while ((item = re.exec(body))) {
    matches.push(item[1]);
  }

  return matches;
};

export const createThread = async ({
  name,
}: CreateThreadArgs): Promise<{ id: string }> => {
  return await client.post(Routes.threads(CHANNEL_ID), {
    body: {
      name,
      auto_archive_duration: 10080, // 5 days,
      type: ChannelType.PublicThread,
    },
  }) as { id: string };
};

export const createThreadIntro = async({
  name,
  pr,
  user,
  url,
  body,
}: CreateThreadArgs, threadID: string) => {
  // Create a new message in the thread.
  const content = `${user} created a new PR: #${pr}`;

  // For every image in the PR, create a new embed.
  const embeds: Array<DiscordEmbed> = [
    {
      url,
      type: "link",
      title: name,
      description: content,
      author: {
        name: `${user}: PR ${pr}`,
        icon_url: "https://github.githubassets.com/favicons/favicon.png",
      },
      footer: {
        text: "Discord PR bot",
        icon_url: "https://github.githubassets.com/favicons/favicon.png",
      },
    },
  ];

  findImages(body).forEach((url: string) => {
    embeds.push({
      type: "image",
      image: { url },
    });
  });

  await sendMessage(threadID, {
    content: content + ":\n```" + body.substring(0, 1900) + "```",
    embeds: embeds,
  });
};

export const sendMessage = async (
  channelID: string,
  body: { content: string; embeds?: Array<DiscordEmbed> }
) => {
  await client.post(Routes.channelMessages(channelID), { body });
};

export const findThread = async (prefix: string): Promise<Thread | undefined> => {
  const result: ActiveThreadsResult = (await client.get(
    Routes.guildActiveThreads(GUILD_ID)
  )) as ActiveThreadsResult;
  return result.threads.find((i) => i.name.indexOf(prefix) === 0);
};

export const updateThreadName = async ({
  name,
  prefix,
  archived,
}: {
  name: string;
  prefix: string;
  archived?: boolean;
}) => {
  const thread = await findThread(prefix);
  const body: Record<string, any> = { name };

  if (archived) {
    body.archived = true;
  }

  await client.patch(Routes.channel(thread.id), {
    body,
  });
};
