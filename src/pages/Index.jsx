import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VIEW_TYPES, VIEW_LABELS } from '@/lib/constants';
import { Calendar, LayoutGrid, List, Clock, Search, Plus, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTasks, updateTask, createTask } from '@/lib/data';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// 导入视图组件
import MonthView from '@/components/views/MonthView';
import WeekView from '@/components/views/WeekView';
import ScheduleView from '@/components/views/ScheduleView';
import TimelineView from '@/components/views/TimelineView';
import BoardView from '@/components/views/BoardView';
import TaskDetailDrawer from '@/components/TaskDetailDrawer';
import NewTaskDrawer from '@/components/NewTaskDrawer';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(VIEW_TYPES.BOARD); // 默认看板视图
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 筛选状态
  const [activeFilters, setActiveFilters] = useState({
    status: null,
    priority: null,
  });
  
  // 抽屉状态
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskDefaults, setNewTaskDefaults] = useState({});

  // 加载任务数据
  useEffect(() => {
    const loadTasks = () => {
      const data = getTasks();
      setTasks(data);
      setIsLoading(false);
    };
    loadTasks();

    // 监听新建任务事件
    const handleNewTask = (e) => {
      setNewTaskDefaults(e.detail || {});
      setIsNewTaskOpen(true);
    };
    window.addEventListener('new-task', handleNewTask);
    return () => window.removeEventListener('new-task', handleNewTask);
  }, []);

  // 处理从侧边栏传入的筛选条件
  useEffect(() => {
    if (location.state) {
      const newFilters = { status: null, priority: null };
      
      if (location.state.status) {
        newFilters.status = location.state.status;
      }
      if (location.state.priority) {
        newFilters.priority = location.state.priority;
      }
      
      setActiveFilters(newFilters);
      
      // 清除location.state，避免刷新后重复应用
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // 筛选后的任务列表
  const filteredTasks = tasks.filter(task => {
    if (activeFilters.status && task.status !== activeFilters.status) {
      return false;
    }
    if (activeFilters.priority && task.priority !== activeFilters.priority) {
      return false;
    }
    return true;
  });

  // 清除筛选
  const clearFilter = (type) => {
    setActiveFilters(prev => ({ ...prev, [type]: null }));
  };

  // 清除所有筛选
  const clearAllFilters = () => {
    setActiveFilters({ status: null, priority: null });
  };

  // 处理任务点击
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  // 处理日期点击
  const handleDateClick = (date) => {
    setNewTaskDefaults({ endDate: date.toISOString() });
    setIsNewTaskOpen(true);
  };

  // 处理任务移动（拖拽）
  const handleTaskMove = (taskId, target) => {
    if (target instanceof Date) {
      // 移动到日期
      const updated = updateTask(taskId, { endDate: target.toISOString() });
      if (updated) {
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        toast.success('任务日期已更新');
      }
    } else if (target.status) {
      // 移动到状态列
      const updated = updateTask(taskId, { status: target.status });
      if (updated) {
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        const statusLabel = target.status === 'interviewing' ? '面试中' : 
                           target.status === 'offered' ? '已Offer' :
                           target.status === 'rejected' ? '已拒绝' :
                           target.status === 'applied' ? '已投递' :
                           target.status === 'screening' ? '简历筛选' :
                           target.status === 'written' ? '笔试中' : '准备中';
        toast.success(`任务状态已更新为: ${statusLabel}`);
      }
    }
  };

  // 处理新建任务
  const handleNewTask = (defaults = {}) => {
    setNewTaskDefaults(defaults);
    setIsNewTaskOpen(true);
  };

  // 处理任务创建完成
  const handleTaskCreate = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    toast.success('任务创建成功');
  };

  // 处理任务更新
  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
    toast.success('任务已更新');
  };

  // 处理任务删除
  const handleTaskDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('任务已删除');
  };

  const viewIcons = {
    [VIEW_TYPES.MONTH]: Calendar,
    [VIEW_TYPES.WEEK]: Calendar,
    [VIEW_TYPES.SCHEDULE]: List,
    [VIEW_TYPES.TIMELINE]: Clock,
    [VIEW_TYPES.BOARD]: LayoutGrid,
  };

  // 视图选项
  const viewOptions = [
    { id: VIEW_TYPES.MONTH, label: VIEW_LABELS[VIEW_TYPES.MONTH], icon: Calendar },
    { id: VIEW_TYPES.WEEK, label: VIEW_LABELS[VIEW_TYPES.WEEK], icon: Calendar },
    { id: VIEW_TYPES.SCHEDULE, label: VIEW_LABELS[VIEW_TYPES.SCHEDULE], icon: List },
    { id: VIEW_TYPES.TIMELINE, label: VIEW_LABELS[VIEW_TYPES.TIMELINE], icon: Clock },
    { id: VIEW_TYPES.BOARD, label: VIEW_LABELS[VIEW_TYPES.BOARD], icon: LayoutGrid },
  ];

  // 获取筛选标题
  const getFilterTitle = () => {
    const { status, priority } = activeFilters;
    if (status && priority) {
      const statusLabel = TASK_STATUS[status.toUpperCase()]?.label;
      const priorityLabels = { high: '高优先级', medium: '中优先级', low: '低优先级' };
      return `${statusLabel} · ${priorityLabels[priority]}`;
    }
    if (status) {
      return TASK_STATUS[status.toUpperCase()]?.label + '任务';
    }
    if (priority) {
      const priorityLabels = { high: '高优先级', medium: '中优先级', low: '低优先级' };
      return priorityLabels[priority] + '任务';
    }
    return null;
  };

  // 渲染当前视图
  const renderView = () => {
    const commonProps = {
      tasks: filteredTasks,
      onTaskClick: handleTaskClick,
      onTaskMove: handleTaskMove,
    };

    switch (currentView) {
      case VIEW_TYPES.MONTH:
        return <MonthView {...commonProps} onDateClick={handleDateClick} />;
      case VIEW_TYPES.WEEK:
        return <WeekView {...commonProps} />;
      case VIEW_TYPES.SCHEDULE:
        return <ScheduleView {...commonProps} />;
      case VIEW_TYPES.TIMELINE:
        return <TimelineView {...commonProps} />;
      case VIEW_TYPES.BOARD:
        return <BoardView {...commonProps} onNewTask={handleNewTask} />;
      default:
        return <BoardView {...commonProps} onNewTask={handleNewTask} />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasActiveFilters = activeFilters.status || activeFilters.priority;
  const filterTitle = getFilterTitle();

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏 - 视图切换、搜索、新建任务 */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* 视图切换器 */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1 flex-shrink-0">
            {viewOptions.map((view) => {
              const Icon = view.icon;
              const isActive = currentView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              );
            })}
          </div>

          {/* 搜索栏 */}
          <div className="flex-1 max-w-md">
            <div 
              className="relative group cursor-pointer"
              onClick={() => window.location.href = '#/search'}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
              <Input
                placeholder="搜索任务、公司、标签... (Ctrl+K)"
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors cursor-pointer"
                readOnly
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded hidden sm:block">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* 新建任务按钮 */}
          <Button
            onClick={() => handleNewTask()}
            className="bg-primary hover:bg-primary-600 text-white gap-2 shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>新建任务</span>
          </Button>
        </div>

        {/* 筛选标签栏 */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 mr-2">当前筛选:</span>
            
            {activeFilters.status && (
              <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100">
                状态: {TASK_STATUS[activeFilters.status.toUpperCase()]?.label}
                <button onClick={() => clearFilter('status')} className="ml-1 hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {activeFilters.priority && (
              <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100">
                优先级: {activeFilters.priority === 'high' ? '高' : activeFilters.priority === 'medium' ? '中' : '低'}
                <button onClick={() => clearFilter('priority')} className="ml-1 hover:text-amber-900">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 ml-auto" onClick={clearAllFilters}>
              清除全部
            </Button>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-4 lg:p-6 overflow-hidden bg-slate-50">
        {/* 筛选标题提示 */}
        {filterTitle && (
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800">{filterTitle}</h2>
            <span className="text-sm text-slate-500">({filteredTasks.length} 个任务)</span>
          </div>
        )}
        
        <div className="h-full animate-fade-in">
          {renderView()}
        </div>
      </div>

      {/* 视图切换提示 */}
      <div className="fixed bottom-4 right-4 bg-white shadow-card rounded-full px-4 py-2 text-sm text-slate-600 border border-slate-200 hidden lg:flex items-center gap-2 z-40">
        <span className="text-slate-400">当前视图:</span>
        <span className="font-medium text-primary">{VIEW_LABELS[currentView]}</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-400">{filteredTasks.length} 个任务</span>
        {hasActiveFilters && <span className="text-slate-300">|</span>}
        {hasActiveFilters && <span className="text-amber-500">已筛选</span>}
      </div>

      {/* 任务详情抽屉 */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />

      {/* 新建任务抽屉 */}
      <NewTaskDrawer
        isOpen={isNewTaskOpen}
        onClose={() => {
          setIsNewTaskOpen(false);
          setNewTaskDefaults({});
        }}
        onCreate={handleTaskCreate}
        defaultStatus={newTaskDefaults.status || 'preparing'}
      />
    </div>
  );
};

export default Index;
