// Test script to verify GitHub workflow dispatch
// Run this locally to test if the GitHub token and workflow dispatch works

async function testGitHubDispatch() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = 'jerryzhao173985';
  const GITHUB_REPO = 'claude-slack-bot';
  const GITHUB_WORKFLOW_FILE = 'claude-code-processor.yml';

  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_FILE}/dispatches`;
  
  console.log('Dispatching to:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'claude-slack-bot/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          question: 'Test dispatch from local script',
          mcp_tools: 'slack,notionApi',
          slack_channel: 'test-channel',
          slack_ts: '1234567890.123456',
          slack_thread_ts: '',
          system_prompt: 'This is a test dispatch',
          model: '',
        },
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      console.error('GitHub API error:', response.status, responseText);
    } else {
      console.log('✅ Workflow dispatch successful!');
      console.log('Check: https://github.com/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/actions');
    }
  } catch (error) {
    console.error('Failed to dispatch workflow:', error);
  }
}

// Run the test
testGitHubDispatch();