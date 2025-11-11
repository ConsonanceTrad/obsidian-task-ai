import { App, Plugin, PluginSettingTab, Setting, normalizePath, Notice, TFile, WorkspaceLeaf, ItemView, ViewStateResult } from 'obsidian';

// 设置接口定义
interface AutoTaskPanelWithAISettings {
  dataFolderPath: string;
  promptsFolderPath: string;
  defaultPromptFilePath: string;
  logTemplateFilePath: string;
  tpPanelEnabled: boolean;
  tpvPanelEnabled: boolean;
}

// 默认设置
const DEFAULT_SETTINGS: AutoTaskPanelWithAISettings = {
  dataFolderPath: '_Root/PluginSettings/AutoTaskPanel',
  promptsFolderPath: '_Root/PluginSettings/AutoTaskPanel/prompts',
  defaultPromptFilePath: '_Root/PluginSettings/AutoTaskPanel/prompts/DefaultPrompt.md',
  logTemplateFilePath: '_Root/PluginSettings/AutoTaskPanel/diarySettings.md',
  tpPanelEnabled: true,
  tpvPanelEnabled: true
};

// 面板视图类型
const TASK_EDITOR_VIEW_TYPE = 'auto-task-editor';
const TASK_VIEWER_VIEW_TYPE = 'auto-task-viewer';

// 默认提示词内容
const DEFAULT_PROMPT_CONTENT = `# 默认提示词

这个提示词用于AI辅助任务管理。您可以自定义此文件以满足您的需求。

## 提示词内容
- 分析任务的优先级和紧急程度
- 提供任务的分类建议
- 帮助制定任务的执行计划
- 分析任务之间的依赖关系
- 估算任务的完成时间
`;

// 默认日志模板内容
const DEFAULT_LOG_TEMPLATE_CONTENT = "# 任务面板日志设置\n\n" +
"## 日志记录配置\n" +
"- 记录任务创建和完成事件\n" +
"- 跟踪任务优先级变化\n" +
"- 监控任务分类调整\n" +
"- 记录面板使用统计\n\n" +
"## 日志格式\n" +
"```\n" +
"日期: {date}\n" +
"时间: {time}\n" +
"事件类型: {eventType}\n" +
"任务ID: {taskId}\n" +
"描述: {description}\n" +
"详情: {details}\n" +
"```\n\n" +
"## 相关设置\n" +
"- 日志级别: 详细\n" +
"- 自动清理: 30天\n" +
"- 通知设置: 开启\n";

// 任务编辑器视图类
export class TaskEditorView extends ItemView {
  plugin: AutoTaskPanelWithAI;

  constructor(leaf: WorkspaceLeaf, plugin: AutoTaskPanelWithAI) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return TASK_EDITOR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return '任务编辑器';
  }

  getIcon(): string {
    return 'check-square';
  }

  async onOpen() {
    const { containerEl } = this;
    containerEl.empty();
    
    const panel = containerEl.createEl('div', { cls: 'auto-task-editor' });
    
    // 面板头部
    const header = panel.createEl('div', { cls: 'auto-task-editor-header' });
    header.createEl('h3', { cls: 'auto-task-editor-title', text: '任务编辑器' });
    
    // 关闭按钮
    const closeBtn = header.createEl('div', { cls: 'auto-task-editor-close-btn' });
    closeBtn.createEl('span', { text: '×' });
    closeBtn.addEventListener('click', () => {
      this.leaf.detach();
      this.plugin.settings.tpPanelEnabled = false;
      this.plugin.saveSettings();
    });
    
    // 面板内容
    const content = panel.createEl('div', { cls: 'auto-task-editor-content' });
    content.createEl('p', { text: '任务编辑器 - 用于管理和显示任务列表。' });
    content.createEl('p', { text: '此面板将在未来版本中添加更多功能。' });
  }

  async onClose() {
    // 清理资源
  }
}

// 任务阅览器视图类
export class TaskViewerView extends ItemView {
  plugin: AutoTaskPanelWithAI;

