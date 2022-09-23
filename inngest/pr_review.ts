import { NodeHtmlMarkdown } from 'node-html-markdown'
import { createFunction } from "inngest";
import { GithubPullRequestReview, GithubPullRequestReviewComment } from "../__generated__/inngest";
import { findThread, sendMessage } from '../discord/discord';

export const reviewComment = createFunction<GithubPullRequestReviewComment>("PR comment", "github/pull_request_review_comment", async ({ event }) => {
  const body = NodeHtmlMarkdown.translate(event.data.comment.body);
  const thread = await findThread(`PR ${event.data.pull_request.number}`);
  const content = `💬 new comment from ${event.data.comment.user.login}:\n\n${body}`
  await sendMessage(thread.id, { content });
});

export const review = createFunction<GithubPullRequestReview>("PR review", "github/pull_request_review", async ({ event }) => {
  if (event.data.review.state === "commented") {
    return
  }

  const approved = event.data.review.state === "approved";
  const user = event.data.pull_request.user.login;
  const content = approved ? `🤙 review approved by ${user}` : `🤚 changes requested by ${user}`;
  const thread = await findThread(`PR ${event.data.pull_request.number}`);
  await sendMessage(thread.id, { content });
});
