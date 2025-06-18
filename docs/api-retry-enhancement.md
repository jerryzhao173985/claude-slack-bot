# Claude API Retry Enhancement

## Current Situation
The Claude API is returning 529 "Overloaded" errors frequently, causing user requests to fail.

## Proposed Enhancement: Automatic Retry Logic

### Implementation
Add retry logic in the GitHub Actions workflow:

```yaml
- name: Process with Claude (with retries)
  id: claude-process
  continue-on-error: true
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
  run: |
    MAX_RETRIES=3
    RETRY_DELAY=30
    
    for i in $(seq 1 $MAX_RETRIES); do
      echo "Attempt $i of $MAX_RETRIES..."
      
      # Run Claude
      if anthropics/claude-code-base-action@beta; then
        echo "Success!"
        exit 0
      else
        if [ $i -lt $MAX_RETRIES ]; then
          echo "Failed, waiting ${RETRY_DELAY}s before retry..."
          sleep $RETRY_DELAY
          RETRY_DELAY=$((RETRY_DELAY * 2))  # Exponential backoff
        fi
      fi
    done
    
    echo "All retries exhausted"
    exit 1
```

### Benefits
1. **Automatic recovery** from temporary overload
2. **Exponential backoff** prevents hammering the API
3. **Better user experience** - less manual retries needed
4. **Preserves session** for manual retry if all attempts fail

### Alternative: Queue System
For a more robust solution, implement a queue system:
1. Store requests in a queue (KV or database)
2. Process them with a scheduled worker
3. Update Slack when complete
4. Handle rate limits gracefully

This would require more infrastructure but provide better reliability.