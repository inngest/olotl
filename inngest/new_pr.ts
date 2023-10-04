import { slugify } from "inngest";
import * as discord from "../discord/discord";
import { inngest } from "./client";

// threadPrefix returns a static thread prefix for the PR derived from
// the event data.
export const threadPrefix = (event: any): string => {
  return `PR ${event.data.pull_request.number}`;
};

// threadName returns a thread name using the static thread prefix for the PR
export const threadName = (event: any): string => {
  const title = `${threadPrefix(event)} - ${event.data.pull_request.title}`;
  if (event.data.pull_request.draft) {
    return title + " (draft)";
  }
  if (event.data.pull_request.merged) {
    return title + " (merged)";
  }
  return title;
};

// On every "github/pull_request" event, run the handlePR function.
export const newPR = inngest.createFunction(
  {
    id: slugify("New PR"),
    name: "New PR",
    concurrency: 5,
  },
  { event: "github/pull_request" },
  async ({
    event,
    step,
  }) => {
    const { action } = event.data;

    if (action === "opened") {
      const args = {
        name: threadName(event),
        pr: event.data.pull_request.number,
        user: event.data.pull_request.user.login,
        url: event.data.pull_request.html_url,
        body: event.data.pull_request.body,
      };

      const thread = await step.run("create-thread", async () => await discord.createThread(args));
      await step.run("create-thread-intro", async () => await discord.createThreadIntro(args, thread.id));

      return thread;
    }

    if (action === "closed") {
      const thread = await step.run("find-thread", async () => await discord.findThread(threadPrefix(event)));
      const content = event.data.pull_request.merged
        ? "This PR has been merged! 🎉"
        : "This PR is closed.";
      await step.run("create-thread", async () => await discord.sendMessage(thread.id, { content }));
      // Update thread name and archived status.
      await step.run("update-thread-name-closed", async () => await discord.updateThreadName({
        name: threadName(event),
        prefix: threadPrefix(event),
        archived: true,
      }));
      return thread;
    }

    if (
      action === "edited" ||
      action === "converted_to_draft" ||
      action === "ready_for_review"
    ) {
      // Update the thread name.
      await step.run("update-thread-name", async () => await discord.updateThreadName({
        name: threadName(event),
        prefix: threadPrefix(event),
      }));
    }
  }
);
