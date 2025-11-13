import { Plugin } from 'obsidian';
import { AI_Message_Panel } from './panel/ai-message-panel';
import { TaskAISettings, DEFAULT_SETTINGS } from './settings';

export default class AutoTaskPanelWithAI extends Plugin {
	private aiMessagePanel?: AI_Message_Panel;
	
	async onload() {
		// 初始化设置
		this.settings = await this.loadData() || DEFAULT_SETTINGS;
		// 创建信息存储文件夹
		await this.createFolder('_Root/plugin/Task-AI');
		// 创建提示词文件夹
		await this.createFolder('_Root/plugin/Task-AI/prompts');
		// 创建历史消息文件夹
		await this.createFolder('_Root/plugin/Task-AI/history');
		// 创建任务集文件夹
		await this.createFolder('Task-AI 任务集');
		// 创建默认提示词文件
		await this.createDefaultPromptFile();
		
		// 初始化AI消息面板
		this.aiMessagePanel = new AI_Message_Panel(this.app);
		
		// 注册命令：打开AI消息面板
		this.addCommand({
			id: 'ai-message-panel-open',
			name: 'Open AI Message Panel',
			callback: () => {
				this.aiMessagePanel!.open();
			}
		});
		
		// 注册命令：关闭AI消息面板
		this.addCommand({
			id: 'ai-message-panel-close',
			name: 'Close AI Message Panel',
			callback: () => {
				this.aiMessagePanel!.close();
			}
		});
		
		// 注册命令：切换AI消息面板
		this.addCommand({
			id: 'ai-message-panel-toggle',
			name: 'Toggle AI Message Panel',
			callback: () => {
				this.aiMessagePanel!.toggle();
			}
		});
		
		// 其他插件初始化逻辑
	}

	onunload() {
		// 卸载AI消息面板
		if (this.aiMessagePanel) {
			this.aiMessagePanel.removePanel();
		}
		// 其他插件卸载逻辑
	}

	private async createFolder(path: string) {
		// 检查文件夹是否存在，如果不存在则创建
		if (!(await this.app.vault.adapter.exists(path))) {
			await this.app.vault.adapter.mkdir(path);
			console.log(`Created folder: ${path}`);
		}
	}

	private async createDefaultPromptFile() {
		const filePath = '_Root/plugin/Task-AI/prompts/TaskAIDefaultPrompt.md';
		// 检查文件是否存在，如果不存在则创建
		if (!(await this.app.vault.adapter.exists(filePath))) {
			// 默认提示词内容
			const defaultContent = '# Task AI 默认提示词\n\n' +
				'你是一个智能任务助手，可以帮助我分析和处理任务。\n\n' +
				'请根据我的输入，提供相关的任务建议、优先级排序或其他帮助。';
			await this.app.vault.create(filePath, defaultContent);
			console.log(`Created default prompt file: ${filePath}`);
		}
	}

	private settings: TaskAISettings = DEFAULT_SETTINGS;
}
