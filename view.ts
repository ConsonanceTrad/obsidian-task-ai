import { ItemView, WorkspaceLeaf, TAbstractFile, TFolder, TFile } from 'obsidian';

// 视图类型常量
export const ASK_VIEW_TYPE = 'ask-panel-view';
export const TP_VIEW_TYPE = 'tp-panel-view';
export const TPV_VIEW_TYPE = 'tpv-panel-view';
export const FILE_EXPLORER_VIEW_TYPE = 'custom-file-explorer-view';

// 文件夹配置接口
export interface FolderConfig {
  path: string;
  sortOrder: number;
  visible: boolean;
}

// ASK视图类
export class ASKView extends ItemView {
  private messagesContainer!: HTMLElement;
  private inputContainer!: HTMLElement;
  private messageInput!: HTMLTextAreaElement;
  private selectedPrompt: string = ''; // 存储选中的提示词
  
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  // 获取视图类型
  getViewType(): string {
    return ASK_VIEW_TYPE;
  }

  // 获取显示标题
  getDisplayText(): string {
    return '问询面板';
  }

  // 获取图标（使用Obsidian内置图标）
  getIcon(): string {
    return 'message-square';
  }

  // 首次打开视图时执行
  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    
    // 添加唯一的类名，便于样式控制
    container.classList.add('ask-panel-content');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    
    // 创建顶部工具栏
    const toolbar = container.createDiv({
      cls: 'ask-toolbar'
    });
    toolbar.style.display = 'flex';
    toolbar.style.justifyContent = 'flex-end';
    toolbar.style.padding = '5px 10px';
    toolbar.style.borderBottom = '1px solid #eee';
    
    // 添加清空消息按钮
    const clearButton = toolbar.createEl('button', {
      cls: 'ask-clear-button',
      text: '清空消息'
    });
    clearButton.style.padding = '4px 12px';
    clearButton.style.fontSize = '12px';
    clearButton.style.border = '1px solid #ccc';
    clearButton.style.borderRadius = '4px';
    clearButton.style.backgroundColor = '#fff';
    clearButton.style.cursor = 'pointer';
    
    // 添加点击事件
    clearButton.addEventListener('click', () => {
      this.clearMessages();
    });
    
    // 创建信息流容器（占据剩余空间）
    this.messagesContainer = container.createDiv({
      cls: 'ask-messages-container'
    });
    this.messagesContainer.style.flex = '1';
    this.messagesContainer.style.overflowY = 'auto';
    this.messagesContainer.style.display = 'flex';
    this.messagesContainer.style.flexDirection = 'column'; // 自上而下的信息流
    this.messagesContainer.style.padding = '10px';
    
    // 创建输入区域容器
    this.inputContainer = container.createDiv({
      cls: 'ask-input-container'
    });
    this.inputContainer.style.borderTop = '1px solid #ccc';
    this.inputContainer.style.padding = '10px';
    this.inputContainer.style.backgroundColor = 'transparent';
    
    // 创建输出模式设置按钮区域
    const modeContainer = this.inputContainer.createDiv({
      cls: 'ask-mode-container'
    });
    modeContainer.style.marginBottom = '8px';
    
    // 加载AI提示词文件并创建下拉框
    await this.createPromptDropdown(modeContainer);
    
    // 添加输出模式按钮（除了第一个文本模式，已替换为下拉框）
    const modeButtons = [
      { id: 'code', label: '代码', icon: 'code' },
      { id: 'task', label: '任务', icon: 'check-square' },
      { id: 'summarize', label: '总结', icon: 'list' }
    ];
    
    modeButtons.forEach(mode => {
      const button = modeContainer.createEl('button', {
        cls: 'ask-mode-button'
      }) as HTMLElement;
      button.innerHTML = `<span class="ask-mode-icon">${this.getIconSVG(mode.icon)}</span> ${mode.label}`;
      button.style.padding = '4px 12px';
      button.style.marginRight = '8px';
      button.style.border = '1px solid #ccc';
      button.style.borderRadius = '4px';
      button.style.backgroundColor = '#fff';
      button.style.cursor = 'pointer';
      button.style.fontSize = '12px';
      
      // 添加点击事件
      button.addEventListener('click', () => {
        // 移除所有按钮的选中状态
        modeContainer.querySelectorAll('.ask-mode-button').forEach(btn => {
          (btn as HTMLElement).style.backgroundColor = '#fff';
        });
        // 添加当前按钮的选中状态
        button.style.backgroundColor = '#e6f3ff';
        // 清除选中的提示词（如果有）
        this.selectedPrompt = '';
      });
    });
    
