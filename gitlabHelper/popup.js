document.addEventListener('DOMContentLoaded', function() {
    const gitlabPageName = 'gitlab.example.com';
    const branchBtn = document.getElementById('branchBtn');
    const branchInputGroup = document.getElementById('branchInputGroup');
    const versionInput = document.getElementById('versionInput');
    const confirmBranch = document.getElementById('confirmBranch');
    const cancelBranch = document.getElementById('cancelBranch');

    // Обработчик кнопки "Создать название ветки"
    branchBtn.addEventListener('click', () => {
        // Показываем поле ввода
        branchInputGroup.classList.add('visible');
        versionInput.focus();
    });

    // Обработчик подтверждения ввода версии
    confirmBranch.addEventListener('click', () => {
        const version = versionInput.value.trim();
        if (!version) {
            showStatus('Пожалуйста, введите номер версии', false);
            return;
        }

        // Скрываем поле ввода
        branchInputGroup.classList.remove('visible');
        versionInput.value = '';

        // Выполняем создание названия ветки
        executeBranchCreation(version);
    });

    // Обработчик отмены
    cancelBranch.addEventListener('click', () => {
        branchInputGroup.classList.remove('visible');
        versionInput.value = '';
        showStatus('Отменено пользователем', false);
    });

    // Обработчик клавиши Enter в поле ввода
    versionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmBranch.click();
        }
    });

    // Обработчик Escape для отмены
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && branchInputGroup.classList.contains('visible')) {
            cancelBranch.click();
        }
    });

    // Остальные кнопки
    document.getElementById('commitBtn').addEventListener('click', () => {
        executeContentScript('createCommitMessage');
    });

    document.getElementById('tasksBtn').addEventListener('click', () => {
        executeContentScript('generateTasksList');
    });

    document.getElementById('tasksWithLinksBtn').addEventListener('click', () => {
        executeContentScript('generateTasksListWithLinks');
    });

    // Отдельная функция для создания ветки
    function executeBranchCreation(version) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0].url.includes(gitlabPageName)) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'createBranchName',
                    version: version // передаем версию как строку
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        showStatus('Ошибка: ' + chrome.runtime.lastError.message, false);
                    } else {
                        showStatus(response.message, response.success);
                    }
                });
            } else {
                showStatus('Расширение работает только на страницах GitLab', false);
            }
        });
    }

    function executeContentScript(action) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0].url.includes(gitlabPageName)) {
                chrome.tabs.sendMessage(tabs[0].id, { action: action }, function(response) {
                    if (chrome.runtime.lastError) {
                        showStatus('Ошибка: ' + chrome.runtime.lastError.message, false);
                    } else {
                        showStatus(response.message, response.success);
                    }
                });
            } else {
                showStatus('Расширение работает только на страницах GitLab', false);
            }
        });
    }

    function showStatus(message, isSuccess) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${isSuccess ? 'success' : 'error'}`;

        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 3000);
    }
});