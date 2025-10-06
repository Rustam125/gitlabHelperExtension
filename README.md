# GitLab Helper Browser Extension

A browser extension that simplifies working with GitLab issues and work items by automating common tasks like branch naming, commit message generation, and task list creation.

## Features

### 1. Branch Name Generation
- Creates Git branch names from current issue/work item
- Format: `v_[version].[year]/#[issue-number]_[cleaned-title]`
- Interactive version input in popup
- Automatic cleaning of special characters

### 2. Commit Message Generator
- Generates formatted commit messages from current issue
- Format: `#[issue-number] [issue-title]` + `[issue-url]`
- Normalizes URLs (converts work_items to issues format)
- Automatically copies to clipboard

### 3. Task List Generator
- **Simple List**: Generates list of issue numbers from current page
- **List with Links**: Generates issue numbers with full URLs
- Perfect for standup reports and progress tracking

## Supported GitLab URL Formats

The extension works with both traditional issues and newer work items:
- `https://gitlab.example.com/project/-/issues/123`
- `https://gitlab.example.com/project/-/work_items/456`
- `https://gitlab.example.com/project/issues/789`
- `https://gitlab.example.com/project/work_items/101`

## Installation

### For Chrome/Chromium-based browsers (Chrome, Edge, Brave, etc.)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

### For Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select any file in the extension folder

### For Yandex Browser

1. Download or clone this repository
2. Open Yandex Browser and navigate to `yandex://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked extension"
5. Select the extension folder

## Usage

1. **Navigate to any GitLab issue or work item page**
2. **Click the extension icon** in your browser toolbar
3. **Choose your action**:

   - **Create Branch Name**: Enter version number when prompted
   - **Commit Message**: Generates and copies commit message
   - **Task List**: Copies list of issue numbers from current page
   - **Task List with Links**: Copies issue numbers with URLs

## Configuration

Update `host_permissions` in `manifest.json` to match your GitLab instance:

```json
"host_permissions": [
  "https://gitlab.yourcompany.com/*"
]
```