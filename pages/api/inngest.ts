import { serve } from "inngest/next";
import { newPR } from "../../inngest/new_pr";
import { review, reviewComment } from "../../inngest/pr_review";

// You must export the serve handler, which hosts all of the provided functions
// under one API endpoint.
const api = (req: any, res: any) => {
  const fn = serve("Github PR bot", [newPR, reviewComment, review]);

  console.log(req.headers);

  return fn(req, res);
}

export default api;
