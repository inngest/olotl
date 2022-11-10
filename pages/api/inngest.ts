import { serve } from "inngest/next";
import { newPR } from "../../inngest/new_pr";
import { review, reviewComment } from "../../inngest/pr_review";

// You must export the serve handler, which hosts all of the provided functions
// under one API endpoint.
export default serve("Github PR bot", [newPR, reviewComment, review]);
