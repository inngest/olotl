import { createFunction } from "inngest";
import {
  createThread,
  updateThreadName,
  sendMessage,
  findThread,
} from "../discord/discord";
import { GithubPullRequest } from "../__generated__/inngest";

// threadPrefix returns a static thread prefix for the PR derived from
// the event data.
const threadPrefix = (event: GithubPullRequest): string => {
  return `PR ${event.data.pull_request.number}`;
};

// threadName returns a thread name using the static thread prefix for the PR
const threadName = (event: GithubPullRequest): string => {
  const title = `${threadPrefix(event)} - ${event.data.pull_request.title}`;
  if (event.data.pull_request.draft) {
    return title + " (draft)";
  }
  if (event.data.pull_request.merged) {
    return title + " (merged)";
  }
  return title;
};

export const handlePR = async ({ event }: { event: GithubPullRequest }) => {
  switch (event.data.action) {
    case "opened":
      await createThread({
        name: threadName(event),
        pr: event.data.pull_request.number,
        user: event.data.pull_request.user.login,
        url: event.data.pull_request.html_url,
        body: event.data.pull_request.body,
      });
      break;

    case "closed":
      // TODO: Send merged message.
      const thread = await findThread(threadPrefix(event));
      const content = event.data.pull_request.merged
        ? "This PR has been merged! 🎉"
        : "This PR is closed.";
      await sendMessage(thread.id, { content });
      // Update thread name and archived status.
      await updateThreadName({
        name: threadName(event),
        prefix: threadPrefix(event),
        archived: true,
      });
      break;

    case "edited":
    case "converted_to_draft":
    case "ready_for_review":
      // Update the thread name.
      await updateThreadName({
        name: threadName(event),
        prefix: threadPrefix(event),
      });
  }
};

// On every "github/pull_request" event, run the handlePR function.
export const newPR = createFunction<GithubPullRequest>(
  "New PR",
  "github/pull_request",
  handlePR
);
