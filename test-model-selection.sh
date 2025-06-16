#!/bin/bash

echo "🧪 Testing Model Selection Patterns"
echo "==================================="
echo ""

# Test the regex patterns
echo "Testing extraction patterns..."
echo ""

test_pattern() {
    local input="$1"
    local expected="$2"
    echo "Input: \"$input\""
    echo "Expected model: $expected"
    echo ""
}

echo "✅ Valid Patterns:"
test_pattern "@claude using sonnet-3.5 what is 2+2?" "claude-3-5-sonnet-20241022"
test_pattern "@claude with claude-3-7-sonnet-20250219 analyze this" "claude-3-7-sonnet-20250219"
test_pattern "@claude model: opus-4 help me" "claude-sonnet-4-20250514"
test_pattern "@claude using 3.7 explain this" "claude-3-7-sonnet-20250219"
test_pattern "@claude MODEL: sonnet-4 test" "claude-sonnet-4-20250514"

echo "❌ Invalid Patterns (will use default):"
test_pattern "@claude what time is it?" "claude-3-5-sonnet-20241022 (default)"
test_pattern "@claude using gpt-4 test" "claude-3-5-sonnet-20241022 (default)"
test_pattern "@claude with invalid-model help" "claude-3-5-sonnet-20241022 (default)"

echo ""
echo "📝 Quick Reference:"
echo "  Aliases:"
echo "    sonnet-3.7 → claude-3-7-sonnet-20250219"
echo "    sonnet-3.5 → claude-3-5-sonnet-20241022"
echo "    sonnet-4   → claude-sonnet-4-20250514"
echo "    opus-4     → claude-sonnet-4-20250514"
echo ""

echo "🚀 Ready to test in Slack!"
echo "   Try: @claude using sonnet-3.7 what is 2+2?"