    // 为下拉框添加默认选中样式（如果需要）
    const dropdown = modeContainer.querySelector('.ask-prompt-dropdown') as HTMLSelectElement;
    if (dropdown) {
      // 可以在这里设置下拉框的默认样式
    }
    
    // 创建输入框和发送按钮的容器
    const inputRow = this.inputContainer.createDiv();
    inputRow.style.display = 'flex';
    inputRow.style.alignItems = 'flex-end';
    
    // 创建输入框
    this.messageInput = inputRow.createEl('textarea', {
      cls: 'ask-message-input'
    });
    this.messageInput.placeholder = '输入您的问题...';
    this.messageInput.style.flex = '1';
    this.messageInput.style.padding = '8px';
    this.messageInput.style.border = '1px solid #ccc';
    this.messageInput.style.borderRadius = '4px';
    this.messageInput.style.resize = 'none';
    this.messageInput.style.minHeight = '60px';
    this.messageInput.style.maxHeight = '200px';
    this.messageInput.style.fontFamily = 'inherit';
    this.messageInput.style.fontSize = '14px';
    this.messageInput.style.backgroundColor = 'transparent';
    
    // 自动调整输入框高度
    this.messageInput.addEventListener('input', () => {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
    });
    
    // 创建发送按钮
    const sendButton = inputRow.createEl('button', {
      cls: 'ask-send-button',
      text: '发送'
    });
    sendButton.style.marginLeft = '8px';
    sendButton.style.padding = '8px 20px';
    sendButton.style.backgroundColor = '#2383E2';
    sendButton.style.color = '#fff';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '4px';
    sendButton.style.cursor = 'pointer';
    sendButton.style.fontWeight = '500';
    
