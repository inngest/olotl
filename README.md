# Discord PR management: olotl

This is an open-source set of functions built using NextJS and the **[Inngest SDK](https://github.com/inngest/inngest-js)**
which deploy to [Inngest](https://inngest.com/), allowing you to coordinate pull requests within single-use ephemeral channels in Discord.

Think of this as a free, open-source version of [Axolo](https://axolo.co/) for discord.

This lets you:

- Create new temporary threads for each PR
- Be notified when PRs are reviewed, updated, or switched from draft within Discord
- Communicate and chat easily on code changes
- Merge and ship features faster via increased collaboration.

<br />

## Deploying

To deploy:

1. Clone this repo
2. Deploy to your provider of choice
3. [Register your functions with Inngest](https://www.inngest.com/docs/deploy#registering-live-functions-with-inngest)

The functions will be deployed, ready to run from any GitHub event as soon as the events
are triggered.

<br />

**Configuring Github webhooks**

1. Create a new [Github webhook within Inngest](https://app.inngest.com/sources/new)
2. Copy the generated URL as a webhook into your target repos.

That's it!  Events from Github will start flowing through to Inngest, automatically triggering
any functions that respond to those events.  Now in order for our functions to succeed, we need
to give them auth access to Discord.

<br />

**Configuring your Discord channels**

You'll need to make your own Discord bot to grant your functions access to your server.

1. Pop on over to [Discord Developers](https://discord.com/developers/applications) and make an app with a bot.
2. Connect your server via the URL generator with access to:
  - Manage channels
  - Send messages
  - Create public threads
  - Send mesasges in threads
  - Manage messages
  - Manage threads
  - Mention everyone
3. Copy the bot token and add it as a secret to Inngest, with the name of `DISCORD_TOKEN`.  Be sure to prefix the bot token with Bot: `Bot your-token`.
4. Copy your guild ID (server ID) as a secret to Inngest, with the name of `DISCORD_GUILD_ID`. 
5. Copy the channel ID which will house the threads to Inngest, with the name of `DISCORD_CHANNEL_ID`.

See .env for an example of the secrets to save.


## How it works

This repo uses [Inngest](https://www.inngest.com) to receive events from GitHub via webhooks.

The functions in this repo are event-driven:  they declaratively specify the events that
trigger them within their `inngest.json` files.

Each time Inngest receives an event, it checks which functions should run and automatically
executes the serverless function.
