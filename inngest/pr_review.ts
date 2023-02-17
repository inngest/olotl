import { NodeHtmlMarkdown } from "node-html-markdown";
import * as discord from "../discord/discord";
import { inngest } from "./client";

export const reviewComment = inngest.createFunction(
  { name: "PR comment", fns: { ...discord } },
  { event: "github/pull_request_review_comment" },
  async ({ event, fns: { findThread, sendMessage } }) => {
    const body = NodeHtmlMarkdown.translate(event.data.comment.body);
    const thread = await findThread(`PR ${event.data.pull_request.number}`);
    const content = `💬 new comment from ${event.data.comment.user.login}:\n\n${body}`;
    await sendMessage(thread.id, { content });
  }
);

export const review = inngest.createFunction(
  { name: "PR review", fns: { ...discord } },
  { event: "github/pull_request_review" },
  async ({ event, fns: { findThread, sendMessage } }) => {
    if (event.data.review.state === "commented") {
      return;
    }

    const approved = event.data.review.state === "approved";
    const user = event.data.review.user.login;
    const content = approved
      ? `🤙 review approved by ${user}`
      : `🤚 changes requested by ${user}`;
    const thread = await findThread(`PR ${event.data.pull_request.number}`);
    await sendMessage(thread.id, { content });
  }
);
