import { inngest } from "./client";

export const cronjob = inngest.createFunction(
  { name: "test cron" },
  { cron: "* * * * *" },
  () => {
    return { status: 200, v: 4 };
  }
);