  constructor(leaf: WorkspaceLeaf, plugin: AutoTaskPanelWithAI) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return TASK_VIEWER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return '任务阅览器';
  }

  getIcon(): string {
    return 'eye';
  }

  async onOpen() {
    const { containerEl } = this;
    containerEl.empty();
    
    const panel = containerEl.createEl('div', { cls: 'auto-task-viewer' });
    
    // 面板头部
    const header = panel.createEl('div', { cls: 'auto-task-viewer-header' });
    header.createEl('h3', { cls: 'auto-task-viewer-title', text: '任务阅览器' });
    
    // 关闭按钮
    const closeBtn = header.createEl('div', { cls: 'auto-task-viewer-close-btn' });
    closeBtn.createEl('span', { text: '×' });
    closeBtn.addEventListener('click', () => {
      this.leaf.detach();
      this.plugin.settings.tpvPanelEnabled = false;
      this.plugin.saveSettings();
    });
    
    // 面板内容
    const content = panel.createEl('div', { cls: 'auto-task-viewer-content' });
    content.createEl('p', { text: '任务阅览器 - 用于预览任务详情。' });
    content.createEl('p', { text: '此面板将在未来版本中添加更多功能。' });
  }

  async onClose() {
    // 清理资源
  }
}

export default class AutoTaskPanelWithAI extends Plugin {
  settings: AutoTaskPanelWithAISettings = DEFAULT_SETTINGS;

  async onload() {
    // 加载设置
    await this.loadSettings();
    
    // 样式将通过manifest.json中的设置自动加载
    
    // 注册视图
    this.registerView(TASK_EDITOR_VIEW_TYPE, (leaf) => new TaskEditorView(leaf, this));
    this.registerView(TASK_VIEWER_VIEW_TYPE, (leaf) => new TaskViewerView(leaf, this));
    
    // 添加命令 - 打开任务编辑器
    this.addCommand({
      id: 'open-task-editor',
      name: '打开任务编辑器',
      callback: () => this.ensurePanelVisible(TASK_EDITOR_VIEW_TYPE),
      hotkeys: [
        { modifiers: ['Ctrl', 'Alt'], key: 't' }
      ]
    });
    
    // 添加命令 - 打开任务阅览器
    this.addCommand({
      id: 'open-task-viewer',
      name: '打开任务阅览器',
      callback: () => this.ensurePanelVisible(TASK_VIEWER_VIEW_TYPE),
      hotkeys: [
        { modifiers: ['Ctrl', 'Alt', 'Shift'], key: 't' }
      ]
    });
    
    // 添加功能区按钮 - 打开任务编辑器
    this.addRibbonIcon('check-square', '打开任务编辑器', () => {
      this.ensurePanelVisible(TASK_EDITOR_VIEW_TYPE);
    });
    
    // 添加功能区按钮 - 打开任务阅览器
    this.addRibbonIcon('eye', '打开任务阅览器', () => {
      this.ensurePanelVisible(TASK_VIEWER_VIEW_TYPE);
    });
    
    // 添加多选项卡设置界面
    this.addSettingTab(new AutoTaskPanelWithAISettingsTab(this.app, this));

    // 当Obsidian布局完全准备好后再创建文件，确保Obsidian能正确读取文件
    this.app.workspace.onLayoutReady(async () => {
      await this.ensureFoldersAndFilesExist();
      
      // 如果启用了面板，默认打开它们
    if (this.settings.tpPanelEnabled) {
      await this.ensurePanelVisible(TASK_EDITOR_VIEW_TYPE);
    }
    if (this.settings.tpvPanelEnabled) {
      await this.ensurePanelVisible(TASK_VIEWER_VIEW_TYPE);
    }
    });

    this.log('插件已加载');
  }

  async onunload() {
    this.log('插件已卸载');
  }

  // 加载设置
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  // 保存设置
  async saveSettings() {
    await this.saveData(this.settings);
  }

