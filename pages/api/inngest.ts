import { serve } from "inngest/next";
import { newPR } from "../../inngest/new_pr";

// You must export the serve handler, which hosts all of the provided functions
// under one API endpoint.
export default serve("Github PR bot", process.env.INNGEST_SIGNING_KEY, [newPR]);
