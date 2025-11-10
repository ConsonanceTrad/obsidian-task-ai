import { Plugin, WorkspaceLeaf, App, Setting, PluginSettingTab, TFolder } from 'obsidian';
import { ASK_VIEW_TYPE, ASKView, TP_VIEW_TYPE, TPView, TPV_VIEW_TYPE, TPVView, FILE_EXPLORER_VIEW_TYPE, FileExplorerView, FolderConfig } from './view';

// 插件设置接口
interface AutoTaskPanelWithAISettings {
  templateFilePath: string;
  folderConfigs: { [key: string]: FolderConfig };
}

// 默认设置
const DEFAULT_SETTINGS: AutoTaskPanelWithAISettings = {
  templateFilePath: '',
  folderConfigs: {}
};

// 主插件类
export default class AutoTaskPanelWithAI extends Plugin {
  settings: AutoTaskPanelWithAISettings = DEFAULT_SETTINGS;
  
  // 插件加载时执行
  async onload() {
    console.log('Loading Auto Task Panel With AI plugin');

    // 注册视图类型
    this.registerView(
      ASK_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new ASKView(leaf)
    );
    
    // 注册TP面板视图类型
    this.registerView(
      TP_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new TPView(leaf)
    );
    
    // 注册TPV面板视图类型
    this.registerView(
      TPV_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new TPVView(leaf)
    );
    
    // 注册自定义文件浏览器视图类型
    this.registerView(
      FILE_EXPLORER_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new FileExplorerView(leaf, this.settings.folderConfigs)
    );

    // 添加命令：显示问询面板
    this.addCommand({
      id: 'show-ask-panel',
      name: '显示问询面板',
      callback: () => this.activateView()
    });
    
    // 添加命令：显示任务编辑器
    this.addCommand({
      id: 'show-tp-panel',
      name: '显示任务编辑器',
      callback: () => this.activateTPView()
    });
    
    // 添加命令：显示任务阅览器
    this.addCommand({
      id: 'show-tpv-panel',
      name: '显示任务阅览器',
      callback: () => this.activateTPVView()
    });
    
    // 添加命令：显示自定义文件浏览器
    this.addCommand({
      id: 'show-file-explorer',
      name: '显示自定义文件浏览器',
      callback: () => this.activateFileExplorerView()
    });
    
    // 添加命令：打开当日记录文件
    this.addCommand({
      id: 'open-today-note',
      name: '打开当日记录文件',
      callback: () => this.openTodayNote()
    });

    // 添加问询面板功能区按键
    this.addRibbonIcon(
      'message-square', // 使用与视图相同的图标
      '打开问询面板',   // 悬停提示文本
      () => this.activateView() // 点击事件处理函数
    );
    
    // 添加任务编辑器功能区按键
    this.addRibbonIcon(
      'layout', // 使用与任务编辑器视图相同的图标
      '打开任务编辑器',   // 悬停提示文本
      () => this.activateTPView() // 点击事件处理函数
    );
    
    // 添加任务阅览器功能区按键
    this.addRibbonIcon(
      'box', // 使用与任务阅览器视图相同的图标
      '打开任务阅览器',   // 悬停提示文本
      () => this.activateTPVView() // 点击事件处理函数
    );
    
    // 添加自定义文件浏览器功能区按键
    this.addRibbonIcon(
      'folder-open', // 使用文件夹图标
      '打开自定义文件浏览器',   // 悬停提示文本
      () => this.activateFileExplorerView() // 点击事件处理函数
    );
    
    // 添加打开当日记录文件功能区按键
    this.addRibbonIcon(
      'calendar', // 使用日历图标
      '打开当日记录文件',   // 悬停提示文本
      () => this.openTodayNote() // 点击事件处理函数
    );

    // 当插件启动时，不再重复打开面板，已在上面的onLayoutReady中处理

    // 加载样式
    await this.loadStyles();
    
    // 加载设置
    await this.loadSettings();
    
    // 检查并创建必要的文件夹
    await this.checkAndCreateRequiredFolders();
    
    // 添加设置选项卡
    this.addSettingTab(new AutoTaskPanelWithAISettingsTab(this.app, this));
    
    // 在仓库打开时执行初始化操作
    this.app.workspace.onLayoutReady(async () => {
      // 先检查并创建必要的文件夹
      await this.checkAndCreateRequiredFolders();
      
      // 然后打开所有面板
      this.activateView(); // 打开问询面板（右侧边栏）
      this.activateTPView(); // 打开任务编辑器（主窗格）
      this.activateTPVView(); // 打开任务阅览器（主窗格）
      
      // 最后检查当日记录文件是否存在，如果不存在则创建并打开
      await this.checkAndCreateTodayNoteIfNeeded();
    });
  }

