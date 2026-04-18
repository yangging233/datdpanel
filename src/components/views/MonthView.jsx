import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/TaskCard';
import { cn } from '@/lib/utils';

const MonthView = ({ tasks, onTaskClick, onDateClick, onTaskMove }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState(null);

  // 生成日历网格
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { locale: zhCN });
    const calendarEnd = endOfWeek(monthEnd, { locale: zhCN });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

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

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

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

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 头部导航 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-800">
            {format(currentDate, 'yyyy年 M月', { locale: zhCN })}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday}>
              本月
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          共 {tasks.length} 个任务
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="py-3 text-center text-sm font-medium text-slate-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
        {calendarDays.map((date, index) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const isDragOver = dragOverDate && isSameDay(date, dragOverDate);

          return (
            <div
              key={dateKey}
              onClick={() => onDateClick?.(date)}
              onDragOver={(e) => handleDragOver(e, date)}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => handleDrop(e, date)}
              className={cn(
                'min-h-[100px] p-2 border-b border-r border-slate-100 transition-colors',
                !isCurrentMonth && 'bg-slate-50/50',
                isTodayDate && 'bg-primary/5',
                isDragOver && 'bg-primary/10 border-primary border-dashed'
              )}
            >
              {/* 日期数字 */}
              <div className={cn(
                'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                isTodayDate 
                  ? 'bg-primary text-white' 
                  : isCurrentMonth 
                    ? 'text-slate-700' 
                    : 'text-slate-400'
              )}>
                {format(date, 'd')}
              </div>

              {/* 任务列表 */}
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    view="month"
                    compact
                    onClick={onTaskClick}
                    onDragStart={() => {}}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-slate-500 px-2 py-1 bg-slate-50 rounded">
                    +{dayTasks.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
