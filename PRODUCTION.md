# Production Best Practices for Claude Slack Bot

## Performance Optimizations

### 1. Rate Limiting
- Implemented per-user rate limiting (10 requests/minute)
- Prevents abuse and controls costs
- Gracefully handles exceeded limits

### 2. Caching Strategy
- Thread context cached for 5 minutes
- User information cached for 24 hours
- Reduces Slack API calls significantly

### 3. Async Processing
- All heavy operations are non-blocking
- Worker responds immediately to Slack
- GitHub Actions handles the heavy lifting

## Monitoring & Observability

### 1. Structured Logging
```json
{
  "level": "info",
  "service": "EventHandler",
  "message": "Processing app mention",
  "timestamp": "2024-01-01T00:00:00Z",
  "userId": "U123456",
  "channel": "C123456",
  "duration": 150
}
```

### 2. Metrics
- Success/error rates
- Response times
- Rate limit hits

### 3. Monitoring Commands
```bash
# Real-time logs
wrangler tail

# Filter for errors
wrangler tail --format json | jq 'select(.level == "error")'

# Monitor rate limits
wrangler tail --format json | jq 'select(.message | contains("Rate limit"))'
```

## Security Best Practices

### 1. Secret Management
- Never commit secrets to git
- Use environment-specific secrets
- Rotate tokens regularly

### 2. Request Validation
- HMAC signature verification on all requests
- Timestamp validation (5-minute window)
- Input sanitization

### 3. Access Control
- Bot only responds in channels it's invited to
- Rate limiting prevents abuse
- Audit logs for all actions

## Cost Optimization

### 1. Cloudflare Workers
- Free tier: 100,000 requests/day
- Efficient code keeps execution time low
- KV storage for caching

### 2. GitHub Actions
- Free tier: 2,000 minutes/month
- Average job: ~2 minutes
- ~1,000 bot interactions/month

### 3. Anthropic API
- Monitor token usage in logs
- Cache responses when appropriate
- Use appropriate model for task complexity

## Scaling Considerations

### 1. Current Limits
- 10 requests/minute per user
- 50 messages thread context
- 5-minute cache TTL

### 2. Scaling Options
- Increase rate limits for trusted users
- Add Redis for distributed caching
- Use Cloudflare Durable Objects for state

### 3. Multi-Workspace Support
- Deploy separate Workers per workspace
- Share GitHub Actions runner
- Centralized monitoring

## Maintenance Tasks

### Weekly
- Review error logs
- Check API usage metrics
- Update dependencies

### Monthly
- Rotate API tokens
- Review rate limit settings
- Audit user access

### Quarterly
- Security audit
- Performance review
- Cost analysis

## Troubleshooting Guide

### Bot Not Responding
1. Check Worker logs: `wrangler tail`
2. Verify bot is in channel
3. Check rate limits
4. Verify secrets are set

### Slow Responses
1. Check GitHub Actions queue
2. Monitor API latencies
3. Review thread context size
4. Check cache hit rates

### Error Messages
- "Bad signature": Check SLACK_SIGNING_SECRET
- "Rate limit exceeded": Normal behavior, check logs
- "GitHub API error": Verify GITHUB_TOKEN permissions

## Emergency Procedures

### High Error Rate
```bash
# Quick diagnostics
wrangler tail --format json | jq '.error'

# Temporary disable (if needed)
wrangler secret put MAINTENANCE_MODE --value "true"
```

### Token Compromise
1. Immediately rotate all tokens
2. Update Worker secrets
3. Update GitHub secrets
4. Audit recent activity

### Performance Degradation
1. Check cache performance
2. Review recent code changes
3. Monitor external API status
4. Scale resources if needed