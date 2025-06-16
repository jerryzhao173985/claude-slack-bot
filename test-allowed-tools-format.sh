#!/bin/bash

echo "🧪 Testing Claude Code allowed_tools Format"
echo "=========================================="
echo ""

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not set"
    echo "Please run: export ANTHROPIC_API_KEY='your-key'"
    exit 1
fi

# Test different formats
echo "Testing different allowed_tools formats..."
echo ""

# Create test directory
mkdir -p test-output
cd test-output

# Test 1: Comma-separated (should work)
echo "1️⃣ Testing comma-separated format:"
echo "   --allowedTools \"Write,Read\""
claude -p "Write the text 'Format 1 works!' to test1.txt" --allowedTools "Write,Read" --dangerously-skip-permissions

if [ -f "test1.txt" ]; then
    echo "   ✅ SUCCESS: Comma-separated format works!"
else
    echo "   ❌ FAILED: Comma-separated format didn't work"
fi

# Test 2: Space-separated (might not work)
echo ""
echo "2️⃣ Testing space-separated format:"
echo "   --allowedTools \"Write\" \"Read\""
claude -p "Write the text 'Format 2 works!' to test2.txt" --allowedTools "Write" "Read" --dangerously-skip-permissions

if [ -f "test2.txt" ]; then
    echo "   ✅ SUCCESS: Space-separated format works!"
else
    echo "   ❌ FAILED: Space-separated format didn't work"
fi

# Test 3: Single string with ALL
echo ""
echo "3️⃣ Testing ALL format:"
echo "   --allowedTools \"ALL\""
claude -p "Write the text 'Format 3 works!' to test3.txt" --allowedTools "ALL" --dangerously-skip-permissions

if [ -f "test3.txt" ]; then
    echo "   ✅ SUCCESS: ALL format works!"
else
    echo "   ❌ FAILED: ALL format didn't work"
fi

# Summary
echo ""
echo "📊 Summary:"
echo "==========="
ls -la *.txt 2>/dev/null || echo "No test files created"

# Cleanup
cd ..
rm -rf test-output

echo ""
echo "✅ Test complete!"