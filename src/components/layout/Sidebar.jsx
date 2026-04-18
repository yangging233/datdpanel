import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { STATUS_ORDER, TASK_STATUS } from '@/lib/constants';
import { getTasks } from '@/lib/data';
import {
  LayoutGrid,
  Calendar,
  BarChart3,
  Search,
  StickyNote,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Clock,
  Tag,
  Flag,
  Filter,
} from 'lucide-react';

const Sidebar = ({ currentPath = '/', onNavigate }) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    tags: true,
    priority: true,
  });

  const tasks = getTasks();
  
  // 统计各状态任务数
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 处理状态筛选点击 - 跳转到首页看板并传递筛选参数
  const handleStatusFilter = (statusKey) => {
    navigate('/', { state: { status: statusKey } });
    onNavigate?.('/');
  };

  // 处理优先级筛选点击 - 跳转到首页看板并传递筛选参数
  const handlePriorityFilter = (priority) => {
    navigate('/', { state: { priority } });
    onNavigate?.('/');
  };

  // 处理统计卡片点击 - 跳转到看板并应用相应筛选
  const handleStatClick = (type) => {
    if (type === 'total') {
      // 总投递 - 显示全部，无筛选
      navigate('/');
    } else if (type === 'interviewing') {
      // 面试中 - 按状态筛选
      navigate('/', { state: { status: 'interviewing' } });
    } else if (type === 'pending') {
      // 待处理 - 准备中或已投递
      navigate('/', { state: { status: 'preparing' } });
    }
    onNavigate?.('/');
  };

  const navItems = [
    { id: 'dashboard', label: '首页', icon: LayoutGrid, path: '/', badge: null },
    { id: 'analytics', label: '洞察分析', icon: BarChart3, path: '/analytics', badge: null },
    { id: 'search', label: '全局搜索', icon: Search, path: '/search', badge: null },
    { id: 'scratchpad', label: '草稿箱', icon: StickyNote, path: '/scratchpad', badge: null },
  ];

  const quickStats = [
    { label: '总投递', value: tasks.length, icon: Briefcase, color: 'text-primary', type: 'total' },
    { label: '面试中', value: statusCounts.interviewing || 0, icon: Clock, color: 'text-status-interviewing', type: 'interviewing' },
    { label: '待处理', value: (statusCounts.preparing || 0) + (statusCounts.applied || 0), icon: Flag, color: 'text-urgent-medium', type: 'pending' },
  ];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-[calc(100vh-64px)] overflow-y-auto hidden lg:block">
      <div className="p-4 space-y-6">
        {/* 快速统计 */}
        <div className="grid grid-cols-3 gap-2">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.label}
                onClick={() => handleStatClick(stat.type)}
                className="bg-white rounded-lg p-3 shadow-card text-center hover:shadow-md hover:border-primary/30 border border-transparent transition-all cursor-pointer group"
              >
                <Icon className={cn("w-4 h-4 mx-auto mb-1 group-hover:scale-110 transition-transform", stat.color)} />
                <div className="text-lg font-semibold text-slate-800 group-hover:text-primary transition-colors">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </button>
            );
          })}
        </div>

        {/* 主导航 */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-card'
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-status-interviewing text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 状态筛选 */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('status')}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-3 h-3" />
              按状态筛选
            </span>
            {expandedSections.status ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          
          {expandedSections.status && (
            <div className="space-y-1">
              {STATUS_ORDER.map((statusKey) => {
                const status = TASK_STATUS[statusKey.toUpperCase()];
                const count = statusCounts[statusKey] || 0;
                return (
                  <button
                    key={statusKey}
                    onClick={() => handleStatusFilter(statusKey)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-white hover:shadow-card transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", status.color)} />
                      <span>{status.label}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-200 transition-colors">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 优先级筛选 */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('priority')}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2"
          >
            <span className="flex items-center gap-2">
              <Flag className="w-3 h-3" />
              按优先级
            </span>
            {expandedSections.priority ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          
          {expandedSections.priority && (
            <div className="space-y-1">
              {['high', 'medium', 'low'].map((priority) => {
                const labels = { high: '高优先级', medium: '中优先级', low: '低优先级' };
                const colors = {
                  high: 'bg-priority-high',
                  medium: 'bg-priority-medium',
                  low: 'bg-priority-low'
                };
                const count = tasks.filter(t => t.priority === priority).length;
                return (
                  <button
                    key={priority}
                    onClick={() => handlePriorityFilter(priority)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-white hover:shadow-card transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", colors[priority])} />
                      <span>{labels[priority]}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-200 transition-colors">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 即将截止 */}
        <div className="bg-urgent-high/10 rounded-lg p-4 border border-urgent-high/20">
          <div className="flex items-center gap-2 text-urgent-high mb-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-sm">即将截止</span>
          </div>
          <p className="text-xs text-urgent-high/80">
            有 {tasks.filter(t => {
              const daysLeft = Math.ceil((new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24));
              return daysLeft <= 3 && daysLeft >= 0 && t.status !== 'rejected' && t.status !== 'offered';
            }).length} 个任务将在3天内截止
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
