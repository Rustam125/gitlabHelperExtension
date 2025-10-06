// Функции для работы с GitLab
const GitLabHelper = {
    // 1. Создание наименования ветки
    createBranchName(version) {
        const underscoreSymbol = '_';

        const issueData = this.getCurrentIssueData();
        if (!issueData) {
            return { success: false, message: 'Не удалось найти данные задачи на текущей странице' };
        }

        // version теперь передается как строка напрямую
        if (!version) {
            return { success: false, message: 'Не указана версия' };
        }

        const currentYear = new Date().getFullYear();
        const cleanTitle = issueData.title
            .replace(/\./g, underscoreSymbol) // точки заменяем на подчеркивания
            .replace(/[^\w\sа-яё]/gi, '') // убираем все спецсимволы
            .replace(/\s+/g, underscoreSymbol) // пробелы на подчеркивания
            .replace(/_+/g, underscoreSymbol) // убираем дублирующиеся подчеркивания
            .replace(/^[_-]+|[_-]+$/g, '') // убираем дефисы и подчеркивания в начале и конце
            .substring(0, 200);

        const branchName = `v_${version}.${currentYear}/#${issueData.number}_${cleanTitle}`;

        this.copyToClipboard(branchName);
        return { success: true, message: `Название ветки скопировано: ${branchName}` };
    },

    // 2. Формирование комментария для коммита
    createCommitMessage() {
        const issueData = this.getCurrentIssueData();
        if (!issueData) {
            return { success: false, message: 'Не удалось найти данные задачи на текущей странице' };
        }

        // Нормализуем URL - убираем параметры и преобразуем work_items в issues
        const normalizedUrl = this.normalizeIssueUrl(issueData.url);

        const commitMessage = `#${issueData.number} ${issueData.title}\n${normalizedUrl}`;
        this.copyToClipboard(commitMessage);
        return { success: true, message: 'Комментарий для коммита скопирован в буфер обмена' };
    },

    // Функция для нормализации URL задач
    normalizeIssueUrl(url) {
        try {
            const urlObj = new URL(url);

            // Убираем все параметры (query parameters)
            urlObj.search = '';

            const path = urlObj.pathname;

            // Преобразуем work_items в issues
            if (path.includes('/work_items/')) {
                urlObj.pathname = path.replace('/work_items/', '/issues/');
            }
            // Если это уже issues, оставляем как есть
            else if (path.includes('/issues/')) {
                // Уже правильный формат
            }
            // Если это другой формат, пробуем найти номер задачи и создать стандартный URL
            else {
                const issueMatch = path.match(/\/(?:issues|work_items)\/(\d+)/);
                if (issueMatch) {
                    const issueNumber = issueMatch[1];
                    // Создаем стандартный URL для issues
                    const repoPath = path.split('/').slice(0, -2).join('/'); // убираем /work_items/575
                    urlObj.pathname = `${repoPath}/issues/${issueNumber}`;
                }
            }

            return urlObj.toString();
        } catch (error) {
            // Если не удалось разобрать URL, возвращаем оригинальный без параметров
            return url.split('?')[0].replace('/work_items/', '/issues/');
        }
    },

    // 3. Формирование списка задач
    generateTasksList() {
        const tasks = this.getAllTasksOnPage();
        if (tasks.length === 0) {
            return { success: false, message: 'Задачи не найдены на текущей странице' };
        }

        const tasksList = tasks.map(task => `#${task.number}`).join('\n');
        this.copyToClipboard(tasksList);
        return { success: true, message: `Список из ${tasks.length} задач скопирован в буфер обмена` };
    },

    // 4. Список задач со ссылками
    generateTasksListWithLinks() {
        const tasks = this.getAllTasksOnPage();
        if (tasks.length === 0) {
            return { success: false, message: 'Задачи не найдены на текущей странице' };
        }

        const tasksList = tasks.map(task => `#${task.number} - ${task.url}`).join('\n');
        this.copyToClipboard(tasksList);
        return { success: true, message: `Список из ${tasks.length} задач со ссылками скопирован в буфер обмена` };
    },

    // Получение данных текущей задачи
    getCurrentIssueData() {
        // Поддерживаемые форматы URL:
        // /issues/123
        // /work_items/123
        // /-/issues/123
        // /-/work_items/123
        const urlPatterns = [
            /\/(?:issues|work_items)\/(\d+)/,
            /\/\-\/(?:issues|work_items)\/(\d+)/
        ];

        let issueNumber = null;
        for (const pattern of urlPatterns) {
            const match = window.location.href.match(pattern);
            if (match) {
                issueNumber = match[1];
                break;
            }
        }

        if (!issueNumber) return null;

        let title = '';
        const titleSelectors = [
            '[data-testid="issue-title"]',
            '[data-testid="title-content"]',
            '.issue-title',
            '#item-title',
            '.work-item-title',
            '.title',
            'h1.title',
            '.detail-page-header h1',
            '.breadcrumb-list + h1',
            '[data-qa-selector="title_content"]',
            '.title-container h1',
            // Новые селекторы для work_items
            '[data-testid="work-item-title"]',
            '.work-items-title',
            '.gl-page-title'
        ];

        for (const selector of titleSelectors) {
            const titleElement = document.querySelector(selector);
            if (titleElement) {
                title = titleElement.textContent.trim();
                // Удаляем номер задачи из заголовка, если он есть
                title = title.replace(`#${issueNumber}`, '').trim();
                break;
            }
        }

        // Если не нашли по селекторам, ищем любой h1 который не в хедере
        if (!title) {
            const h1Elements = document.querySelectorAll('h1');
            for (const h1 of h1Elements) {
                // Пропускаем h1 которые находятся в хедере или навигации
                if (!h1.closest('header') && !h1.closest('nav') && !h1.closest('.navbar')) {
                    const h1Text = h1.textContent.trim();
                    // Пропускаем слишком короткие или системные заголовки
                    if (h1Text.length > 5 && !h1Text.includes('GitLab') && !h1Text.includes('Dashboard')) {
                        title = h1Text.replace(`#${issueNumber}`, '').trim();
                        break;
                    }
                }
            }
        }

        // Если все еще не нашли, пробуем найти по структуре страницы work_items
        if (!title) {
            // Для work_items ищем элемент с описанием
            const descriptionElement = document.querySelector('[data-testid="work-item-description"]') ||
                document.querySelector('.description') ||
                document.querySelector('.issue-description');
            if (descriptionElement) {
                // Берем первый абзац как заголовок
                const firstParagraph = descriptionElement.querySelector('p');
                if (firstParagraph) {
                    title = firstParagraph.textContent.trim().substring(0, 100);
                }
            }
        }

        // Нормализуем URL для коммита
        const normalizedUrl = this.normalizeIssueUrl(window.location.href);

        return {
            number: issueNumber,
            title: title || 'Название не найдено',
            url: normalizedUrl // возвращаем нормализованный URL
        };
    },

    // Получение всех задач на странице
    getAllTasksOnPage() {
        const tasks = [];

        // Ищем ссылки на задачи (issues и work_items)
        const issueSelectors = [
            'a[href*="/issues/"]',
            'a[href*="/work_items/"]',
            'a[href*="/-/issues/"]',
            'a[href*="/-/work_items/"]'
        ];

        let issueLinks = [];
        issueSelectors.forEach(selector => {
            const links = document.querySelectorAll(selector);
            issueLinks = [...issueLinks, ...links];
        });

        issueLinks.forEach(link => {
            const href = link.getAttribute('href');
            const patterns = [
                /\/(?:issues|work_items)\/(\d+)/,
                /\/\-\/(?:issues|work_items)\/(\d+)/
            ];

            let issueNumber = null;
            for (const pattern of patterns) {
                const match = href.match(pattern);
                if (match) {
                    issueNumber = match[1];
                    break;
                }
            }

            if (issueNumber && !this.isNavigationLink(link)) {
                const issueTitle = link.textContent.trim();
                const fullUrl = new URL(href, window.location.origin).href;

                // Проверяем, нет ли уже такой задачи в списке
                if (!tasks.some(task => task.number === issueNumber)) {
                    tasks.push({
                        number: issueNumber,
                        title: issueTitle,
                        url: this.normalizeIssueUrl(fullUrl)
                    });
                }
            }
        });

        return tasks;
    },

    // Проверка, является ли ссылка навигационной (хлебные крошки и т.д.)
    isNavigationLink(link) {
        const navigationSelectors = [
            '.breadcrumb',
            '.breadcrumbs',
            '.navbar',
            'header',
            'nav',
            '[data-testid="breadcrumb-links"]'
        ];

        return navigationSelectors.some(selector => link.closest(selector));
    },

    // Копирование в буфер обмена
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            // Fallback метод
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }
};

// Обработчик сообщений от popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'createBranchName') {
        // Для создания ветки передаем version напрямую как строку
        const result = GitLabHelper.createBranchName(request.version);
        sendResponse(result);
    } else if (GitLabHelper[request.action]) {
        // Для остальных действий без параметров
        const result = GitLabHelper[request.action]();
        sendResponse(result);
    }
    return true;
});