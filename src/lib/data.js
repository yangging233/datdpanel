// 数据模型与 localStorage 操作

import { STORAGE_KEYS } from './constants';

// 生成唯一ID
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 默认任务数据（示例）
export const getDefaultTasks = () => [
  {
    id: generateId(),
    company: '字节跳动',
    position: '前端开发工程师',
    status: 'interviewing',
    priority: 'high',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['互联网大厂', 'React'],
    description: '通过内推投递，一二面已通过',
    attachments: [],
    notes: [],
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    company: '阿里巴巴',
    position: '高级前端工程师',
    status: 'applied',
    priority: 'medium',
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['P7', '杭州'],
    description: '',
    attachments: [],
    notes: [],
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 获取所有任务
export const getTasks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks = data ? JSON.parse(data) : getDefaultTasks();
    return tasks;
  } catch (e) {
    console.error('Error loading tasks:', e);
    return getDefaultTasks();
  }
};

// 保存所有任务
export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return true;
  } catch (e) {
    console.error('Error saving tasks:', e);
    return false;
  }
};

// 获取单个任务
export const getTaskById = (id) => {
  const tasks = getTasks();
  return tasks.find(t => t.id === id);
};

// 创建任务
export const createTask = (taskData) => {
  const tasks = getTasks();
  const newTask = {
    id: generateId(),
    ...taskData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
};

// 更新任务
export const updateTask = (id, updates) => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveTasks(tasks);
    return tasks[index];
  }
  return null;
};

// 删除任务
export const deleteTask = (id) => {
  const tasks = getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  saveTasks(filtered);
  return filtered.length !== tasks.length;
};

// 获取草稿箱内容
export const getScratchpad = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCRATCHPAD);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// 保存草稿箱内容
export const saveScratchpad = (items) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, JSON.stringify(items));
    return true;
  } catch (e) {
    return false;
  }
};

// 创建草稿项
export const createScratchpadItem = (content) => {
  const items = getScratchpad();
  const newItem = {
    id: generateId(),
    content,
    createdAt: new Date().toISOString(),
    isMigrated: false,
  };
  items.unshift(newItem);
  saveScratchpad(items);
  return newItem;
};

// 迁移草稿为任务
export const migrateScratchpadToTask = (scratchpadId, taskData) => {
  const items = getScratchpad();
  const index = items.findIndex(i => i.id === scratchpadId);
  if (index !== -1) {
    items[index].isMigrated = true;
    items[index].migratedToTaskId = taskData.id;
    saveScratchpad(items);
    return createTask(taskData);
  }
  return null;
};
