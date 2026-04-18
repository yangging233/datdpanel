import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Tag, 
  Building2, 
  Briefcase,
  SlidersHorizontal,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getTasks } from '@/lib/data';
import { TASK_STATUS, PRIORITY, STATUS_ORDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import TaskCard from '@/components/TaskCard';
import TaskDetailDrawer from '@/components/TaskDetailDrawer';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // 加载任务数据
  useEffect(() => {
    const data = getTasks();
    setTasks(data);
    
    // 加载最近搜索历史
    const history = localStorage.getItem('search_history');
    if (history) {
      setRecentSearches(JSON.parse(history).slice(0, 5));
    }
  }, []);

  // 处理从侧边栏传入的筛选条件
  useEffect(() => {
    if (location.state) {
      if (location.state.status) {
        setSelectedStatus(location.state.status);
        setIsFilterOpen(true);
      }
      if (location.state.priority) {
        setSelectedPriority(location.state.priority);
        setIsFilterOpen(true);
      }
      // 清除location.state，避免刷新后重复应用
      navigate('/search', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // 保存搜索历史
  const saveSearchHistory = (query) => {
    if (!query.trim()) return;
    const newHistory = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  // 高亮匹配文本
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">{part}</mark> : part
    );
  };

  // 筛选逻辑
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // 文本搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.company?.toLowerCase().includes(query) ||
        task.position?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 状态筛选
    if (selectedStatus !== 'all') {
      result = result.filter(task => task.status === selectedStatus);
    }

    // 优先级筛选
    if (selectedPriority !== 'all') {
      result = result.filter(task => task.priority === selectedPriority);
    }

    // 日期范围筛选
    if (dateRange.from && dateRange.to) {
      result = result.filter(task => {
        if (!task.endDate) return false;
        const taskDate = parseISO(task.endDate);
        return isWithinInterval(taskDate, { start: dateRange.from, end: dateRange.to });
      });
    }

    return result;
  }, [tasks, searchQuery, selectedStatus, selectedPriority, dateRange]);

  // 统计信息
  const stats = useMemo(() => ({
    total: filteredTasks.length,
    byStatus: filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {}),
    urgent: filteredTasks.filter(t => {
      if (!t.endDate) return false;
      const daysLeft = Math.ceil((new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 3 && daysLeft >= 0;
    }).length,
  }), [filteredTasks]);

  const handleSearch = (e) => {
    e.preventDefault();
    saveSearchHistory(searchQuery);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setDateRange({ from: null, to: null });
  };

  const hasActiveFilters = searchQuery || selectedStatus !== 'all' || selectedPriority !== 'all' || dateRange.from;

  // 返回日历视图
  const handleBackToCalendar = () => {
    navigate('/');
  };

  // 获取当前筛选标题
  const getFilterTitle = () => {
    if (selectedStatus !== 'all' && selectedPriority === 'all') {
      return TASK_STATUS[selectedStatus.toUpperCase()]?.label + '任务';
    }
    if (selectedPriority !== 'all' && selectedStatus === 'all') {
      const labels = { high: '高优先级', medium: '中优先级', low: '低优先级' };
      return labels[selectedPriority] + '任务';
    }
    if (selectedStatus !== 'all' && selectedPriority !== 'all') {
      const statusLabel = TASK_STATUS[selectedStatus.toUpperCase()]?.label;
      const priorityLabels = { high: '高优先级', medium: '中优先级', low: '低优先级' };
      return `${statusLabel} · ${priorityLabels[selectedPriority]}`;
    }
    return '全局搜索';
  };

  return (
    <div className="h-full flex flex-col">
      {/* 搜索头部 */}
      <div className="bg-white border-b border-slate-200 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* 返回按钮 + 标题 */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCalendar}
              className="gap-2 text-slate-600 hover:text-slate-800 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回日历
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">{getFilterTitle()}</h1>
          </div>
          
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索公司、岗位、标签、描述..."
              className="pl-12 pr-4 py-6 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </form>

          {/* 筛选器 */}
          <div className="flex flex-wrap items-center gap-3">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "gap-2",
                    hasActiveFilters && "bg-primary/10 border-primary text-primary"
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  筛选
                  {hasActiveFilters && <span className="w-2 h-2 bg-primary rounded-full" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">筛选条件</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        清除全部
                      </Button>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* 状态筛选 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">状态</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        {STATUS_ORDER.map(statusKey => (
                          <SelectItem key={statusKey} value={statusKey}>
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", TASK_STATUS[statusKey.toUpperCase()]?.color)} />
                              {TASK_STATUS[statusKey.toUpperCase()]?.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 优先级筛选 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">优先级</label>
                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部优先级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部优先级</SelectItem>
                        {Object.entries(PRIORITY).map(([key, p]) => (
                          <SelectItem key={key.toLowerCase()} value={key.toLowerCase()}>
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", p.color)} />
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 日期范围 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">截止日期范围</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, 'MM/dd') : '开始'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, 'MM/dd') : '结束'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* 快捷筛选标签 */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedStatus !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  状态: {TASK_STATUS[selectedStatus.toUpperCase()]?.label}
                  <button onClick={() => setSelectedStatus('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedPriority !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  优先级: {PRIORITY[selectedPriority.toUpperCase()]?.label}
                  <button onClick={() => setSelectedPriority('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {dateRange.from && dateRange.to && (
                <Badge variant="secondary" className="gap-1">
                  日期: {format(dateRange.from, 'MM/dd')} - {format(dateRange.to, 'MM/dd')}
                  <button onClick={() => setDateRange({ from: null, to: null })}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>

            {/* 搜索结果数 */}
            <div className="ml-auto text-sm text-slate-500">
              找到 <span className="font-semibold text-slate-800">{filteredTasks.length}</span> 个结果
            </div>
          </div>

          {/* 最近搜索 */}
          {!searchQuery && recentSearches.length > 0 && !selectedStatus && !selectedPriority && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-400">最近搜索:</span>
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(term)}
                  className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
                >
                  {term}
                </button>
              ))}
              <button
                onClick={() => {
                  setRecentSearches([]);
                  localStorage.removeItem('search_history');
                }}
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                清除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          {/* 统计卡片 */}
          {hasActiveFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                  <div className="text-sm text-slate-500">总结果</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-status-interviewing">{stats.byStatus.interviewing || 0}</div>
                  <div className="text-sm text-slate-500">面试中</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-status-offered">{stats.byStatus.offered || 0}</div>
                  <div className="text-sm text-slate-500">已Offer</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-urgent-high">{stats.urgent}</div>
                  <div className="text-sm text-slate-500">即将截止</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 结果列表 */}
          {filteredTasks.length > 0 ? (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTaskClick(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("w-2 h-2 rounded-full", TASK_STATUS[task.status.toUpperCase()]?.color)} />
                          <span className="text-xs text-slate-500">{TASK_STATUS[task.status.toUpperCase()]?.label}</span>
                          {task.priority !== 'low' && (
                            <span className={cn("text-xs px-2 py-0.5 rounded-full", 
                              task.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            )}>
                              {PRIORITY[task.priority.toUpperCase()]?.label}优先级
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">
                          {highlightText(task.company, searchQuery)}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {highlightText(task.position, searchQuery)}
                        </p>
                        {task.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                            {highlightText(task.description, searchQuery)}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {task.endDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(task.endDate), 'yyyy-MM-dd')}
                            </span>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <span className="flex items-center gap-1 flex-wrap">
                              <Tag className="w-3 h-3" />
                              {task.tags.map((tag, idx) => (
                                <span key={idx} className={searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase()) ? "text-primary font-medium" : ""}>
                                  {tag}{idx < task.tags.length - 1 ? '、' : ''}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* 空状态 */
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">未找到匹配结果</h3>
              <p className="text-sm text-slate-500 mb-4">尝试调整搜索词或筛选条件</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  清除筛选条件
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 任务详情抽屉 */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={(updated) => {
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
        onDelete={(id) => {
          setTasks(prev => prev.filter(t => t.id !== id));
          setIsDetailOpen(false);
        }}
      />
    </div>
  );
};

export default SearchPage;
