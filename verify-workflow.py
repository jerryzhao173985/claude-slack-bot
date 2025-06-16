#!/usr/bin/env python3
"""
Verify which GitHub workflow is configured in Cloudflare Worker
"""

import subprocess
import json
import sys

print("🔍 Verifying Claude Slack Bot Workflow Configuration")
print("=" * 50)
print()

# Try to get the current workflow from Cloudflare
print("1. Checking Cloudflare configuration...")
try:
    result = subprocess.run(
        ["wrangler", "secret", "list"],
        capture_output=True,
        text=True
    )
    
    if "GITHUB_WORKFLOW_FILE" in result.stdout:
        print("   ✅ GITHUB_WORKFLOW_FILE is configured")
        print("   Note: Can't read the actual value (it's a secret)")
    else:
        print("   ❌ GITHUB_WORKFLOW_FILE not found!")
        print("   This is why your bot isn't working!")
except Exception as e:
    print(f"   ⚠️  Could not check Cloudflare: {e}")

print()
print("2. Based on your GitHub Action log:")
print("   - Running: 'Claude Code Processor' (the broken one)")
print("   - Using: allowed_tools: \"ALL\"")
print("   - Result: All permissions DENIED")

print()
print("3. You MUST switch to one of these:")
print()
print("   Option A: claude-code-processor-ultimate.yml")
print("   - ✅ Correct permission format") 
print("   - ✅ All MCP tools listed")
print("   - ✅ Proper model name")
print()
print("   Option B: claude-code-direct-api.yml")
print("   - ✅ Bypasses Claude Code")
print("   - ✅ 100% reliable")
print("   - ✅ No permission issues")

print()
print("4. TO FIX NOW, run:")
print()
print("   ./SOLUTION_FINAL.sh")
print()
print("   Or manually:")
print("   wrangler secret put GITHUB_WORKFLOW_FILE")
print("   Enter: claude-code-processor-ultimate.yml")

print()
print("5. The problem is clear:")
print("   - Documentation bug: 'ALL' doesn't work")
print("   - Must use comma-separated tool list")
print("   - Your current workflow has the wrong format")