export interface GitHubContext {
  owner: string;
  repo: string;
  isOwnRepo: boolean;
  branch?: string;
  path?: string;
  fullUrl?: string;
}

export class GitHubUtils {
  /**
   * Extract comprehensive GitHub context from a text message
   */
  static extractGitHubContext(text: string, githubUsername?: string): GitHubContext | null {
    // Enhanced patterns to match GitHub repositories with additional context
    const patterns = [
      // Full GitHub URLs with branch and path
      /(?:https?:\/\/)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^\/\s]+)(?:\/(.+))?)?/i,
      // SSH URLs
      /git@github\.com:([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?/i,
      // Simple owner/repo format
      /\b([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const owner = match[1];
        let repo = match[2];
        const branch = match[3];
        const path = match[4];
        
        // Remove .git extension if present
        repo = repo.replace(/\.git$/, '');
        
        // Validate repository name
        if (owner && repo && 
            !owner.includes(' ') && !repo.includes(' ') &&
            !['model', 'with', 'using', 'mode'].includes(owner)) {
          
          const isOwnRepo = githubUsername ? 
            owner.toLowerCase() === githubUsername.toLowerCase() : 
            false;
          
          return {
            owner,
            repo,
            isOwnRepo,
            branch,
            path,
            fullUrl: `https://github.com/${owner}/${repo}`
          };
        }
      }
    }

    return null;
  }

  /**
   * Determine which GitHub tools should be enabled based on repository ownership
   */
  static getAllowedTools(isOwnRepo: boolean): {
    readTools: string[];
    writeTools: string[];
  } {
    const readTools = [
      'mcp__github__get_me',
      'mcp__github__get_issue',
      'mcp__github__get_issue_comments',
      'mcp__github__list_issues',
      'mcp__github__search_issues',
      'mcp__github__get_pull_request',
      'mcp__github__list_pull_requests',
      'mcp__github__get_pull_request_files',
      'mcp__github__search_repositories',
      'mcp__github__get_file_contents',
      'mcp__github__list_commits',
      'mcp__github__search_code',
    ];

    const writeTools = isOwnRepo ? [
      'mcp__github__create_issue',
      'mcp__github__add_issue_comment',
      'mcp__github__update_issue',
      'mcp__github__create_pull_request',
      'mcp__github__merge_pull_request',
      'mcp__github__update_pull_request_branch',
      'mcp__github__create_or_update_file',
      'mcp__github__push_files',
      'mcp__github__create_branch',
      'mcp__github__create_pending_pull_request_review',
      'mcp__github__add_pull_request_review_comment',
      'mcp__github__create_and_submit_pull_request_review',
      'mcp__github__request_copilot_review',
    ] : [];

    return { readTools, writeTools };
  }

  /**
   * Build a context-aware system prompt for GitHub operations
   */
  static buildGitHubPrompt(context: GitHubContext): string {
    const { owner, repo, isOwnRepo, branch, path } = context;
    
    let prompt = `\n\n## GitHub Repository Context\n`;
    prompt += `Repository: ${owner}/${repo}\n`;
    
    if (branch) {
      prompt += `Branch: ${branch}\n`;
    }
    
    if (path) {
      prompt += `File/Path: ${path}\n`;
    }
    
    prompt += `Access Level: ${isOwnRepo ? 'Full (Owner)' : 'Read-Only'}\n\n`;
    
    if (isOwnRepo) {
      prompt += `You have full access to this repository. You can:\n`;
      prompt += `- Create and update files\n`;
      prompt += `- Create branches and pull requests\n`;
      prompt += `- Manage issues (create, update, close)\n`;
      prompt += `- Perform code reviews\n`;
      prompt += `- Merge pull requests\n\n`;
      prompt += `Use the appropriate GitHub MCP tools to help the user with their request.\n`;
    } else {
      prompt += `You have read-only access to this repository. You can:\n`;
      prompt += `- Analyze code structure and patterns\n`;
      prompt += `- Search for specific implementations\n`;
      prompt += `- Review issues and pull requests\n`;
      prompt += `- Examine commit history\n`;
      prompt += `- Provide insights and suggestions\n\n`;
      prompt += `Note: You cannot modify this repository as you don't have write access.\n`;
    }
    
    return prompt;
  }

  /**
   * Parse multiple repository references from text
   */
  static extractMultipleRepositories(text: string, githubUsername?: string): GitHubContext[] {
    const contexts: GitHubContext[] = [];
    const words = text.split(/\s+/);
    
    // Look for repository patterns in the text
    const repoPattern = /([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+)/g;
    const matches = text.matchAll(repoPattern);
    
    for (const match of matches) {
      const owner = match[1];
      const repo = match[2];
      
      if (owner && repo && 
          !['model', 'with', 'using', 'mode'].includes(owner)) {
        const context = GitHubUtils.extractGitHubContext(`${owner}/${repo}`, githubUsername);
        if (context && !contexts.some(c => c.owner === owner && c.repo === repo)) {
          contexts.push(context);
        }
      }
    }
    
    return contexts;
  }
}