    // 添加发送按钮点击事件
    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // 添加回车发送（Ctrl+Enter 换行）
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }
  
  // 获取图标SVG
  private getIconSVG(iconName: string): string {
    const icons: { [key: string]: string } = {
      'align-left': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>',
      'code': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
      'check-square': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      'list': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
    };
    return icons[iconName] || '';
  }
  
  // 添加消息到信息流
  private addMessage(sender: 'user' | 'ai', content: string) {
    // 添加灰色分割线（除了第一条消息）
    if (this.messagesContainer.children.length > 0) {
      const separator = this.messagesContainer.createDiv({
        cls: 'ask-message-separator'
      });
      separator.style.height = '1px';
      separator.style.backgroundColor = '#e0e0e0';
      separator.style.margin = '12px 0';
    }
    
    // 创建消息内容容器
    const messageContent = this.messagesContainer.createDiv({
      cls: `ask-message-content ask-message-${sender}`
    });
    messageContent.style.padding = '12px';
    messageContent.style.backgroundColor = sender === 'user' ? '#e6f3ff' : '#f8f9fa';
    messageContent.style.wordBreak = 'break-word';
    messageContent.style.lineHeight = '1.5';
    
    // 设置内容
    messageContent.textContent = content;
    
    // 自动滚动到底部（最新消息）
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
  
  // 发送消息
  private sendMessage() {
    let content = this.messageInput.value.trim();
    if (content) {
      // 如果选择了提示词，将提示词添加到消息前面
      if (this.selectedPrompt) {
        content = `${this.selectedPrompt}\n\n${content}`;
      }
      // 添加用户消息
      this.addMessage('user', content);
      
      // 清空输入框
      this.messageInput.value = '';
      this.messageInput.style.height = 'auto';
      
      // 添加AI回复（模拟延迟）
      setTimeout(() => {
        const replies = [
          '我理解您的问题了，让我思考一下...',
          '这个问题很有深度，我需要分析一下。',
          '根据您的问题，我可以提供以下信息...',
          '好的，我来帮您解答这个问题。'
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        this.addMessage('ai', randomReply);
      }, 500);
    }
  }

  // 清空所有消息
  private async createPromptDropdown(container: HTMLElement) {
    const dropdownWrapper = container.createDiv();
    dropdownWrapper.style.display = 'inline-block';
    dropdownWrapper.style.marginRight = '8px';
    
    // 创建下拉选择框
    const dropdown = dropdownWrapper.createEl('select', {
      cls: 'ask-prompt-dropdown'
    }) as HTMLSelectElement;
    dropdown.style.padding = '4px 12px';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.borderRadius = '4px';
    dropdown.style.backgroundColor = '#fff';
    dropdown.style.cursor = 'pointer';
    dropdown.style.fontSize = '12px';
    
    // 添加默认选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '选择提示词';
    dropdown.appendChild(defaultOption);
    
    // 尝试加载AI提示词文件夹中的md文件
    try {
      const promptFolderPath = 'AI提示词';
      console.log('尝试查找提示词文件夹:', promptFolderPath);
      
      const promptFolder = this.app.vault.getAbstractFileByPath(promptFolderPath);
      
      if (promptFolder && promptFolder instanceof TFolder) {
        console.log('找到提示词文件夹:', promptFolder.name);
        
        // 改进文件获取方式，直接获取文件夹中的文件
        const filesInFolder = await this.app.vault.getFiles();
        console.log('找到所有文件数量:', filesInFolder.length);
        
        // 精确过滤AI提示词文件夹中的md文件
        const promptFiles = filesInFolder.filter(file => {
          // 使用正则表达式确保是直接在AI提示词文件夹下的md文件
          return file.extension === 'md' && 
                 file.parent && 
                 file.parent.name === 'AI提示词';
        });
        
        console.log('找到提示词文件数量:', promptFiles.length);
        
        // 添加每个提示词文件作为选项
        if (promptFiles.length > 0) {
          for (const file of promptFiles) {
            console.log('添加提示词文件:', file.name, file.path);
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = file.basename; // 使用文件名作为显示文本
            dropdown.appendChild(option);
          }
        } else {
          // 添加一个提示选项，说明没有找到提示词文件
          const noFilesOption = document.createElement('option');
          noFilesOption.value = '';
          noFilesOption.textContent = '无提示词文件';
          noFilesOption.disabled = true;
          dropdown.appendChild(noFilesOption);
        }
      } else {
        console.log('未找到AI提示词文件夹');
        // 添加一个提示选项，说明未找到文件夹
        const noFolderOption = document.createElement('option');
        noFolderOption.value = '';
        noFolderOption.textContent = '未找到提示词文件夹';
        noFolderOption.disabled = true;
        dropdown.appendChild(noFolderOption);
      }
    } catch (error) {
      console.error('加载AI提示词文件时出错:', error);
      // 添加错误提示选项
      const errorOption = document.createElement('option');
      errorOption.value = '';
      errorOption.textContent = '加载出错';
      errorOption.disabled = true;
      dropdown.appendChild(errorOption);
    }
    
    // 添加选择事件监听器
    dropdown.addEventListener('change', async () => {
      if (dropdown.value) {
        try {
          console.log('尝试读取提示词文件:', dropdown.value);
          // 获取文件对象
          const file = this.app.vault.getAbstractFileByPath(dropdown.value);
          
          if (file && file instanceof TFile) {
            // 读取选中的提示词文件内容
            this.selectedPrompt = await this.app.vault.read(file);
            console.log('成功读取提示词，内容长度:', this.selectedPrompt.length, '字符');
          } else {
            console.error('文件不存在或不是TFile类型:', dropdown.value);
            this.selectedPrompt = '';
          }
        } catch (error) {
          console.error('读取提示词文件时出错:', error);
          this.selectedPrompt = '';
        }
      } else {
        this.selectedPrompt = '';
        console.log('已清除提示词选择');
      }
    });
  }

  private clearMessages() {
    // 清空消息容器
    this.messagesContainer.empty();
  }
  
  // 关闭视图时执行
  async onClose() {
    // 清理资源
  }
}

// TPV视图类 - 在主窗格渲染
export class TPVView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  // 获取视图类型
  getViewType(): string {
    return TPV_VIEW_TYPE;
  }

  // 获取显示标题
  getDisplayText(): string {
    return '任务阅览器';
  }

  // 获取图标（使用Obsidian内置图标）
  getIcon(): string {
    return 'box'; // 使用box图标表示任务阅览器
  }

  // 首次打开视图时执行
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    
    // 创建任务阅览器的内容
    container.createEl('h2', { text: '任务阅览器' });
    container.createEl('p', { text: '这是任务阅览器的初始内容，后续功能将在这里实现。' });
    
    // 添加唯一的类名，便于样式控制
    container.classList.add('tpv-panel-content');
  }

  // 关闭视图时执行
  async onClose() {
    // 清理资源
  }
}

