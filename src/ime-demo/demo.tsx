#!/usr/bin/env node
import React, { useState } from 'react';
import { render, Text, Box, Newline } from 'ink';
import chalk from 'chalk';
import IMETextInput from './IMETextInput.js';

interface DemoState {
  currentInput: string;
  submittedTexts: string[];
  testingIME: boolean;
}

const IMEDemo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    currentInput: '',
    submittedTexts: [],
    testingIME: false
  });

  const handleInputChange = (value: string) => {
    setState(prev => ({ ...prev, currentInput: value }));
  };

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      setState(prev => ({
        ...prev,
        submittedTexts: [...prev.submittedTexts, value],
        currentInput: '',
        testingIME: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(value)
      }));
    }
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan" bold>
          🎌 IME Input Fix Demo - Claude Code Issue #1547
        </Text>
      </Box>
      <Newline />
      
      <Box>
        <Text color="green">
          ✅ This demonstrates the fix for IME input performance issues
        </Text>
      </Box>
      <Newline />
      
      <Box>
        <Text color="yellow">
          📝 Type in Japanese, Chinese, or Korean to test IME handling:
        </Text>
      </Box>
      <Newline />
      
      <Box>
        <Text color="white">Input: </Text>
        <IMETextInput
          value={state.currentInput}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          placeholder="Type here... (こんにちは, 你好, 안녕하세요)"
          focus={true}
        />
      </Box>
      <Newline />
      
      {state.submittedTexts.length > 0 && (
        <Box flexDirection="column">
          <Text color="blue" bold>
            📜 Submitted Text History:
          </Text>
          {state.submittedTexts.map((text, index) => (
            <Box key={index}>
              <Text color="gray">{index + 1}. </Text>
              <Text color="white">{text}</Text>
              {/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(text) && (
                <Text color="green"> ✅ IME</Text>
              )}
            </Box>
          ))}
        </Box>
      )}
      
      <Newline />
      <Box>
        <Text color="gray">
          💡 Key Improvements:
        </Text>
      </Box>
      <Box>
        <Text color="gray">
          • Proper IME composition handling
        </Text>
      </Box>
      <Box>
        <Text color="gray">
          • No duplicate conversion candidates
        </Text>
      </Box>
      <Box>
        <Text color="gray">
          • Smooth performance during typing
        </Text>
      </Box>
      <Box>
        <Text color="gray">
          • Correct cursor positioning
        </Text>
      </Box>
      
      <Newline />
      <Box>
        <Text color="dim">
          Press Enter to submit, Ctrl+C to exit
        </Text>
      </Box>
    </Box>
  );
};

render(<IMEDemo />);