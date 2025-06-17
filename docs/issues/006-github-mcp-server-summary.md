# GitHub MCP Server Configuration Summary

## Key Points

1. **github-mcp-server is NOT an npm package**
   - It's distributed as Docker image or pre-built binaries
   - Cannot be installed with `npx` or `npm install`
   - Official repository: https://github.com/github/github-mcp-server

2. **Required Configuration**
   ```json
   {
     "command": "github-mcp-server",
     "args": ["stdio", "--toolsets", "all"],
     "env": {
       "GITHUB_PERSONAL_ACCESS_TOKEN": "${{ secrets.GH_TOKEN }}"
     }
   }
   ```
   - **MUST include `stdio` argument** for MCP protocol communication
   - Uses `GITHUB_PERSONAL_ACCESS_TOKEN` (not `GITHUB_TOKEN`)

3. **Installation in GitHub Actions**
   ```yaml
   - name: Install GitHub MCP Server
     run: |
       curl -L https://github.com/github/github-mcp-server/releases/download/v0.5.0/github-mcp-server_Linux_x86_64.tar.gz | tar xz -C ~/.local/bin
       chmod +x ~/.local/bin/github-mcp-server
       echo "$HOME/.local/bin" >> $GITHUB_PATH
   ```

4. **Common Mistakes to Avoid**
   - ❌ Don't use `npx -y github-mcp-server` (no npm package exists)
   - ❌ Don't forget the `stdio` argument
   - ❌ Don't use `@modelcontextprotocol/server-github` (deprecated)
   - ❌ Don't use `GITHUB_TOKEN` env var (use `GITHUB_PERSONAL_ACCESS_TOKEN`)

5. **Verification**
   - Check logs for "github": "connected" (not "failed")
   - Ensure binary is in PATH before Claude runs
   - Test with `github-mcp-server stdio --help`

## Migration from Deprecated Package

If you were using `@modelcontextprotocol/server-github`:
1. Remove any npm install commands for it
2. Add the binary download step
3. Change command from `npx` to `github-mcp-server`
4. Add `stdio` as the first argument
5. Keep the same environment variable configuration