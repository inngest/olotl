import { createScheduledFunction } from "inngest";


export const cronjob = createScheduledFunction("test cron", "* * * * *", () => {
  return { status: 200, "v": 1 };
});
