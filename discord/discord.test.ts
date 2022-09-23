import { expect, it } from "@jest/globals";
import { createThread, updateThreadName, findImages } from "./discord";

const body =
  '## Description\r\n\r\nAdds a new button "Add deployment" to the functions list, allowing a user to submit a URL to be consumed by Inngest.\r\n\r\nThe URL is saved in local storage for easier resubmission.\r\n\r\n| ![image](https://user-images.githubusercontent.com/1736957/190629418-11b2a72d-cde2-4f5b-85ad-4ae741118a78.png) | ![image](https://user-images.githubusercontent.com/1736957/190629487-a89c748b-cdab-418b-8a2d-23373c787498.png) | ![image](https://user-images.githubusercontent.com/1736957/190629579-c32d4675-f09c-4259-8a7c-bc511e725c9d.png) | ![image](https://user-images.githubusercontent.com/1736957/190629648-431f6d95-5ce8-46dd-8b51-609914de26eb.png) | ![image](https://user-images.githubusercontent.com/1736957/190629843-1f898110-990d-4b5c-8f97-bab32996fd55.png) |\r\n| - | - | - | - | - |\r\n| Button | Default state | Loading | Error | A toast appears and the modal closes on success |\r\n\r\n## Type of change (choose one)\r\n\r\n- [ ] Chore (refactors, upgrades, etc.)\r\n- [ ] Bug fix (non-breaking change that fixes an issue)\r\n- [ ] Security fix (non-breaking change that fixes a potential vulnerability)\r\n- [x] New feature (non-breaking change that adds functionality)\r\n- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)\r\n\r\n## Testing Checklist (check when completed)\r\n\r\n- [ ] Pull request has unit tests and/or integration tests that cover the changes\r\n- [ ] Pull request has undergone code review\r\n';

it("fetches images", async () => {
  expect(findImages(body).length).toBe(5);
});

it("handles opened PRs", async () => {
  return;
  await createThread({
    name: "test",
    pr: 123,
    user: "tonyhb",
    url: "https://www.example.com",
    body,
  });
});

it("updates names", async () => {
  await updateThreadName({
    name: "lol",
    pr: 123,
  });
});
