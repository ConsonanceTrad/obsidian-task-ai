# Auto Task Panel With AI

An Obsidian plugin that helps you quickly generate and manage tasks with AI assistance.

## Features

- **AI Message Panel**: A floating panel for interacting with AI to generate and analyze tasks
- **Automatic Folder Creation**: Creates necessary folders for task management
- **Default Prompt**: Comes with a pre-configured prompt for AI task generation
- **Customizable Settings**: Allows you to configure AI prompts and other settings
- **Keyboard Shortcuts**: Quick commands to open/close/toggle the AI message panel

## Installation

1. Place the `Auto Task Panel With AI` folder in your Obsidian plugins directory (`Vault/.obsidian/plugins/`)
2. Enable the plugin in Obsidian's settings
3. Restart Obsidian if prompted

## Usage

### Opening the AI Message Panel

- Use the command `Toggle AI Message Panel` from the Obsidian command palette
- Or use the commands `Open AI Message Panel` and `Close AI Message Panel` separately

### Interacting with AI

1. Type your task request or question in the input box
2. Click the "Send" button or press `Ctrl+Enter` to send
3. The AI will respond with task suggestions or analysis

### Default Prompt

The plugin includes a default prompt that guides the AI to help with task analysis and generation. You can find this prompt in the `_Root/plugin/Task-AI/prompts/TaskAIDefaultPrompt.md` file.

## Plugin Structure

```
Auto Task Panel With AI/
├── manifest.json          # Plugin manifest
├── package.json           # Dependencies and scripts
├── main.js               # Compiled plugin code
├── main.js.map           # Source map
├── styles.css            # Plugin styles
├── ts/                  # TypeScript source files
│   ├── main.ts         # Main plugin entry point
│   ├── panel/          # UI components
│   │   └── ai-message-panel.ts
│   └── settings.ts     # Plugin settings
├── tsconfig.json        # TypeScript configuration
└── esbuild.config.mjs   # Build configuration
```

## Settings

### Default Prompt File

Path to the default prompt file used by the AI. Default: `_Root/plugin/Task-AI/prompts/TaskAIDefaultPrompt.md`

## Commands

- `Open AI Message Panel`: Opens the AI message panel
- `Close AI Message Panel`: Closes the AI message panel
- `Toggle AI Message Panel`: Toggles the AI message panel open/closed

## Keyboard Shortcuts

You can assign custom keyboard shortcuts to the plugin commands in Obsidian's settings.

## Development

### Prerequisites

- Node.js
- npm

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

## License

MIT

## Author

[Your Name]

## Version

1.0.0
