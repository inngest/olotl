package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/bwmarrin/discordgo"
	"github.com/inngest/inngestgo/actionsdk"
)

func main() {
	// Get the step's input arguments.
	args := actionsdk.MustGetArgs()

	if args.Event.Data["action"].(string) != "submitted" {
		actionsdk.WriteResult(&actionsdk.Result{Status: 200})
		return
	}

	thread, err := findThread(args)
	if err != nil {
		actionsdk.WriteError(err, false)
		return
	}

	s, err := discordgo.New(os.Getenv("DISCORD_TOKEN"))
	if err != nil {
		actionsdk.WriteError(err, false)
		return
	}

	review := args.Event.Data["review"].(map[string]any)

	var msg string
	switch review["state"] {
	case "commented":
		msg = fmt.Sprintf("💬 review commented by %s", review["user"].(map[string]any)["login"])
	case "changes_requested":
		msg = fmt.Sprintf("🤚 changes requested by %s", review["user"].(map[string]any)["login"])
	case "approved":
		msg = fmt.Sprintf("🤙 review approved by %s", review["user"].(map[string]any)["login"])
	}

	if review["body"] != nil {
		msg += "\n"
		msg += review["body"].(string)
	}

	if _, err := s.ChannelMessageSendComplex(thread.ID, &discordgo.MessageSend{
		Content: msg,
	}); err != nil {
		actionsdk.WriteError(err, false)
		return
	}

	actionsdk.WriteResult(&actionsdk.Result{Status: 200})
}

func findThread(args *actionsdk.Args) (*discordgo.Channel, error) {
	s, err := discordgo.New(os.Getenv("DISCORD_TOKEN"))
	if err != nil {
		return nil, fmt.Errorf("error connecting to discord: %w", err)
	}

	threads, err := s.GuildThreadsActive(os.Getenv("DISCORD_GUILD_ID"))
	if err != nil {
		return nil, fmt.Errorf("error listing threads: %w", err)
	}

	prefix := getThreadPrefix(args)

	for _, t := range threads.Threads {
		if strings.HasPrefix(t.Name, prefix) {
			return t, nil
		}
	}

	return nil, fmt.Errorf("thread not found")
}

// getThreadPrefix returns the thread prefix.
//
// We always want the channel name to start with the PR number;
// this allows us to identify channels by PR in the future.
func getThreadPrefix(args *actionsdk.Args) string {
	num := args.Event.Data["pull_request"].(map[string]any)["number"].(float64)
	return fmt.Sprintf("PR %d", int(num))
}