  // 确保必要的文件夹和文件存在
  async ensureFoldersAndFilesExist() {
    try {
      let createdItems = [];
      
      // 创建数据存储文件夹
      const dataFolder = normalizePath(this.settings.dataFolderPath);
      const dataFolderExists = await this.app.vault.adapter.exists(dataFolder);
      if (!dataFolderExists) {
        await this.app.vault.createFolder(dataFolder).catch(() => {});
        if (await this.app.vault.adapter.exists(dataFolder)) {
          createdItems.push(`数据文件夹: ${dataFolder}`);
        }
      }

      // 创建提示词文件夹
      const promptsFolder = normalizePath(this.settings.promptsFolderPath);
      const promptsFolderExists = await this.app.vault.adapter.exists(promptsFolder);
      if (!promptsFolderExists) {
        await this.app.vault.createFolder(promptsFolder).catch(() => {});
        if (await this.app.vault.adapter.exists(promptsFolder)) {
          createdItems.push(`提示词文件夹: ${promptsFolder}`);
        }
      }

      // 创建默认提示词文件
      const defaultPromptFile = normalizePath(this.settings.defaultPromptFilePath);
      const fileExists = await this.app.vault.adapter.exists(defaultPromptFile);
      
      if (!fileExists) {
        await this.app.vault.create(defaultPromptFile, DEFAULT_PROMPT_CONTENT);
        this.log('已创建默认提示词文件');
        createdItems.push(`默认提示词文件: ${defaultPromptFile}`);
      }
      
      // 创建日志模板文件
      const logTemplateFile = normalizePath(this.settings.logTemplateFilePath);
      const logTemplateExists = await this.app.vault.adapter.exists(logTemplateFile);
      
      if (!logTemplateExists) {
        // 确保日志模板文件的父文件夹存在
        const logTemplateDir = logTemplateFile.substring(0, logTemplateFile.lastIndexOf('/'));
        if (logTemplateDir && logTemplateDir !== logTemplateFile) {
          const dirExists = await this.app.vault.adapter.exists(logTemplateDir);
          if (!dirExists) {
            await this.app.vault.createFolder(logTemplateDir).catch(() => {});
          }
        }
        
        await this.app.vault.create(logTemplateFile, DEFAULT_LOG_TEMPLATE_CONTENT);
        this.log('已创建日志模板文件');
        createdItems.push(`日志模板文件: ${logTemplateFile}`);
      }

      // 如果有新创建的项目，显示提示信息
      if (createdItems.length > 0) {
        new Notice(`已创建以下项目:\n${createdItems.join('\n')}`, 2000); // 2秒后消失
      }

      this.log('文件夹和文件检查完成');
    } catch (error) {
      this.logError('创建文件夹或文件时出错:', error);
      new Notice('创建必要的文件夹或文件时出错');
    }
  }

  // 确保面板可见
  private async ensurePanelVisible(viewType: string): Promise<void> {
    // 检查是否已经有该类型的视图
    let leaf: WorkspaceLeaf | null = null;
    for (const l of this.app.workspace.getLeavesOfType(viewType)) {
      leaf = l;
      break;
    }

    // 如果没有找到现有视图，创建新的叶子
    if (!leaf) {
      leaf = this.app.workspace.getLeaf();
      await leaf.setViewState({
        type: viewType,
      });
    }

    // 确保叶子在主窗格中可见
    this.app.workspace.revealLeaf(leaf);
    
    // 更新设置
    if (viewType === TASK_EDITOR_VIEW_TYPE) {
      this.settings.tpPanelEnabled = true;
    } else if (viewType === TASK_VIEWER_VIEW_TYPE) {
      this.settings.tpvPanelEnabled = true;
    }
    await this.saveSettings();
  }

  // 日志方法
  private log(...args: any[]) {
    console.log('[Auto Task Panel With AI]', ...args);
  }

  private logError(...args: any[]) {
    console.error('[Auto Task Panel With AI]', ...args);
  }
}

// 设置选项卡类 - 多选项卡设置界面
class AutoTaskPanelWithAISettingsTab extends PluginSettingTab {
  plugin: AutoTaskPanelWithAI;
  activeTab: string = 'fileSettings'; // 默认激活文件设置选项卡

  constructor(app: App, plugin: AutoTaskPanelWithAI) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Auto Task Panel With AI 设置' });
    
    // 创建选项卡导航
    this.createTabs(containerEl);
    
    // 根据当前活动选项卡显示内容
    const contentContainer = containerEl.createEl('div');
    contentContainer.style.paddingTop = '20px';
    
