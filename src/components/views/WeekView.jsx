import { useState, useMemo } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
  startOfDay,
  addMinutes,
  isSameDay
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/TaskCard';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const WeekView = ({ tasks, onTaskClick, onTaskMove }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState(null);

  // 生成周日期
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { locale: zhCN });
    const weekEnd = endOfWeek(currentDate, { locale: zhCN });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

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

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 头部导航 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-800">
            {format(weekDays[0], 'M月d日', { locale: zhCN })} - {format(weekDays[6], 'M月d日', { locale: zhCN })}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday}>
              本周
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50">
        <div className="py-3 text-center text-sm font-medium text-slate-400 border-r border-slate-100">
          时间
        </div>
        {weekDays.map((date) => {
          const isTodayDate = isToday(date);
          return (
            <div 
              key={date.toISOString()}
              className={cn(
                'py-3 text-center border-r border-slate-100 last:border-r-0',
                isTodayDate && 'bg-primary/5'
              )}
            >
              <div className={cn(
                'text-sm font-medium',
                isTodayDate ? 'text-primary' : 'text-slate-600'
              )}>
                {format(date, 'EEE', { locale: zhCN })}
              </div>
              <div className={cn(
                'text-lg font-semibold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full',
                isTodayDate ? 'bg-primary text-white' : 'text-slate-700'
              )}>
                {format(date, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* 时间网格 */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 min-h-full">
          {/* 时间列 */}
          <div className="border-r border-slate-100 bg-slate-50">
            {HOURS.map((hour) => (
              <div 
                key={hour} 
                className="h-16 border-b border-slate-100 flex items-start justify-center pt-2"
              >
                <span className="text-xs text-slate-400">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* 日期列 */}
          {weekDays.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[dateKey] || [];
            const isDragOver = dragOverDate && isSameDay(date, dragOverDate);

            return (
              <div 
                key={date.toISOString()}
                className={cn(
                  'border-r border-slate-100 last:border-r-0 relative',
                  isDragOver && 'bg-primary/5'
                )}
                onDragOver={(e) => handleDragOver(e, date)}
                onDragLeave={() => setDragOverDate(null)}
                onDrop={(e) => handleDrop(e, date)}
              >
                {/* 时间网格线 */}
                {HOURS.map((hour) => (
                  <div 
                    key={hour} 
                    className="h-16 border-b border-slate-50 relative"
                  >
                    {/* 半点线 */}
                    <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-100" />
                  </div>
                ))}

                {/* 任务卡片（简化显示） */}
                <div className="absolute inset-x-1 top-1 space-y-1">
                  {dayTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      view="week"
                      compact
                      onClick={onTaskClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