  // 加载样式文件
  async loadStyles() {
    await this.loadCSS('styles.css');
  }

  // 加载CSS文件
  async loadCSS(cssPath: string) {
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = `${this.manifest.dir}/styles.css`;
    document.head.appendChild(linkEl);

    // 注册清理函数
    this.register(() => {
      linkEl.remove();
    });
  }

  // 激活视图（显示问询面板）
  async activateView() {
    // 检查是否已经有ASK视图打开
    const leaves = this.app.workspace.getLeavesOfType(ASK_VIEW_TYPE);
    if (leaves.length > 0) {
      // 如果已存在，则聚焦到该视图
      this.app.workspace.revealLeaf(leaves[0]);
      return;
    }

    // 创建新的右侧边栏叶子节点
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: ASK_VIEW_TYPE,
        active: true
      });
      // 将叶子节点移动到右侧边栏
      this.app.workspace.revealLeaf(leaf);
    }
  }
  
  // 激活视图（显示任务编辑器）
  async activateTPView() {
    // 检查是否已经有TP视图打开
    const leaves = this.app.workspace.getLeavesOfType(TP_VIEW_TYPE);
    if (leaves.length > 0) {
      // 如果已存在，则聚焦到该视图
      this.app.workspace.revealLeaf(leaves[0]);
      return;
    }

    // 创建新的主窗格叶子节点
    const leaf = this.app.workspace.getLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: TP_VIEW_TYPE,
        active: true
      });
      // 将叶子节点显示在主窗格
      this.app.workspace.revealLeaf(leaf);
    }
  }

  // 激活视图（显示任务阅览器）
  async activateTPVView() {
    // 检查是否已经有任务阅览器视图打开
    const leaves = this.app.workspace.getLeavesOfType(TPV_VIEW_TYPE);
    if (leaves.length > 0) {
      // 如果已存在，则聚焦到该视图
      this.app.workspace.revealLeaf(leaves[0]);
      return;
    }

    // 创建新的主窗格叶子节点
    const leaf = this.app.workspace.getLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: TPV_VIEW_TYPE,
        active: true
      });
      // 将叶子节点显示在主窗格
      this.app.workspace.revealLeaf(leaf);
    }
  }

  // 激活自定义文件浏览器视图
  async activateFileExplorerView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf;

    // 检查是否已经有文件浏览器视图打开
    const leaves = workspace.getLeavesOfType(FILE_EXPLORER_VIEW_TYPE);

    if (leaves.length > 0) {
      // 如果已有视图，则更新配置并使用它
      leaf = leaves[0];
      const view = leaf.view as FileExplorerView;
      view.updateFolderConfigs(this.settings.folderConfigs);
    } else {
      // 如果没有视图，则创建一个新的
      // 尝试在左侧边栏创建（如果可用）
      const leftLeaf = workspace.getLeftLeaf(false);
      if (!leftLeaf) {
        // 如果左侧边栏不可用，使用任何可用的leaf
        leaf = workspace.getLeaf(false);
      } else {
        leaf = leftLeaf;
      }
      
      await leaf.setViewState({
        type: FILE_EXPLORER_VIEW_TYPE,
      });
    }

    // 将焦点放在文件浏览器视图上
    workspace.revealLeaf(leaf);
  }

  // 检查并创建必要的文件夹
  async checkAndCreateRequiredFolders() {
    const requiredFolders = ['模板', '任务', 'AI对话记录', '日志', 'AI提示词'];
    
    for (const folder of requiredFolders) {
      try {
        await this.app.vault.createFolder(folder);
        console.log(`已创建文件夹: ${folder}`);
      } catch (e) {
        // 文件夹已存在时会抛出错误，这里忽略
        console.log(`文件夹已存在: ${folder}`);
      }
    }
  }
  
  // 打开当日记录文件
  async openTodayNote() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 创建日志文件夹下的年文件夹路径
    const yearFolder = `日志/${year}`;
    // 创建年月文件夹路径
    const monthFolder = `${yearFolder}/${month}`;
    // 创建日期文件名
    const fileName = `${yearFolder}/${month}/${year}${month}${day}.md`;
    
    // 确保日志文件夹下的年文件夹存在
    try {
      await this.app.vault.createFolder(yearFolder);
    } catch (e) {
      // 文件夹已存在时会抛出错误，这里忽略
    }
    
    // 确保月文件夹存在
    try {
      await this.app.vault.createFolder(monthFolder);
    } catch (e) {
      // 文件夹已存在时会抛出错误，这里忽略
    }
    
    // 检查文件是否存在
    const fileExists = await this.app.vault.adapter.exists(fileName);
    
    if (!fileExists) {
      let content = `# ${year}年${month}月${day}日`;
      
      // 如果设置了模板文件路径，尝试读取模板内容
      if (this.settings.templateFilePath) {
        try {
          const templateFile = this.app.vault.getAbstractFileByPath(this.settings.templateFilePath);
          if (templateFile) {
            // 尝试读取文件内容，使用类型断言
            try {
              const templateContent = await this.app.vault.read(templateFile as any);
              content = templateContent;
              
              // 替换模板中的日期占位符
              content = content.replace(/\{\{YEAR\}\}/g, year.toString());
              content = content.replace(/\{\{MONTH\}\}/g, month);
              content = content.replace(/\{\{DAY\}\}/g, day);
              content = content.replace(/\{\{DATE\}\}/g, `${year}年${month}月${day}日`);
            } catch (readError) {
              // 如果读取失败（可能是文件夹），使用默认内容
              console.error('无法读取模板文件（可能是文件夹）:', readError);
            }
          }
        } catch (e) {
          console.error('读取模板文件失败:', e);
          // 如果模板读取失败，使用默认内容
        }
      }
      
      // 创建新文件
      await this.app.vault.create(fileName, content);
    }
    
    // 打开文件
    const file = await this.app.vault.getAbstractFileByPath(fileName);
    if (file) {
      try {
        await this.app.workspace.getLeaf(true).openFile(file as any); // 类型断言
      } catch (openError) {
        console.error('无法打开文件:', openError);
      }
    }
  }
  
  // 检查并创建当日记录文件（如果不存在）
  async checkAndCreateTodayNoteIfNeeded() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 创建日志文件夹下的年文件夹路径
    const yearFolder = `日志/${year}`;
    // 创建年月文件夹路径
    const monthFolder = `${yearFolder}/${month}`;
    // 创建日期文件名
    const fileName = `${yearFolder}/${month}/${year}${month}${day}.md`;
    
    // 检查文件是否存在
    const fileExists = await this.app.vault.adapter.exists(fileName);
    
    if (!fileExists) {
      // 如果文件不存在，则调用openTodayNote来创建并打开它
      await this.openTodayNote();
    }
  }
  
  // 加载设置
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  // 保存设置
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  // 插件卸载时执行
  async onunload() {
    console.log('Unloading Auto Task Panel With AI plugin');
    // 清理所有视图
    this.app.workspace.detachLeavesOfType(ASK_VIEW_TYPE); // 清理问询面板视图
    this.app.workspace.detachLeavesOfType(TP_VIEW_TYPE); // 清理任务编辑器视图
    this.app.workspace.detachLeavesOfType(TPV_VIEW_TYPE); // 清理任务阅览器视图
  }
}

