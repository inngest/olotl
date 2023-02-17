import { Inngest } from "inngest";
import { Events } from "../__generated__/inngest";

export const inngest = new Inngest<Events>({
  name: "Github PR bot",
});
