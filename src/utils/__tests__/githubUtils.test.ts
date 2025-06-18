import { GitHubUtils } from '../githubUtils';

describe('GitHubUtils', () => {
  describe('extractGitHubContext', () => {
    const githubUsername = 'jerryzhao173985';

    test('should parse full GitHub URL correctly', () => {
      const text = 'Check out https://github.com/jerryzhao173985/incremental-game-generator';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
    });

    test('should parse GitHub URL with .git extension', () => {
      const text = 'Clone https://github.com/jerryzhao173985/incremental-game-generator.git';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
    });

    test('should parse SSH URL correctly', () => {
      const text = 'git@github.com:jerryzhao173985/incremental-game-generator.git is my repo';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
    });

    test('should parse owner/repo format', () => {
      const text = 'Fix issues in jerryzhao173985/incremental-game-generator please';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
    });

    test('should parse URL with PR path', () => {
      const text = 'Review https://github.com/facebook/react/pull/12345';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'facebook',
        repo: 'react',
        isOwnRepo: false,
        branch: '12345',
        path: undefined,
        fullUrl: 'https://github.com/facebook/react'
      });
    });

    test('should parse URL with file path', () => {
      const text = 'Look at https://github.com/nodejs/node/blob/main/lib/fs.js for reference';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'nodejs',
        repo: 'node',
        isOwnRepo: false,
        branch: 'main',
        path: 'lib/fs.js',
        fullUrl: 'https://github.com/nodejs/node'
      });
    });

    test('should correctly parse repository name from complex URL', () => {
      // This was the actual bug - "incremental-game-generator" was being parsed as just "i"
      const text = 'analyze https://github.com/jerryzhao173985/incremental-game-generator in details';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
      
      // Make sure it's not parsing as just "i"
      expect(result?.repo).not.toBe('i');
      expect(result?.repo).toBe('incremental-game-generator');
    });

    test('should handle URLs with trailing text correctly', () => {
      const text = 'Check https://github.com/jerryzhao173985/incremental-game-generator and let me know';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
    });

    test('should handle SSH URLs with trailing text', () => {
      const text = 'Clone git@github.com:jerryzhao173985/incremental-game-generator.git first';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
    });

    test('should ignore invalid patterns', () => {
      // These are filtered out due to the exclusion list
      expect(GitHubUtils.extractGitHubContext('model/with something', githubUsername)).toBeNull();
      expect(GitHubUtils.extractGitHubContext('using/mode advanced', githubUsername)).toBeNull();
      expect(GitHubUtils.extractGitHubContext('with/repository', githubUsername)).toBeNull();
      expect(GitHubUtils.extractGitHubContext('mode/test', githubUsername)).toBeNull();
    });

    test('should handle markdown links', () => {
      const text = '[My Repo](https://github.com/jerryzhao173985/incremental-game-generator)';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
    });

    test('should handle angle bracket URLs', () => {
      const text = '<https://github.com/jerryzhao173985/incremental-game-generator>';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: undefined,
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
    });

    test('should parse PR URL in angle brackets correctly', () => {
      // This was the actual bug - PR number was being parsed as "46>,"
      const text = 'Please review this pull-request <https://github.com/jerryzhao173985/incremental-game-generator/pull/46>, address every reviewer comment';
      const result = GitHubUtils.extractGitHubContext(text, githubUsername);
      
      expect(result).toEqual({
        owner: 'jerryzhao173985',
        repo: 'incremental-game-generator',
        isOwnRepo: true,
        branch: '46',
        path: undefined,
        fullUrl: 'https://github.com/jerryzhao173985/incremental-game-generator'
      });
      
      // Make sure branch doesn't include the angle bracket or comma
      expect(result?.branch).toBe('46');
      expect(result?.branch).not.toContain('>');
      expect(result?.branch).not.toContain(',');
    });
  });

  describe('getAllowedTools', () => {
    test('should return read-only tools for non-owned repos', () => {
      const { readTools, writeTools } = GitHubUtils.getAllowedTools(false);
      
      expect(readTools.length).toBeGreaterThan(0);
      expect(writeTools.length).toBe(0);
      expect(readTools).toContain('mcp__github__get_file_contents');
      expect(readTools).toContain('mcp__github__search_code');
    });

    test('should return both read and write tools for owned repos', () => {
      const { readTools, writeTools } = GitHubUtils.getAllowedTools(true);
      
      expect(readTools.length).toBeGreaterThan(0);
      expect(writeTools.length).toBeGreaterThan(0);
      expect(writeTools).toContain('mcp__github__create_or_update_file');
      expect(writeTools).toContain('mcp__github__create_pull_request');
    });
  });
});