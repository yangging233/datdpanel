import { useState, useMemo } from 'react';
import { 
  format, 
  startOfDay,
  addMinutes,
  isToday,
  parseISO
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, Calendar, ChevronLeft, ChevronRight, ListTodo, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/TaskCard';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TimelineView = ({ tasks, onTaskClick, onTaskMove }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [focusMode, setFocusMode] = useState(false);
  const [dragOverHour, setDragOverHour] = useState(null);

  // 获取当天的任务
  const dayTasks = useMemo(() => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    return tasks.filter(task => {
      if (!task.endDate) return false;
      return format(new Date(task.endDate), 'yyyy-MM-dd') === dateKey;
    });
  }, [tasks, currentDate]);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleDragOver = (e, hour) => {
    e.preventDefault();
    setDragOverHour(hour);
  };

  const handleDrop = (e, hour) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverHour(null);
    if (taskId) {
      // 设置时间为拖拽的小时
      const newDate = new Date(currentDate);
      newDate.setHours(hour, 0, 0, 0);
      onTaskMove?.(taskId, newDate);
    }
  };

  // 计算当前时间位置
  const currentTimePosition = useMemo(() => {
    if (!isToday(currentDate)) return null;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours * 60 + minutes) / 1440 * 100;
  }, [currentDate]);

  return (
    <div className={cn(
      'flex flex-col h-full rounded-xl border border-slate-200 overflow-hidden transition-all duration-300',
      focusMode ? 'bg-slate-900' : 'bg-white'
    )}>
      {/* 头部 */}
      <div className={cn(
        'flex items-center justify-between p-4 border-b',
        focusMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100'
      )}>
        <div className="flex items-center gap-4">
          <h2 className={cn(
            'text-xl font-semibold',
            focusMode ? 'text-white' : 'text-slate-800'
          )}>
            {isToday(currentDate) ? '今天' : format(currentDate, 'yyyy年M月d日', { locale: zhCN })}
          </h2>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevDay}
              className={focusMode ? 'text-slate-400 hover:text-white' : ''}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleToday}
              className={focusMode ? 'text-slate-400 hover:text-white' : ''}
            >
              今天
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextDay}
              className={focusMode ? 'text-slate-400 hover:text-white' : ''}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 准备模式切换 */}
          <Button
            variant={focusMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFocusMode(!focusMode)}
            className={cn(
              'gap-2',
              focusMode && 'bg-primary hover:bg-primary-600'
            )}
          >
            <Timer className="w-4 h-4" />
            {focusMode ? '退出准备模式' : '准备模式'}
          </Button>

          <div className={cn(
            'text-sm',
            focusMode ? 'text-slate-400' : 'text-slate-500'
          )}>
            共 {dayTasks.length} 个任务
          </div>
        </div>
      </div>

      {/* 准备模式覆盖层 */}
      {focusMode && (
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center gap-4 text-white">
            <ListTodo className="w-5 h-5 text-primary" />
            <span className="font-medium">面试准备清单</span>
            <span className="text-slate-400 text-sm">今日重点：{dayTasks[0]?.company || '暂无'}</span>
          </div>
        </div>
      )}

      {/* 时间轴 */}
      <div className="flex-1 overflow-auto relative">
        <div className="flex">
          {/* 时间标签列 */}
          <div className={cn(
            'w-16 flex-shrink-0 border-r',
            focusMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'
          )}>
            {HOURS.map((hour) => (
              <div 
                key={hour} 
                className={cn(
                  'h-20 flex items-start justify-center pt-2 text-xs',
                  focusMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 时间网格 */}
          <div className="flex-1 relative">
            {/* 当前时间线 */}
            {currentTimePosition !== null && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
              </div>
            )}

            {/* 小时网格 */}
            {HOURS.map((hour) => (
              <div 
                key={hour}
                className={cn(
                  'h-20 border-b relative group',
                  focusMode ? 'border-slate-700' : 'border-slate-100',
                  dragOverHour === hour && 'bg-primary/10'
                )}
                onDragOver={(e) => handleDragOver(e, hour)}
                onDragLeave={() => setDragOverHour(null)}
                onDrop={(e) => handleDrop(e, hour)}
              >
                {/* 半点标记 */}
                <div className={cn(
                  'absolute top-1/2 left-0 right-0 border-b border-dashed',
                  focusMode ? 'border-slate-700/50' : 'border-slate-100'
                )} />
              </div>
            ))}

            {/* 任务卡片（按时间位置显示） */}
            <div className="absolute inset-x-2 top-2">
              {dayTasks.map((task, index) => {
                // 根据任务结束时间计算位置（简化处理）
                const endDate = new Date(task.endDate);
                const hour = endDate.getHours();
                const top = hour * 80 + 8; // 每小时80px + 偏移
                
                return (
                  <div 
                    key={task.id}
                    style={{ 
                      position: 'absolute', 
                      top: `${top}px`,
                      left: 0,
                      right: 0,
                      zIndex: 5 + index
                    }}
                  >
                    <TaskCard
                      task={task}
                      view="timeline"
                      compact={false}
                      onClick={onTaskClick}
                    />
                  </div>
                );
              })}
            </div>

            {/* 空状态 */}
            {dayTasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                  'text-center',
                  focusMode ? 'text-slate-500' : 'text-slate-400'
                )}>
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>今天没有安排任务</p>
                  <p className="text-sm mt-1 opacity-70">拖拽任务到时间轴来安排</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
