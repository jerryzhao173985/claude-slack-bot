#!/bin/bash

echo "🧹 Cleaning up temporary documentation files..."
echo ""
echo "These files have been consolidated into proper documentation:"
echo "- docs/critical-issues-and-fixes.md"
echo "- docs/bug-fixes-consolidated.md"
echo ""

# Confirm before deletion
read -p "Delete temporary fix documentation files? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f CRITICAL_FIX_ANALYSIS.md
    rm -f WORKFLOW_COMPARISON.md
    rm -f COMPLETE_FIX_PLAN.md
    rm -f FIX_SUMMARY.md
    
    echo "✅ Temporary files removed"
    echo ""
    echo "Remaining documentation:"
    ls -la *.md | grep -E "(PROJECT|DEPLOYMENT|TROUBLESHOOTING|README)"
    echo ""
    echo "Documentation in docs/:"
    ls -la docs/*.md
else
    echo "❌ Cleanup cancelled"
fi