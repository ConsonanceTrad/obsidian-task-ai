import { App } from 'obsidian';

export class AI_Message_Panel {
	private app: App;
	private panel: HTMLElement;
	private isOpen: boolean = false;

	constructor(app: App) {
		this.app = app;
		this.panel = this.createPanel();
		this.appendPanelToDOM();
	}

	private createPanel(): HTMLElement {
		const panel = document.createElement('div');
		panel.id = 'ai-message-panel';
		panel.className = 'ai-message-panel';
		panel.style.display = 'none';

		// 创建面板头部
		const header = document.createElement('div');
		header.className = 'ai-message-panel-header';
		header.innerHTML = `<svg class="ai-message-panel-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 2L2 7l10 5 10-5-10-5z"></path>
			<path d="M2 17l10 5 10-5"></path>
			<path d="M2 12l10 5 10-5"></path>
		</svg><h3>AI 消息面板</h3><button id="ai-message-panel-close">×</button>`;

		// 创建消息容器
		const messageContainer = document.createElement('div');
		messageContainer.className = 'ai-message-container';

		// 创建输入区域
		const inputArea = document.createElement('div');
		inputArea.className = 'ai-message-input-area';
		inputArea.innerHTML = `
			<textarea id="ai-message-input" placeholder="请输入您的问题或指令..."></textarea>
			<button id="ai-message-send">发送</button>
			<button id="ai-message-copy">复制</button>
		`;

		// 组合面板内容
		panel.appendChild(header);
		panel.appendChild(messageContainer);
		panel.appendChild(inputArea);

		// 添加事件监听
		this.addEventListeners(panel);

		return panel;
	}

	private appendPanelToDOM() {
		const workspaceContainer = document.querySelector('.workspace-leaf-content');
		if (workspaceContainer) {
			workspaceContainer.appendChild(this.panel);
		}
	}

	private addEventListeners(panel: HTMLElement) {
		// 关闭按钮事件
		const closeButton = panel.querySelector('#ai-message-panel-close');
		if (closeButton) {
			closeButton.addEventListener('click', () => this.close());
		}

		// 发送按钮事件
		const sendButton = panel.querySelector('#ai-message-send');
		if (sendButton) {
			sendButton.addEventListener('click', () => this.send());
		}

		// 输入区域回车事件
		const input = panel.querySelector('#ai-message-input') as HTMLTextAreaElement;
		if (input) {
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' && e.ctrlKey) {
					this.send();
				}
			});
		}

		// 复制按钮事件
		const copyButton = panel.querySelector('#ai-message-copy');
		if (copyButton) {
			copyButton.addEventListener('click', () => this.copy());
		}
	}

	public open() {
		this.panel.style.display = 'block';
		this.isOpen = true;
	}

	public close() {
		this.panel.style.display = 'none';
		this.isOpen = false;
	}

	public toggle() {
		if (this.isOpen) {
			this.close();
		} else {
			this.open();
		}
	}

	public removePanel() {
		if (this.panel.parentNode) {
			this.panel.parentNode.removeChild(this.panel);
			console.log('AI Message Panel removed from DOM');
		}
	}

	private send() {
		// 发送消息逻辑
		const input = this.panel.querySelector('#ai-message-input') as HTMLTextAreaElement;
		const message = input.value.trim();
		if (message) {
			// 清空输入框
			input.value = '';
			// 添加用户消息到容器
			this.addMessageToContainer(message, 'user');
			// 模拟AI响应
			setTimeout(() => {
				this.addMessageToContainer('这是一个模拟的AI响应。', 'ai');
			}, 1000);
		}
	}

	private copy() {
		// 复制消息逻辑
		const messageContainer = this.panel.querySelector('.ai-message-container');
		if (messageContainer) {
			const messages = messageContainer.querySelectorAll('.ai-message');
			let text = '';
			messages.forEach(msg => {
				text += msg.textContent || '';
				text += '\n';
			});
			navigator.clipboard.writeText(text).then(() => {
				// 可以添加复制成功提示
				console.log('复制成功');
			});
		}
	}

	private addMessageToContainer(message: string, type: 'user' | 'ai') {
		const messageContainer = this.panel.querySelector('.ai-message-container');
		if (messageContainer) {
			const messageElement = document.createElement('div');
			messageElement.className = `ai-message ai-message-${type}`;
			messageElement.innerHTML = `<p>${message}</p>`;
			messageContainer.appendChild(messageElement);
			// 滚动到底部
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}
}
