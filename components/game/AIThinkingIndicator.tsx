/**
 * AI Thinking Indicator Component
 *
 * Shows animated indicator when AI is calculating its move.
 */

'use client';

interface AIThinkingIndicatorProps {
  aiName: string;
}

export function AIThinkingIndicator({ aiName }: AIThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-300 dark:border-blue-700">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
        {aiName} is thinking...
      </span>
    </div>
  );
}