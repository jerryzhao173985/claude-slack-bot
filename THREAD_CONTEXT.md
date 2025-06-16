# 🧵 Thread Context Feature

## Overview

The Claude Slack Bot now has full thread context awareness! When you mention Claude in a Slack thread, it automatically reads all previous messages in the thread and uses them to provide contextual responses.

## How It Works

### Automatic Context Collection
1. When mentioned in a thread, the bot fetches up to 50 previous messages
2. Messages are formatted with timestamps and user names
3. The context is passed to Claude as additional system prompt information
4. Claude uses this context to provide relevant, contextual responses

### Thread-Aware Commands

The bot recognizes various thread-related patterns:
- "summarize this thread"
- "what was discussed above?"
- "what did [user] say about [topic]?"
- "give me the key points from this conversation"
- "what's the consensus here?"

## Usage Examples

### Thread Summarization
```
@claude summarize this thread
```
Claude will analyze all messages and provide a structured summary.

### Context-Aware Questions
```
@claude what did Alice suggest about the architecture?
```
Claude will search the thread context for Alice's contributions about architecture.

### Follow-up Questions
```
@claude can you elaborate on the third point mentioned above?
```
Claude understands the thread flow and can reference previous messages.

## Technical Implementation

### Two-Layer Approach
1. **Cached Context**: The Cloudflare Worker fetches and caches thread messages
2. **Fresh Context**: Claude can also use `mcp__slack__slack_get_thread_replies` for real-time data

### Message Formatting
Thread messages are formatted with:
- Chronological ordering
- Readable timestamps (e.g., "2:30 PM")
- User identification (with bot indicators)
- Visual markers (➤ for the most recent message)

### Performance
- Thread context is cached for 1 minute to reduce API calls
- User names are cached for 24 hours
- Maximum 50 messages per thread (Slack API limit)

## Limitations

1. **Message Limit**: Only the most recent 50 messages are included
2. **Private Channels**: Bot must be invited to the channel
3. **Deleted Messages**: Deleted messages won't appear in context
4. **Attachments**: Currently only text content is included

## Best Practices

1. **Be Specific**: When asking about the thread, be specific about what you want
   - ✅ "summarize the technical decisions in this thread"
   - ❌ "what's up?"

2. **Reference Users**: You can ask about specific user contributions
   - "What did @john suggest about the database design?"

3. **Use Thread Features**: Keep related discussions in threads for better context

## Troubleshooting

### Bot doesn't see thread context?
1. Ensure the bot is in the channel
2. Check that it's a thread (not a top-level message)
3. Verify the bot has proper permissions

### Context seems incomplete?
- The bot only sees messages after it was invited to the channel
- Maximum 50 messages are included
- Edited messages show their current version

## Privacy Note

The bot caches thread messages for 1 minute to improve performance. All cached data is encrypted and automatically expires.