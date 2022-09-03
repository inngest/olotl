package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/bwmarrin/discordgo"
	"github.com/inngest/inngestgo/actionsdk"
)

func main() {
	var (
		result any
		err    error
	)

	client, err := discordgo.New(os.Getenv("DISCORD_TOKEN"))
	if err != nil {
		actionsdk.WriteError(err, false)
		return
	}

	// Get the step's input arguments.
	args := actionsdk.MustGetArgs()

	// Find the thread we need to communicate in.
	thread, err := findThread(args)

	// Send a reminder to review the PR.
	pr := args.Event.Data["pull_request"].(map[string]any)
	msg := fmt.Sprintf("@here this PR has been open for 3 days without merging.")
	if _, err := client.ChannelMessageSendComplex(thread.ID, &discordgo.MessageSend{
		Content: msg,
		Embeds: []*discordgo.MessageEmbed{
			{
				Title: pr["title"].(string),
				URL:   pr["html_url"].(string),
			},
		},
	}); err != nil {
		actionsdk.WriteError(err, true)
		return
	}

	actionsdk.WriteResult(&actionsdk.Result{
		Body:   result,
		Status: 200,
	})
}

// getThreadPrefix returns the thread prefix.
//
// We always want the channel name to start with the PR number;
// this allows us to identify channels by PR in the future.
func getThreadPrefix(args *actionsdk.Args) string {
	num := args.Event.Data["number"].(float64)
	return fmt.Sprintf("PR %d", int(num))
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
