import { NodeHtmlMarkdown } from "node-html-markdown";
import * as discord from "../discord/discord";
import { inngest } from "./client";
import { slugify } from "inngest";

export const reviewComment = inngest.createFunction(
  { 
    id: slugify("PR comment"),
    name: "PR comment"
  },
  { event: "github/pull_request_review_comment" },
  async ({ event, step }) => {
    const body = NodeHtmlMarkdown.translate(event.data.comment.body);
    const thread = await step.run("find-thread", async () => await discord.findThread(`PR ${event.data.pull_request.number}`));
    const content = `💬 new comment from ${event.data.comment.user.login}:\n\n${body}`;
    await step.run("send-comment", async () => await discord.sendMessage(thread.id, { content }));
  }
);

export const review = inngest.createFunction(
  { name: "PR review", id: slugify("PR review") },
  { event: "github/pull_request_review" },
  async ({ event, step }) => {
    if (event.data.review.state === "commented") {
      return;
    }

    const approved = event.data.review.state === "approved";
    const user = event.data.review.user.login;
    const content = approved
      ? `🤙 review approved by ${user}`
      : `🤚 changes requested by ${user}`;
      const thread = await step.run("find-thread", async () => await discord.findThread(`PR ${event.data.pull_request.number}`));
    await step.run("send-message", async () => await discord.sendMessage(thread.id, { content }));
  }
);
