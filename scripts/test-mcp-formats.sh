#!/bin/bash

# Test different MCP configuration formats

echo "=== Testing MCP Configuration Formats ==="
echo ""

# Format 1: Current format
echo "1. Current format (escaped JSON string):"
cat > format1.json <<'EOF'
{
  "mcpServers": {
    "notionApi": {
      "command": "npx",
      "args": ["-y","@notionhq/notion-mcp-server"],
      "env": { 
        "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer secret_test\",\"Notion-Version\":\"2022-06-28\"}"
      }
    }
  }
}
EOF
jq . format1.json || echo "Invalid JSON"

echo ""
echo "2. Alternative format (direct env in args):"
cat > format2.json <<'EOF'
{
  "mcpServers": {
    "notionApi": {
      "command": "npx",
      "args": [
        "-y",
        "@notionhq/notion-mcp-server"
      ],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer secret_test\",\"Notion-Version\":\"2022-06-28\"}"
      }
    }
  }
}
EOF
jq . format2.json || echo "Invalid JSON"

echo ""
echo "3. Docker format (for reference):"
cat > format3.json <<'EOF'
{
  "mcpServers": {
    "notionApi": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "OPENAPI_MCP_HEADERS={\"Authorization\":\"Bearer secret_test\",\"Notion-Version\":\"2022-06-28\"}",
        "notion-mcp-server"
      ]
    }
  }
}
EOF
jq . format3.json || echo "Invalid JSON"

echo ""
echo "4. Testing environment variable format:"
export OPENAPI_MCP_HEADERS='{"Authorization":"Bearer secret_test","Notion-Version":"2022-06-28"}'
echo "OPENAPI_MCP_HEADERS=$OPENAPI_MCP_HEADERS"

# Clean up
rm -f format1.json format2.json format3.json