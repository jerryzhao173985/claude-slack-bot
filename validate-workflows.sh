#!/bin/bash

echo "🔍 Validating GitHub Actions workflow files..."
echo ""

# Check if we have any workflow files
WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" | wc -l)
echo "Found $WORKFLOW_COUNT workflow files"
echo ""

# Simple YAML validation using bash
for file in .github/workflows/*.yml; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo -n "Checking $filename... "
        
        # Basic checks
        errors=0
        
        # Check for tabs (YAML doesn't allow tabs)
        if grep -q $'\t' "$file"; then
            echo "❌ Contains tabs (YAML requires spaces)"
            errors=$((errors + 1))
        fi
        
        # Check for unmatched quotes
        line_num=0
        while IFS= read -r line; do
            line_num=$((line_num + 1))
            # Count quotes (excluding escaped ones)
            quote_count=$(echo "$line" | grep -o '"' | grep -v '\\"' | wc -l)
            if [ $((quote_count % 2)) -ne 0 ]; then
                echo "❌ Unmatched quotes on line $line_num"
                errors=$((errors + 1))
            fi
        done < "$file"
        
        # Check for common YAML issues
        # Check for colons without space after
        if grep -E ':[^ ]' "$file" | grep -v '::' | grep -v 'http:' | grep -v 'https:' > /dev/null; then
            echo "❌ Found colon without space after"
            errors=$((errors + 1))
        fi
        
        if [ $errors -eq 0 ]; then
            echo "✅ Basic syntax looks good"
        fi
    fi
done

echo ""
echo "📝 Recommended workflows:"
echo "1. claude-code-processor-best.yml - Full MCP with message updates (recommended)"
echo "2. claude-code-processor-direct.yml - Simple & fast without MCP"
echo "3. claude-code-processor-fixed.yml - Uses thread replies with MCP"
echo ""
echo "💡 To use a workflow, run:"
echo "   wrangler secret put GITHUB_WORKFLOW_FILE --value \"claude-code-processor-best.yml\""