// 设置选项卡类
class AutoTaskPanelWithAISettingsTab extends PluginSettingTab {
  plugin: AutoTaskPanelWithAI;

  constructor(app: App, plugin: AutoTaskPanelWithAI) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // 获取所有位于模板文件夹中的文件
  getTemplateFiles(): {[key: string]: string} {
    const files: {[key: string]: string} = {};
    const templateFolderNames = ['模板', 'template', 'templates', 'Template', 'Templates'];
    
    // 先添加空选项
    files[''] = '不使用模板';
    
    // 获取所有markdown文件
    const markdownFiles = this.app.vault.getMarkdownFiles();
    
    // 筛选出位于模板文件夹中的文件
    const templateFiles = markdownFiles.filter(file => {
      const filePath = file.path.toLowerCase();
      // 检查文件路径是否包含任何模板文件夹名称
      return templateFolderNames.some(folderName => 
        filePath.includes(`/${folderName}/`) || 
        filePath.startsWith(`${folderName}/`) ||
        filePath.includes(`\\${folderName}\\`) ||
        filePath.startsWith(`${folderName}\\`)
      );
    });
    
    // 按文件名排序并添加到结果中
    templateFiles.sort((a, b) => a.name.localeCompare(b.name));
    templateFiles.forEach(file => {
      const filePath = file.path;
      files[filePath] = filePath;
    });
    
    return files;
  }