// TP视图类 - 在主窗格渲染
export class TPView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  // 获取视图类型
  getViewType(): string {
    return TP_VIEW_TYPE;
  }

  // 获取显示标题
  getDisplayText(): string {
    return '任务编辑器';
  }

  // 获取图标（使用Obsidian内置图标）
  getIcon(): string {
    return 'layout';
  }

  // 首次打开视图时执行
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    
    // 创建任务编辑器的内容
    container.createEl('h2', { text: '任务编辑器' });
    container.createEl('p', { text: '这是任务编辑器的初始内容，后续功能将在这里实现。' });
    
    // 添加唯一的类名，便于样式控制
    container.classList.add('tp-panel-content');
  }

  // 关闭视图时执行
  async onClose() {
    // 清理资源
  }
}

// 自定义文件浏览器视图类
export class FileExplorerView extends ItemView {
  private folderConfigs: { [key: string]: FolderConfig } = {};
  private sortedFolders: TFolder[] = [];

  constructor(leaf: WorkspaceLeaf, folderConfigs?: { [key: string]: FolderConfig }) {
    super(leaf);
    if (folderConfigs) {
      this.folderConfigs = folderConfigs;
    }
  }

  // 获取视图类型
  getViewType(): string {
    return FILE_EXPLORER_VIEW_TYPE;
  }

  // 获取显示标题
  getDisplayText(): string {
    return '文件浏览器';
  }

  // 获取图标（使用Obsidian内置图标）
  getIcon(): string {
    return 'folder-open';
  }

  // 更新文件夹配置
  updateFolderConfigs(configs: { [key: string]: FolderConfig }) {
    this.folderConfigs = configs;
    this.render();
  }

  // 首次打开视图时执行
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    
    // 添加唯一的类名，便于样式控制
    container.classList.add('custom-file-explorer-content');
    
    // 监听文件变更
    this.registerEvent(
      this.app.vault.on('create', () => this.render())
    );
    this.registerEvent(
      this.app.vault.on('delete', () => this.render())
    );
    this.registerEvent(
      this.app.vault.on('rename', () => this.render())
    );
    
