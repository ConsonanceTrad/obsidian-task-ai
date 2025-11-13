export interface TaskAISettings {
	defaultPromptFile: string;
	// 可以在这里添加更多设置选项
}

export const DEFAULT_SETTINGS: TaskAISettings = {
	defaultPromptFile: '_Root/plugin/Task-AI/prompts/TaskAIDefaultPrompt.md'
};
