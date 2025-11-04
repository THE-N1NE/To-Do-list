// DOM元素引用
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');
const taskCount = document.getElementById('task-count');

// 状态管理
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';

// 初始化应用
function init() {
    renderTodos();
    updateTaskCount();
    setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
    // 添加任务
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // 过滤任务
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            // 更新活跃按钮样式
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTodos();
        });
    });

    // 清除已完成任务
    clearCompletedBtn.addEventListener('click', clearCompleted);
}

// 添加新任务
function addTodo() {
    const text = todoInput.value.trim();
    if (text) {
        const newTodo = {
            id: Date.now(),
            text,
            completed: false
        };
        todos.push(newTodo);
        saveTodos();
        renderTodos();
        updateTaskCount();
        todoInput.value = '';
    }
}

// 渲染待办列表
function renderTodos() {
    todoList.innerHTML = '';
    
    // 根据当前过滤器获取要显示的任务
    const filteredTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true; // 'all'
    });

    if (filteredTodos.length === 0) {
        // 显示空状态
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <p>${getEmptyStateText()}</p>
        `;
        todoList.appendChild(emptyState);
    } else {
        // 渲染任务列表
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;
            
            li.innerHTML = `
                <input type="checkbox" class="checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="delete-btn">×</button>
            `;
            
            // 添加任务项的事件监听器
            const checkbox = li.querySelector('.checkbox');
            const deleteBtn = li.querySelector('.delete-btn');
            const todoText = li.querySelector('.todo-text');
            
            checkbox.addEventListener('change', toggleTodo);
            deleteBtn.addEventListener('click', deleteTodo);
            todoText.addEventListener('dblclick', editTodo);
            
            todoList.appendChild(li);
        });
    }
}

// 获取空状态文本
function getEmptyStateText() {
    switch(currentFilter) {
        case 'active':
            return '没有未完成的任务，太好了！';
        case 'completed':
            return '还没有已完成的任务';
        default:
            return '还没有任务，开始添加吧！';
    }
}

// 切换任务完成状态
function toggleTodo(e) {
    const li = e.target.closest('.todo-item');
    const id = parseInt(li.dataset.id);
    const todo = todos.find(t => t.id === id);
    
    if (todo) {
        todo.completed = !todo.completed;
        li.classList.toggle('completed');
        saveTodos();
        updateTaskCount();
    }
}

// 删除任务
function deleteTodo(e) {
    const li = e.target.closest('.todo-item');
    const id = parseInt(li.dataset.id);
    
    // 添加删除动画
    li.style.height = `${li.offsetHeight}px`;
    setTimeout(() => {
        li.style.height = '0';
        li.style.margin = '0';
        li.style.padding = '0';
        li.style.border = '0';
        li.style.overflow = 'hidden';
        li.style.transition = 'all 0.3s ease';
    }, 10);
    
    // 从数组中删除
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    
    // 动画完成后从DOM中移除
    setTimeout(() => {
        li.remove();
        updateTaskCount();
        // 如果删除后当前过滤器下没有任务，显示空状态
        if (todos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        }).length === 0) {
            renderTodos();
        }
    }, 300);
}

// 编辑任务
function editTodo(e) {
    const todoText = e.target;
    const li = e.target.closest('.todo-item');
    const id = parseInt(li.dataset.id);
    const todo = todos.find(t => t.id === id);
    
    if (todo) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        input.className = 'edit-input';
        input.style.width = '100%';
        input.style.padding = '5px';
        input.style.fontSize = '16px';
        input.style.border = '1px solid #3498db';
        input.style.borderRadius = '4px';
        input.style.outline = 'none';
        
        // 替换文本为输入框
        todoText.replaceWith(input);
        input.focus();
        
        // 保存编辑
        input.addEventListener('blur', () => saveEdit(input, todo, todoText));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit(input, todo, todoText);
            if (e.key === 'Escape') input.replaceWith(todoText);
        });
    }
}

// 保存编辑
function saveEdit(input, todo, todoText) {
    const newText = input.value.trim();
    if (newText) {
        todo.text = newText;
        todoText.textContent = escapeHtml(newText);
        saveTodos();
    }
    input.replaceWith(todoText);
}

// 清除已完成任务
function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
    updateTaskCount();
}

// 更新任务数量
function updateTaskCount() {
    const activeCount = todos.filter(todo => !todo.completed).length;
    taskCount.textContent = `${activeCount} ${activeCount === 1 ? '个待办任务' : '个待办任务'}`;
}

// 保存任务到本地存储
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// HTML转义，防止XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 启动应用
init();