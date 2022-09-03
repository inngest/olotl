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

	issue := args.Event.Data["issue"].(map[string]any)
	if issue["pull_request"] == nil {
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

	comment := args.Event.Data["comment"].(map[string]any)

	msg := fmt.Sprintf(
		"💬 new comment from %s:\n\n%s",
		comment["user"].(map[string]any)["login"],
		comment["body"],
	)

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
	num := args.Event.Data["issue"].(map[string]any)["number"].(float64)
	return fmt.Sprintf("PR %d", int(num))
}