    // 初始渲染
    this.render();
  }

  // 渲染文件浏览器内容
  render() {
    const container = this.containerEl.children[1];
    container.empty();
    
    // 添加快捷按钮区域
    const shortcutContainer = container.createDiv({
      cls: 'custom-shortcut-container'
    });
    shortcutContainer.style.height = '40px';
    shortcutContainer.style.backgroundColor = 'transparent'; // 透明背景
    shortcutContainer.style.borderBottom = '1px solid #ccc'; // 底部实线分隔
    shortcutContainer.style.display = 'flex';
    shortcutContainer.style.alignItems = 'center';
    shortcutContainer.style.padding = '0 8px';
    
    // 获取根文件夹
    const root = this.app.vault.getRoot();
    if (root instanceof TFolder) {
      // 只收集根文件夹中的子文件夹，过滤掉其他内容
      const rootSubfolders = root.children.filter(child => child instanceof TFolder) as TFolder[];
      // 按配置排序根层级文件夹
      this.sortedFolders = this.sortFoldersByConfig(rootSubfolders);
      
      // 渲染排序后的文件夹
      this.renderFolderList(container as HTMLElement);
    }
  }

  // 根据配置对文件夹进行排序
  sortFoldersByConfig(folders: TFolder[]): TFolder[] {
    // 过滤掉隐藏的文件夹
    const visibleFolders = folders.filter(folder => {
      const config = this.folderConfigs[folder.path];
      return config ? config.visible : true; // 默认显示
    });
    
    // 按配置的排序顺序排序
    return visibleFolders.sort((a, b) => {
      const orderA = this.folderConfigs[a.path]?.sortOrder || 999;
      const orderB = this.folderConfigs[b.path]?.sortOrder || 999;
      return orderA - orderB;
    });
  }

  // 渲染文件夹列表
  renderFolderList(container: HTMLElement) {
    const folderList = container.createDiv({
      cls: 'custom-folder-list'
    });
    
    this.sortedFolders.forEach(folder => {
      // 创建文件夹项
      const folderItem = folderList.createDiv({
        cls: 'custom-folder-item',
      });
      
      // 为文件夹添加图标（根据展开/收起状态显示不同图标）
      const icon = folderItem.createSpan({
        cls: 'custom-folder-icon'
      });
      // 关闭状态的文件夹图标
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 20h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 0-1.66.89l-.82 1.2A2 2 0 0 0 2 10v8a2 2 0 0 0 2 2h6z"></path></svg>';
      icon.style.marginRight = '8px';
      
      // 文件夹名称
      const nameSpan = folderItem.createSpan({
        cls: 'folder-name',
        text: folder.name
      });
      
      // 设置文件夹样式
      folderItem.style.cursor = 'pointer';
      folderItem.style.padding = '5px 8px';
      folderItem.style.borderRadius = '4px';
      folderItem.style.display = 'flex';
      folderItem.style.alignItems = 'center';
      folderItem.style.fontWeight = '500'; // 文件夹名称加粗以区分
      folderItem.style.color = '#444444'; // 文件夹使用灰黑色以区分
      
      // 为文件夹添加点击事件
      folderItem.addEventListener('click', () => {
        this.toggleFolder(folderItem, folder);
      });
      
      // 添加悬停效果
      folderItem.addEventListener('mouseenter', () => {
        folderItem.style.backgroundColor = 'rgba(68, 68, 68, 0.1)'; // 灰黑色悬停效果
      });
      
      folderItem.addEventListener('mouseleave', () => {
        folderItem.style.backgroundColor = 'transparent';
      });
    });
  }

  // 切换文件夹展开/收起状态
  toggleFolder(folderItem: HTMLDivElement, folder: TFolder) {
    // 检查是否已经展开
    const existingContentDiv = folderItem.nextElementSibling as HTMLDivElement;
    if (existingContentDiv && existingContentDiv.classList.contains('custom-folder-content')) {
      // 如果已经展开，则收起
      existingContentDiv.remove();
      
      // 更新文件夹图标为关闭状态
      const icon = folderItem.querySelector('.custom-folder-icon');
      if (icon) {
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 20h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 0-1.66.89l-.82 1.2A2 2 0 0 0 2 10v8a2 2 0 0 0 2 2h6z"></path></svg>';
      }
      
      folderItem.classList.remove('expanded');
      return;
    }
    
    // 展开文件夹内容
    const contentDiv = document.createElement('div');
    contentDiv.className = 'custom-folder-content';
    contentDiv.style.marginLeft = '12px'; // 减小缩进长度
    contentDiv.style.borderLeft = '1px solid rgba(0, 0, 0, 0.2)'; // 深色边框增强视觉层次
    contentDiv.style.paddingLeft = '8px'; // 减小缩进长度
    contentDiv.style.paddingTop = '4px';
    contentDiv.style.paddingBottom = '4px';
    
    // 将contentDiv插入到folderItem的下一个兄弟元素之前
    if (folderItem.nextSibling) {
      folderItem.parentElement?.insertBefore(contentDiv, folderItem.nextSibling);
    } else {
      folderItem.parentElement?.appendChild(contentDiv);
    }
    
    // 渲染文件夹中的文件和子文件夹
    this.renderFolderContent(contentDiv, folder);
    
    // 更新文件夹图标为展开状态
    const icon = folderItem.querySelector('.custom-folder-icon');
    if (icon) {
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h20v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z"></path><path d="M4 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path></svg>';
    }
    
    folderItem.classList.add('expanded');
  }

  // 渲染文件夹内容
  renderFolderContent(container: HTMLElement, folder: TFolder) {
    // 先显示子文件夹（子文件夹不受可见性设置影响）
    const subfolders = folder.children.filter(child => 
      child instanceof TFolder
    ) as TFolder[];
    
    // 按名称排序子文件夹
    subfolders.sort((a, b) => a.name.localeCompare(b.name));
    
    // 渲染子文件夹
    subfolders.forEach(subfolder => {
      const subfolderItem = container.createDiv({
        cls: 'custom-subfolder-item',
      });
      
      // 为子文件夹添加图标（关闭状态）
      const icon = subfolderItem.createSpan({
        cls: 'custom-folder-icon'
      });
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 20h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 0-1.66.89l-.82 1.2A2 2 0 0 0 2 10v8a2 2 0 0 0 2 2h6z"></path></svg>';
      icon.style.marginRight = '6px';
      
      // 子文件夹名称
      const nameSpan = subfolderItem.createSpan({
        cls: 'folder-name',
        text: subfolder.name
      });
      
      // 设置子文件夹样式
      subfolderItem.style.cursor = 'pointer';
      subfolderItem.style.padding = '4px 6px';
      subfolderItem.style.borderRadius = '4px';
      subfolderItem.style.display = 'flex';
      subfolderItem.style.alignItems = 'center';
      subfolderItem.style.fontWeight = '500'; // 文件夹名称加粗以区分
      subfolderItem.style.color = '#444444'; // 文件夹使用灰黑色以区分
      
      // 为子文件夹添加点击事件
      subfolderItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFolder(subfolderItem, subfolder);
      });
      
      // 添加悬停效果
      subfolderItem.addEventListener('mouseenter', () => {
        subfolderItem.style.backgroundColor = 'rgba(68, 68, 68, 0.1)'; // 灰黑色悬停效果
      });
      
      subfolderItem.addEventListener('mouseleave', () => {
        subfolderItem.style.backgroundColor = 'transparent';
      });
    });
    
    // 然后显示文件，过滤掉根层级的Markdown文件
    const files = folder.children.filter(child => 
      child instanceof TFile && 
      (!this.folderConfigs[child.path] || this.folderConfigs[child.path].visible) &&
      // 检查是否是根层级的Markdown文件
      !(folder.isRoot() && child.name.endsWith('.md'))
    ) as TFile[];
    
    // 按名称排序文件
    files.sort((a, b) => a.name.localeCompare(b.name));
    
    // 添加分隔线以区分文件夹和文件（如果两者都存在）
    if (subfolders.length > 0 && files.length > 0) {
      const separator = container.createDiv({
        cls: 'folder-content-separator'
      });
      separator.style.height = '1px';
      separator.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      separator.style.margin = '4px 0';
      separator.style.width = '100%';
    }
    
    // 渲染文件
    files.forEach(file => {
      const fileItem = container.createDiv({
        cls: 'custom-file-item',
      });
      
      // 空白占位符，与文件夹保持对齐
      const placeholder = fileItem.createSpan({
        cls: 'file-placeholder'
      });
      placeholder.style.width = '12px';
      placeholder.style.display = 'inline-block';
      placeholder.style.marginRight = '6px';
      
      // 根据文件类型选择不同的图标
      const icon = fileItem.createSpan({
        cls: 'custom-file-icon'
      });
      
      // 根据文件扩展名显示不同图标或颜色
      if (file.name.endsWith('.md')) {
        // Markdown 文件使用特殊图标
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        // Markdown 文件使用不同颜色以区分
        fileItem.style.color = '#2a9d8f';
      } else {
        // 其他文件类型的图标
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
      }
      
      icon.style.marginRight = '6px';
      
      // 文件名
      const nameSpan = fileItem.createSpan({
        cls: 'file-name',
        text: file.name
      });
      
      // 设置文件样式
      fileItem.style.cursor = 'pointer';
      fileItem.style.padding = '4px 6px';
      fileItem.style.borderRadius = '4px';
      fileItem.style.display = 'flex';
      fileItem.style.alignItems = 'center';
      fileItem.style.marginLeft = '0px';
      
      fileItem.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 检查文件是否已经在某个窗格中打开
        const leaves = this.app.workspace.getLeavesOfType('markdown');
        const existingLeaf = leaves.find(leaf => {
          const view = leaf.view;
          // 使用更安全的类型检查方式
          const fileView = view as { file?: { path: string } };
          return fileView && fileView.file && fileView.file.path === file.path;
        });
        
        if (existingLeaf) {
          // 如果文件已打开，跳转到对应的窗格
          this.app.workspace.setActiveLeaf(existingLeaf);
        } else {
          // 如果文件未打开，创建新的窗格打开文件
          this.app.workspace.openLinkText(file.path, '', true);
        }
      });
      
      fileItem.addEventListener('mouseenter', () => {
        fileItem.style.backgroundColor = 'rgba(42, 157, 143, 0.1)'; // 文件悬停效果
      });
      
      fileItem.addEventListener('mouseleave', () => {
        fileItem.style.backgroundColor = 'transparent';
      });
    });
  }

  // 关闭视图时执行
  async onClose() {
    // 清理资源
  }
}