  // 获取所有文件夹配置
  private collectAllFolders(): {[key: string]: FolderConfig} {
    const folders: {[key: string]: FolderConfig} = {};
    const existingConfigs = this.plugin.settings.folderConfigs || {};
    let nextOrder = 0;
    
    // 从根目录开始收集，只收集第一层级的子文件夹
    const root = this.app.vault.getRoot();
    if (root instanceof TFolder) {
      root.children.forEach(child => {
        if (child instanceof TFolder) {
          // 为每个第一层级文件夹创建或获取配置
          if (!existingConfigs[child.path]) {
            folders[child.path] = {
              path: child.path,
              visible: true,
              sortOrder: nextOrder++
            };
          } else {
            // 使用现有配置
            folders[child.path] = existingConfigs[child.path];
            if (folders[child.path].sortOrder >= nextOrder) {
              nextOrder = folders[child.path].sortOrder + 1;
            }
          }
        }
      });
    }
    
    return folders;
  }

  // 保存文件夹配置
  private async saveFolderConfigs(configs: {[key: string]: FolderConfig}) {
    this.plugin.settings.folderConfigs = configs;
    await this.plugin.saveSettings();
    
    // 更新所有已打开的文件浏览器视图
    this.app.workspace.getLeavesOfType(FILE_EXPLORER_VIEW_TYPE).forEach(leaf => {
      const view = leaf.view as FileExplorerView;
      view.updateFolderConfigs(configs);
    });
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Auto Task Panel With AI 设置' });

    // 日记模板文件路径设置
    new Setting(containerEl)
      .setName('日记模板文件路径')
      .setDesc('指定日记记录文件创建时使用的模板文件路径，选择"不使用模板"则使用默认模板。')
      .addDropdown((dropdown) => {
        // 获取所有可能的模板文件
        const templateFiles = this.getTemplateFiles();
        
        // 添加选项到下拉菜单
        Object.keys(templateFiles).forEach((key) => {
          dropdown.addOption(key, templateFiles[key]);
        });
        
        // 设置当前选中的值
        dropdown.setValue(this.plugin.settings.templateFilePath || '');
        
        // 当选择变更时保存设置
        dropdown.onChange(async (value) => {
          this.plugin.settings.templateFilePath = value;
          await this.plugin.saveSettings();
        });
        
        // 下拉菜单不需要额外设置placeholder，已通过addOption提供空选项
      });
      
    // 创建分隔线
    containerEl.createEl('hr', { cls: 'setting-item-separator' });
    
    // 文件浏览器配置标题
    containerEl.createEl('h3', { text: '阅览设置' });
    containerEl.createEl('p', { 
      text: '配置文件夹的显示顺序和可见性，点击以将文件夹次序移动到最前。',
      cls: 'setting-item-description'
    });
    
    // 文件夹配置区域
    const folderConfigContainer = containerEl.createDiv({
      cls: 'folder-config-container'
    });
    
    // 获取所有文件夹配置
    const folderConfigs = this.collectAllFolders();
    
    // 创建文件夹列表
    const folderList = folderConfigContainer.createDiv({
      cls: 'folder-list'
    });
    
    // 设置样式
    folderList.style.minHeight = '200px';
    folderList.style.border = '1px solid #ccc';
    folderList.style.borderRadius = '4px';
    folderList.style.padding = '8px';
    folderList.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    
    // 按排序顺序添加文件夹配置项
    const sortedFolderPaths = Object.keys(folderConfigs).sort((a, b) => 
      folderConfigs[a].sortOrder - folderConfigs[b].sortOrder
    );
    
    sortedFolderPaths.forEach(path => {
      const config = folderConfigs[path];
      const folderItem = folderList.createDiv({
        cls: 'sortable-folder-item',
        attr: {
          'data-folder-path': path
        }
      });
      
      // 设置样式
      folderItem.style.display = 'flex';
      folderItem.style.alignItems = 'center';
      folderItem.style.padding = '8px 12px';
      folderItem.style.marginBottom = '4px';
      folderItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      folderItem.style.borderRadius = '4px';
      folderItem.style.cursor = 'pointer';
      folderItem.style.transition = 'background-color 0.2s ease';
      
      // 点击事件 - 点击后将文件夹移动到第一位
      folderItem.addEventListener('click', async () => {
        // 查找当前最小的sortOrder
        let minOrder = Math.min(...Object.values(folderConfigs).map(c => c.sortOrder));
        
        // 将当前文件夹的sortOrder设为比最小的还小1，确保在第一位
        config.sortOrder = minOrder - 1;
        
        // 保存配置
        await this.saveFolderConfigs(folderConfigs);
        
        // 重新渲染设置界面
        this.display();
      });
      
      // 悬停效果
      folderItem.addEventListener('mouseenter', () => {
        folderItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      
      folderItem.addEventListener('mouseleave', () => {
        folderItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      });
      
      // 文件夹名称
      const folderName = folderItem.createDiv({
        cls: 'folder-name',
        text: path
      });
      folderName.style.flex = '1';
      
      // 可见性切换 - 阻止事件冒泡，避免触发文件夹点击事件
      const visibilityToggle = folderItem.createDiv({
        cls: 'visibility-toggle',
        text: config.visible ? '显示' : '隐藏'
      });
      visibilityToggle.style.padding = '4px 8px';
      visibilityToggle.style.borderRadius = '4px';
      visibilityToggle.style.backgroundColor = config.visible ? 'rgba(72, 187, 120, 0.2)' : 'rgba(235, 87, 87, 0.2)';
      visibilityToggle.style.color = config.visible ? '#48BB78' : '#EB5757';
      visibilityToggle.style.cursor = 'pointer';
      visibilityToggle.style.userSelect = 'none';
      visibilityToggle.style.zIndex = '1'; // 确保可以点击到
      
      // 点击切换可见性
      visibilityToggle.addEventListener('click', async (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        config.visible = !config.visible;
        visibilityToggle.textContent = config.visible ? '显示' : '隐藏';
        visibilityToggle.style.backgroundColor = config.visible ? 'rgba(72, 187, 120, 0.2)' : 'rgba(235, 87, 87, 0.2)';
        visibilityToggle.style.color = config.visible ? '#48BB78' : '#EB5757';
        await this.saveFolderConfigs(folderConfigs);
      });
    });
  }
  

}
