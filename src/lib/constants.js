// 求职申请管理看板 - 设计系统常量

// 任务状态配置
export const TASK_STATUS = {
  PREPARING: { id: 'preparing', label: '准备中', color: 'bg-status-preparing', textColor: 'text-status-preparing', borderColor: 'border-status-preparing' },
  APPLIED: { id: 'applied', label: '已投递', color: 'bg-status-applied', textColor: 'text-status-applied', borderColor: 'border-status-applied' },
  SCREENING: { id: 'screening', label: '简历筛选', color: 'bg-status-screening', textColor: 'text-status-screening', borderColor: 'border-status-screening' },
  WRITTEN: { id: 'written', label: '笔试中', color: 'bg-status-written', textColor: 'text-status-written', borderColor: 'border-status-written' },
  INTERVIEWING: { id: 'interviewing', label: '面试中', color: 'bg-status-interviewing', textColor: 'text-status-interviewing', borderColor: 'border-status-interviewing' },
  OFFERED: { id: 'offered', label: '已Offer', color: 'bg-status-offered', textColor: 'text-status-offered', borderColor: 'border-status-offered' },
  REJECTED: { id: 'rejected', label: '已拒绝', color: 'bg-status-rejected', textColor: 'text-status-rejected', borderColor: 'border-status-rejected' },
};

// 状态顺序（用于看板列）
export const STATUS_ORDER = ['preparing', 'applied', 'screening', 'written', 'interviewing', 'offered', 'rejected'];

// 优先级配置
export const PRIORITY = {
  LOW: { id: 'low', label: '低', color: 'bg-priority-low', textColor: 'text-priority-low' },
  MEDIUM: { id: 'medium', label: '中', color: 'bg-priority-medium', textColor: 'text-priority-medium' },
  HIGH: { id: 'high', label: '高', color: 'bg-priority-high', textColor: 'text-priority-high' },
};

// 视图类型
export const VIEW_TYPES = {
  MONTH: 'month',
  WEEK: 'week',
  SCHEDULE: 'schedule',
  TIMELINE: 'timeline',
  BOARD: 'board',
};

// 视图标签
export const VIEW_LABELS = {
  [VIEW_TYPES.MONTH]: '月历',
  [VIEW_TYPES.WEEK]: '周历',
  [VIEW_TYPES.SCHEDULE]: '日程表',
  [VIEW_TYPES.TIMELINE]: '日时间轴',
  [VIEW_TYPES.BOARD]: '看板',
};

// 导航项
export const NAV_ITEMS = [
  { id: 'dashboard', label: '首页', icon: 'LayoutGrid', path: '/' },
  { id: 'analytics', label: '洞察分析', icon: 'BarChart3', path: '/analytics' },
  { id: 'search', label: '搜索', icon: 'Search', path: '/search' },
  { id: 'scratchpad', label: '草稿箱', icon: 'StickyNote', path: '/scratchpad' },
];

// 笔记类型
export const NOTE_TYPES = {
  GENERAL: { id: 'general', label: '一般笔记', icon: 'FileText' },
  INTERVIEW: { id: 'interview', label: '面试复盘', icon: 'MessageSquare' },
  FOLLOWUP: { id: 'followup', label: '跟进记录', icon: 'Phone' },
};

// 附件类型
export const ATTACHMENT_TYPES = {
  FILE: 'file',
  LINK: 'link',
  EMAIL: 'email',
};

// 提醒时间选项
export const REMINDER_OPTIONS = [
  { value: 0, label: '准时' },
  { value: 15, label: '提前15分钟' },
  { value: 30, label: '提前30分钟' },
  { value: 60, label: '提前1小时' },
  { value: 120, label: '提前2小时' },
  { value: 1440, label: '提前1天' },
  { value: 2880, label: '提前2天' },
];

// 本地存储键名
export const STORAGE_KEYS = {
  TASKS: 'jobtracker_tasks',
  SCRATCHPAD: 'jobtracker_scratchpad',
  SETTINGS: 'jobtracker_settings',
  USER: 'jobtracker_user',
};

// 默认空状态文本
export const EMPTY_STATE_TEXT = {
  NO_TASKS: '还没有求职任务，点击 + 开始第一个申请',
  NO_RESULTS: '没有找到匹配的结果',
  NO_SCRATCHPAD: '速记内容会保存在这里',
  NO_ANALYTICS: '数据不足，继续投递以生成洞察',
};
