package main

import (
	"fmt"
	"os"
	"strings"

	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/inngest/inngestgo/actionsdk"
)

func main() {
	var (
		result any
		err    error
	)

	// Get the step's input arguments.
	args := actionsdk.MustGetArgs()

	switch args.Event.Data["action"] {
	case "opened":
		result, err = createThread(args)
	case "closed":
		result, err = closeThread(args)
		// https://app.inngest.com/events/id/01GBYYKCJQKP5DWNHJQ6TMZT49
	case "edited":
		err = updateThreadName(args)
	case "converted_to_draft":
		err = updateThreadName(args)
	case "ready_for_review":
		err = updateThreadName(args)
	case "review_requested":
		// TODO:  We'd like to automatically invite the requested user
		// into the thread for the PR>
		//
		// Ideally we'd be able to map GitHub users to discord users
		// via server bios.  Right now, server bios aren't visible to the
		// discord API.
		//
		// Instead, we're going to do naive name matching.
		//
		// https://app.inngest.com/events/id/01GBZ644EYJHZRJJEK625BAGAD
	}

	if err != nil {
		actionsdk.WriteError(err, false)
		return
	}

	actionsdk.WriteResult(&actionsdk.Result{
		Body:   result,
		Status: 200,
	})
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

func closeThread(args *actionsdk.Args) (any, error) {
	s, err := discordgo.New(os.Getenv("DISCORD_TOKEN"))
	if err != nil {
		return nil, fmt.Errorf("error connecting to discord: %w", err)
	}

	thread, err := findThread(args)
	if err != nil {
		return nil, err
	}

	pr := args.Event.Data["pull_request"].(map[string]any)
	merged := pr["merged"].(bool)

	msg := "This PR is closed."
	if merged {
		msg = "This PR has been merged! 🎉"
	}
	if _, err := s.ChannelMessageSend(thread.ID, msg); err != nil {
		return nil, fmt.Errorf("error sending message: %w", err)
	}

	archive := true
	_, err = s.ChannelEdit(thread.ID, &discordgo.ChannelEdit{
		Name:     getThreadName(args),
		Archived: &archive,
	})
	return nil, err
}

// getThreadPrefix returns the thread prefix.
//
// We always want the channel name to start with the PR number;
// this allows us to identify channels by PR in the future.
func getThreadPrefix(args *actionsdk.Args) string {
	num := args.Event.Data["number"].(float64)
	return fmt.Sprintf("PR %d", int(num))
}

// getThreadName returns the thread name given all of the input data.
func getThreadName(args *actionsdk.Args) string {
	pr, _ := args.Event.Data["pull_request"].(map[string]any)
	title := fmt.Sprintf("%s - %s", getThreadPrefix(args), pr["title"])
	if pr["draft"].(bool) {
		title += " (draft)"
	}
	if pr["merged"].(bool) {
		title += " (merged)"
	}
	return title
}

// updateThreadName ensures the thread's name is always up to date,
// based off of the PR event.
func updateThreadName(args *actionsdk.Args) error {
	s, err := discordgo.New(os.Getenv("DISCORD_TOKEN"))
	if err != nil {
		return fmt.Errorf("error connecting to discord: %w", err)
	}

	thread, err := findThread(args)
	if err != nil {
		return err
	}

	name := getThreadName(args)
	_, err = s.ChannelEdit(thread.ID, &discordgo.ChannelEdit{
		Name: name,
	})
	return err
}

// createThread creates a new thread given a PR event.
func createThread(args *actionsdk.Args) (any, error) {
	s, err := discordgo.New(os.Getenv("DISCORD_TOKEN"))
	if err != nil {
		return nil, fmt.Errorf("error connecting to discord: %w", err)
	}

	name := getThreadName(args)

	// Auto-archive in 3 days
	dur := 3 * 24 * time.Hour
	thread, err := s.ThreadStartComplex(os.Getenv("DISCORD_CHANNEL_ID"), &discordgo.ThreadStart{
		Name:                name,
		Type:                discordgo.ChannelTypeGuildPublicThread,
		AutoArchiveDuration: int(dur.Minutes()),
	})
	if err != nil {
		// Attempt to repeat if this fails.
		return nil, fmt.Errorf("error creating channel: %w", err)
	}

	pr := args.Event.Data["pull_request"].(map[string]any)
	user := pr["user"].(map[string]any)

	msg := fmt.Sprintf("%s created a new PR: %d", user["login"], int(pr["number"].(float64)))
	if _, err := s.ChannelMessageSendComplex(thread.ID, &discordgo.MessageSend{
		Content: msg,
		Embeds: []*discordgo.MessageEmbed{
			{
				Title: pr["title"].(string),
				URL:   pr["html_url"].(string),
			},
		},
	}); err != nil {
		return nil, fmt.Errorf("error sending message: %w", err)
	}

	return thread, nil
}
