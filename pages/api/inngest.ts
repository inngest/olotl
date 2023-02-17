import { serve } from "inngest/next";
import { inngest } from "../../inngest/client";
import { cronjob } from "../../inngest/cron";
import { newPR } from "../../inngest/new_pr";
import { review, reviewComment } from "../../inngest/pr_review";

// You must export the serve handler, which hosts all of the provided functions
// under one API endpoint.
const api = (req: any, res: any) => {
  const fn = serve(inngest, [newPR, reviewComment, review, cronjob]);

  console.log(req.headers);

  return fn(req, res);
};

export default api;
