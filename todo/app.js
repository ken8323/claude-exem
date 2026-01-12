// TodoManagerクラス - TODOの管理を行う
class TodoManager {
    constructor() {
        this.todos = [];
        this.currentFilter = { category: 'all', status: 'all' };
        this.currentSort = 'created';
        this.editingId = null;
        this.loadTodos();
    }

    // LocalStorageからTODOを読み込む
    loadTodos() {
        const stored = localStorage.getItem('todos');
        if (stored) {
            this.todos = JSON.parse(stored);
        }
    }

    // LocalStorageにTODOを保存
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    // TODOを追加
    addTodo(todoData) {
        const todo = {
            id: Date.now().toString(),
            title: todoData.title,
            description: todoData.description || '',
            category: todoData.category || '未分類',
            priority: todoData.priority || 'medium',
            dueDate: todoData.dueDate || null,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.todos.push(todo);
        this.saveTodos();
        return todo;
    }

    // TODOを更新
    updateTodo(id, todoData) {
        const index = this.todos.findIndex(t => t.id === id);
        if (index !== -1) {
            this.todos[index] = {
                ...this.todos[index],
                title: todoData.title,
                description: todoData.description || '',
                category: todoData.category || '未分類',
                priority: todoData.priority || 'medium',
                dueDate: todoData.dueDate || null
            };
            this.saveTodos();
            return this.todos[index];
        }
        return null;
    }

    // TODOを削除
    deleteTodo(id) {
        const index = this.todos.findIndex(t => t.id === id);
        if (index !== -1) {
            this.todos.splice(index, 1);
            this.saveTodos();
            return true;
        }
        return false;
    }

    // 完了状態を切り替え
    toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            return todo;
        }
        return null;
    }

    // IDでTODOを取得
    getTodo(id) {
        return this.todos.find(t => t.id === id);
    }

    // すべてのカテゴリーを取得
    getCategories() {
        const categories = new Set(this.todos.map(t => t.category));
        return Array.from(categories).sort();
    }

    // フィルタリングされたTODOを取得
    getFilteredTodos() {
        let filtered = [...this.todos];

        // カテゴリーでフィルター
        if (this.currentFilter.category !== 'all') {
            filtered = filtered.filter(t => t.category === this.currentFilter.category);
        }

        // 状態でフィルター
        if (this.currentFilter.status === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (this.currentFilter.status === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        // ソート
        filtered = this.sortTodos(filtered, this.currentSort);

        return filtered;
    }

    // TODOをソート
    sortTodos(todos, sortBy) {
        const sorted = [...todos];

        switch(sortBy) {
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'duedate':
                sorted.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'created':
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        return sorted;
    }

    // フィルターを設定
    setFilter(filterType, value) {
        this.currentFilter[filterType] = value;
    }

    // ソート方法を設定
    setSort(sortBy) {
        this.currentSort = sortBy;
    }
}

// UIManager - UIの更新と操作を管理
class UIManager {
    constructor(todoManager) {
        this.todoManager = todoManager;
        this.form = document.getElementById('todo-form');
        this.todoList = document.getElementById('todo-list');
        this.emptyState = document.getElementById('empty-state');
        this.filterCategory = document.getElementById('filter-category');
        this.filterStatus = document.getElementById('filter-status');
        this.sortBy = document.getElementById('sort-by');
        this.formTitle = document.getElementById('form-title');
        this.submitBtn = document.getElementById('submit-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.editIdInput = document.getElementById('edit-id');
        this.todoCount = document.querySelector('.todo-count');

        this.initEventListeners();
        this.render();
    }

    // イベントリスナーを初期化
    initEventListeners() {
        // フォーム送信
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // キャンセルボタン
        this.cancelBtn.addEventListener('click', () => {
            this.resetForm();
        });

        // フィルター変更
        this.filterCategory.addEventListener('change', (e) => {
            this.todoManager.setFilter('category', e.target.value);
            this.render();
        });

        this.filterStatus.addEventListener('change', (e) => {
            this.todoManager.setFilter('status', e.target.value);
            this.render();
        });

        // ソート変更
        this.sortBy.addEventListener('change', (e) => {
            this.todoManager.setSort(e.target.value);
            this.render();
        });
    }

    // フォーム送信処理
    handleFormSubmit() {
        const formData = new FormData(this.form);
        const todoData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            dueDate: formData.get('dueDate')
        };

        const editId = this.editIdInput.value;

        if (editId) {
            // 更新
            this.todoManager.updateTodo(editId, todoData);
        } else {
            // 新規追加
            this.todoManager.addTodo(todoData);
        }

        this.resetForm();
        this.render();
    }

    // フォームをリセット
    resetForm() {
        this.form.reset();
        this.editIdInput.value = '';
        this.formTitle.textContent = '新しいTODOを追加';
        this.submitBtn.textContent = '追加';
        this.cancelBtn.style.display = 'none';
        this.todoManager.editingId = null;
    }

    // 編集モードに切り替え
    startEdit(id) {
        const todo = this.todoManager.getTodo(id);
        if (!todo) return;

        document.getElementById('todo-title').value = todo.title;
        document.getElementById('todo-description').value = todo.description;
        document.getElementById('todo-category').value = todo.category;
        document.getElementById('todo-priority').value = todo.priority;
        document.getElementById('todo-duedate').value = todo.dueDate || '';
        this.editIdInput.value = id;

        this.formTitle.textContent = 'TODOを編集';
        this.submitBtn.textContent = '更新';
        this.cancelBtn.style.display = 'inline-block';
        this.todoManager.editingId = id;

        // フォームまでスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // TODOを削除
    handleDelete(id) {
        if (confirm('本当にこのTODOを削除しますか？')) {
            this.todoManager.deleteTodo(id);
            if (this.editIdInput.value === id) {
                this.resetForm();
            }
            this.render();
        }
    }

    // 完了状態を切り替え
    handleToggleComplete(id) {
        this.todoManager.toggleComplete(id);
        this.render();
    }

    // カテゴリーフィルターを更新
    updateCategoryFilter() {
        const categories = this.todoManager.getCategories();
        const currentValue = this.filterCategory.value;

        this.filterCategory.innerHTML = '<option value="all">すべて</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.filterCategory.appendChild(option);
        });

        // 現在の選択を復元
        if (categories.includes(currentValue)) {
            this.filterCategory.value = currentValue;
        }
    }

    // 期限が過ぎているかチェック
    isOverdue(dueDate) {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
    }

    // TODOアイテムのHTMLを生成
    createTodoElement(todo) {
        const div = document.createElement('div');
        div.className = `todo-item priority-${todo.priority}${todo.completed ? ' completed' : ''}`;
        div.dataset.id = todo.id;

        const overdue = this.isOverdue(todo.dueDate) && !todo.completed;

        div.innerHTML = `
            <div class="todo-checkbox">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}
                       onchange="uiManager.handleToggleComplete('${todo.id}')">
            </div>
            <div class="todo-content">
                <h3>${this.escapeHtml(todo.title)}</h3>
                ${todo.description ? `<p>${this.escapeHtml(todo.description)}</p>` : ''}
                <div class="todo-meta">
                    <span class="meta-item category">${this.escapeHtml(todo.category)}</span>
                    <span class="meta-item priority priority-${todo.priority}">
                        優先度: ${this.getPriorityLabel(todo.priority)}
                    </span>
                    ${todo.dueDate ? `
                        <span class="meta-item duedate${overdue ? ' overdue' : ''}">
                            ${overdue ? '期限切れ: ' : '期限: '}${this.formatDate(todo.dueDate)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn btn-small btn-edit" onclick="uiManager.startEdit('${todo.id}')">
                    編集
                </button>
                <button class="btn btn-small btn-delete" onclick="uiManager.handleDelete('${todo.id}')">
                    削除
                </button>
            </div>
        `;

        return div;
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 優先度ラベルを取得
    getPriorityLabel(priority) {
        const labels = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return labels[priority] || priority;
    }

    // 日付をフォーマット
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    }

    // 件数を更新
    updateCount(count) {
        this.todoCount.textContent = `${count}件のタスク`;
    }

    // 画面を再描画
    render() {
        const todos = this.todoManager.getFilteredTodos();

        this.todoList.innerHTML = '';

        if (todos.length === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            todos.forEach(todo => {
                const element = this.createTodoElement(todo);
                this.todoList.appendChild(element);
            });
        }

        this.updateCategoryFilter();
        this.updateCount(todos.length);
    }
}

// アプリケーション初期化
let todoManager;
let uiManager;

document.addEventListener('DOMContentLoaded', () => {
    todoManager = new TodoManager();
    uiManager = new UIManager(todoManager);
});