    if (this.activeTab === 'fileSettings') {
      this.displayFileSettings(contentContainer);
    } else if (this.activeTab === 'autoStart') {
      this.displayAutoStartTab(contentContainer);
    } else if (this.activeTab === 'about') {
      this.displayAboutTab(contentContainer);
    }
  }

  // 创建选项卡导航
  private createTabs(container: HTMLElement): void {
    const tabContainer = container.createEl('div');
    tabContainer.style.display = 'flex';
    tabContainer.style.borderBottom = '1px solid var(--background-modifier-border)';
    
    // 文件设置选项卡
    const fileTab = tabContainer.createEl('button', {
      text: '文件设置',
      cls: ['clickable-icon']
    });
    fileTab.style.padding = '8px 16px';
    fileTab.style.border = 'none';
    fileTab.style.background = 'none';
    fileTab.style.cursor = 'pointer';
    fileTab.style.fontWeight = this.activeTab === 'fileSettings' ? 'bold' : 'normal';
    fileTab.style.borderBottom = this.activeTab === 'fileSettings' ? '2px solid var(--interactive-accent)' : 'none';
    fileTab.addEventListener('click', () => {
      this.activeTab = 'fileSettings';
      this.display();
    });
    
    // 自动启动选项卡
    const autoStartTab = tabContainer.createEl('button', {
      text: '自动启动',
      cls: ['clickable-icon']
    });
    autoStartTab.style.padding = '8px 16px';
    autoStartTab.style.border = 'none';
    autoStartTab.style.background = 'none';
    autoStartTab.style.cursor = 'pointer';
    autoStartTab.style.fontWeight = this.activeTab === 'autoStart' ? 'bold' : 'normal';
    autoStartTab.style.borderBottom = this.activeTab === 'autoStart' ? '2px solid var(--interactive-accent)' : 'none';
    autoStartTab.addEventListener('click', () => {
      this.activeTab = 'autoStart';
      this.display();
    });
    
    // 关于选项卡
    const aboutTab = tabContainer.createEl('button', {
      text: '关于',
      cls: ['clickable-icon']
    });
    aboutTab.style.padding = '8px 16px';
    aboutTab.style.border = 'none';
    aboutTab.style.background = 'none';
    aboutTab.style.cursor = 'pointer';
    aboutTab.style.fontWeight = this.activeTab === 'about' ? 'bold' : 'normal';
    aboutTab.style.borderBottom = this.activeTab === 'about' ? '2px solid var(--interactive-accent)' : 'none';
    aboutTab.addEventListener('click', () => {
      this.activeTab = 'about';
      this.display();
    });
  }
  
  // 显示自动启动选项卡
  private displayAutoStartTab(container: HTMLElement): void {
    container.createEl('h3', { text: '自动启动设置' });
    
    // 面板启用设置
    new Setting(container)
      .setName('自动启用任务编辑器')
      .setDesc('在插件启动时自动打开任务编辑器')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.tpPanelEnabled)
        .onChange(async (value) => {
          this.plugin.settings.tpPanelEnabled = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(container)
      .setName('自动启用任务阅览器')
      .setDesc('在插件启动时自动打开任务阅览器')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.tpvPanelEnabled)
        .onChange(async (value) => {
          this.plugin.settings.tpvPanelEnabled = value;
          await this.plugin.saveSettings();
        }));
  }

  // 显示文件设置选项卡
  private displayFileSettings(container: HTMLElement): void {
    container.createEl('h3', { text: '文件和文件夹路径设置' });
    
    // 添加分隔线
    container.createEl('div', { cls: 'setting-item-divider' });
    
    // 数据文件夹路径设置
    new Setting(container)
      .setName('数据存储文件夹路径')
      .setDesc('插件存储数据的文件夹路径')
      .addButton(button => {
        const btn = button
          .setTooltip('重置为默认路径')
          .setIcon('refresh-cw')
          .onClick(async () => {
            this.plugin.settings.dataFolderPath = DEFAULT_SETTINGS.dataFolderPath;
            await this.plugin.saveSettings();
            this.display(); // 刷新设置界面以显示更改
          });
        // 设置tooltip延迟时间为100毫秒
        if (btn.buttonEl) {
          (btn.buttonEl as any).tooltipOptions = { delay: 100 };
        }
        return btn;
      })
      .addText(text => {
        text
          .setValue(this.plugin.settings.dataFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.dataFolderPath = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.style.width = '500px'; // 增加输入框宽度
        return text;
      })

    // 提示词文件夹路径设置
    new Setting(container)
      .setName('提示词文件夹路径')
      .setDesc('存储提示词文件的文件夹路径')
      .addButton(button => {
        const btn = button
          .setTooltip('重置为默认路径')
          .setIcon('refresh-cw')
          .onClick(async () => {
            this.plugin.settings.promptsFolderPath = DEFAULT_SETTINGS.promptsFolderPath;
            await this.plugin.saveSettings();
            this.display(); // 刷新设置界面以显示更改
          });
        // 设置tooltip延迟时间为100毫秒
        if (btn.buttonEl) {
          (btn.buttonEl as any).tooltipOptions = { delay: 100 };
        }
        return btn;
      })
      .addText(text => {
        text
          .setValue(this.plugin.settings.promptsFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.logTemplateFilePath = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.style.width = '500px'; // 增加输入框宽度
        return text;
      });
      
    // 日志模板文件路径设置
    new Setting(container)
      .setName('日志模板文件路径')
      .setDesc('用于日志记录的模板文件路径')
      .addButton(button => {
        const btn = button
          .setTooltip('重置为默认路径')
          .setIcon('refresh-cw')
          .onClick(async () => {
            this.plugin.settings.logTemplateFilePath = DEFAULT_SETTINGS.logTemplateFilePath;
            await this.plugin.saveSettings();
            this.display(); // 刷新设置界面以显示更改
          });
        // 设置tooltip延迟时间为100毫秒
        if (btn.buttonEl) {
          (btn.buttonEl as any).tooltipOptions = { delay: 100 };
        }
        return btn;
      })
      .addText(text => {
        text
          .setValue(this.plugin.settings.logTemplateFilePath)
          .onChange(async (value) => {
            this.plugin.settings.promptsFolderPath = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.style.width = '500px'; // 增加输入框宽度
        return text;
      })

    // 默认提示词文件路径设置
    new Setting(container)
      .setName('默认提示词文件路径')
      .setDesc('默认提示词文件的路径')
      .addButton(button => {
        const btn = button
          .setTooltip('重置为默认路径')
          .setIcon('refresh-cw')
          .onClick(async () => {
            this.plugin.settings.defaultPromptFilePath = DEFAULT_SETTINGS.defaultPromptFilePath;
            await this.plugin.saveSettings();
            this.display(); // 刷新设置界面以显示更改
          });
        // 设置tooltip延迟时间为100毫秒
        if (btn.buttonEl) {
          (btn.buttonEl as any).tooltipOptions = { delay: 100 };
        }
        return btn;
      })
      .addText(text => {
        text
          .setValue(this.plugin.settings.defaultPromptFilePath)
          .onChange(async (value) => {
            this.plugin.settings.defaultPromptFilePath = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.style.width = '500px'; // 增加输入框宽度
        return text;
      })

    // 重新创建文件夹和文件的按钮
    new Setting(container)
      .setName('重新创建文件夹和文件')
      .setDesc('根据当前设置重新创建必要的文件夹和文件')
      .addButton(button => button
        .setButtonText('创建')
        .onClick(async () => {
          await this.plugin.ensureFoldersAndFilesExist();
        }));
  }

  // 显示关于选项卡
  private displayAboutTab(container: HTMLElement): void {
    container.createEl('h3', { text: '关于 Auto Task Panel With AI' });
    
    container.createEl('p', { 
      text: '这是一个为Obsidian提供AI辅助任务管理的插件。'
    });
    
    container.createEl('p', { 
      text: '主要功能：'
    });
    
    const featuresList = container.createEl('ul');
    featuresList.createEl('li', { text: '自动创建必要的文件夹结构和默认提示词文件' });
    featuresList.createEl('li', { text: '自定义文件和文件夹路径' });
    featuresList.createEl('li', { text: '提供AI辅助任务管理所需的提示词模板' });
    
    container.createEl('p', { 
      text: '插件版本: 1.0.0'
    });
  }
}
