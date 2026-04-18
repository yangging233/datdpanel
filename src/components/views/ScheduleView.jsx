import { useState, useMemo } from 'react';
import { 
  format, 
  startOfDay,
  addDays,
  isToday,
  isTomorrow,
  isYesterday,
  isSameDay,
  parseISO,
  compareAsc
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/TaskCard';
import { cn } from '@/lib/utils';

const ScheduleView = ({ tasks, onTaskClick, onTaskMove }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState(null);

  // 获取所有有任务的唯一日期，并按时间排序
  const datesWithTasks = useMemo(() => {
    const dateSet = new Set();
    tasks.forEach(task => {
      if (task.endDate) {
        const dateKey = format(new Date(task.endDate), 'yyyy-MM-dd');
        dateSet.add(dateKey);
      }
    });
    // 转换为日期对象并排序
    return Array.from(dateSet)
      .map(dateStr => new Date(dateStr))
      .sort(compareAsc);
  }, [tasks]);

  // 按日期分组任务
  const tasksByDate = useMemo(() => {
    const grouped = {};
    tasks.forEach(task => {
      if (task.endDate) {
        const dateKey = format(new Date(task.endDate), 'yyyy-MM-dd');
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // 分页导航：找到当前日期附近的有任务日期
  const currentIndex = useMemo(() => {
    const today = new Date();
    const index = datesWithTasks.findIndex(date => 
      isSameDay(date, currentDate) || date >= currentDate
    );
    return index === -1 ? datesWithTasks.length : index;
  }, [datesWithTasks, currentDate]);

  // 显示前后各5个有任务的日期（或根据屏幕调整）
  const visibleDates = useMemo(() => {
    const range = 5; // 前后各显示5个日期
    const start = Math.max(0, currentIndex - range);
    const end = Math.min(datesWithTasks.length, currentIndex + range + 1);
    return datesWithTasks.slice(start, end);
  }, [datesWithTasks, currentIndex]);

  const getDateLabel = (date) => {
    if (isToday(date)) return '今天';
    if (isTomorrow(date)) return '明天';
    if (isYesterday(date)) return '昨天';
    return format(date, 'M月d日', { locale: zhCN });
  };

  const getWeekdayLabel = (date) => {
    return format(date, 'EEE', { locale: zhCN });
  };

  const handlePrevDate = () => {
    if (currentIndex > 0) {
      setCurrentDate(datesWithTasks[currentIndex - 1]);
    }
  };

  const handleNextDate = () => {
    if (currentIndex < datesWithTasks.length - 1) {
      setCurrentDate(datesWithTasks[currentIndex + 1]);
    }
  };

  const handleToday = () => {
    const today = new Date();
    const todayIndex = datesWithTasks.findIndex(date => isSameDay(date, today));
    if (todayIndex !== -1) {
      setCurrentDate(datesWithTasks[todayIndex]);
    } else {
      setCurrentDate(today);
    }
  };

  const handleDragOver = (e, date) => {
    e.preventDefault();
    setDragOverDate(date);
  };

  const handleDrop = (e, date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverDate(null);
    if (taskId) {
      onTaskMove?.(taskId, date);
    }
  };

  // 计算统计信息
  const taskCount = tasks.filter(t => t.endDate).length;
  const upcomingCount = tasks.filter(t => {
    if (!t.endDate) return false;
    const daysLeft = Math.ceil((new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-800">日程表</h2>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevDate}
              disabled={currentIndex <= 0}
              className={cn(currentIndex <= 0 && "opacity-50 cursor-not-allowed")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday}>
              今天
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextDate}
              disabled={currentIndex >= datesWithTasks.length - 1}
              className={cn(currentIndex >= datesWithTasks.length - 1 && "opacity-50 cursor-not-allowed")}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">
              共 <span className="font-semibold text-slate-800">{datesWithTasks.length}</span> 个日期
            </span>
          </div>
          {upcomingCount > 0 && (
            <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-medium">
              未来7天 {upcomingCount} 个任务
            </div>
          )}
        </div>
      </div>

      {/* 日程列表 */}
      <div className="flex-1 overflow-auto p-4">
        {datesWithTasks.length === 0 ? (
          // 空状态
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">暂无日程安排</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              当前没有任何任务的截止日期。创建新任务后，相关日期将自动显示在这里。
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {visibleDates.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayTasks = tasksByDate[dateKey] || [];
              const isTodayDate = isToday(date);
              const isDragOver = dragOverDate && isSameDay(date, dragOverDate);

              return (
                <div 
                  key={dateKey}
                  className={cn(
                    'flex gap-4 p-4 rounded-xl transition-all border',
                    isTodayDate 
                      ? 'bg-primary/5 border-primary/20 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-200',
                    isDragOver && 'bg-primary/10 border-dashed border-primary'
                  )}
                  onDragOver={(e) => handleDragOver(e, date)}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={(e) => handleDrop(e, date)}
                >
                  {/* 日期标签 */}
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className={cn(
                      'text-2xl font-bold',
                      isTodayDate ? 'text-primary' : 'text-slate-700'
                    )}>
                      {format(date, 'd')}
                    </div>
                    <div className="text-sm text-slate-500">
                      {getWeekdayLabel(date)}
                    </div>
                    <div className={cn(
                      "text-xs mt-1 px-2 py-0.5 rounded-full inline-block",
                      isTodayDate ? 'bg-primary text-white' : 'text-slate-400'
                    )}>
                      {getDateLabel(date)}
                    </div>
                  </div>

                  {/* 任务列表 */}
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dayTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          view="schedule"
                          onClick={onTaskClick}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* 显示更多提示 */}
            {visibleDates.length < datesWithTasks.length && (
              <div className="text-center py-4 text-sm text-slate-400">
                使用导航按钮查看更多日期
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleView;
