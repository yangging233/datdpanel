import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TASK_STATUS, PRIORITY } from '@/lib/constants';
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  Tag, 
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Paperclip,
  MessageSquare
} from 'lucide-react';

const TaskCard = ({ 
  task, 
  view = 'month', 
  onClick, 
  draggable = true,
  onDragStart,
  onDragEnd,
  compact = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const status = TASK_STATUS[task.status.toUpperCase()] || TASK_STATUS.PREPARING;
  const priority = PRIORITY[task.priority.toUpperCase()] || PRIORITY.MEDIUM;

  // 计算紧急度
  const getUrgency = () => {
    if (!task.endDate) return null;
    const daysLeft = Math.ceil((new Date(task.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { color: 'text-slate-400', label: '已过期' };
    if (daysLeft === 0) return { color: 'text-urgent-high animate-pulse', label: '今天截止' };
    if (daysLeft <= 1) return { color: 'text-urgent-high', label: '明天截止' };
    if (daysLeft <= 3) return { color: 'text-urgent-medium', label: `${daysLeft}天后截止` };
    return null;
  };

  const urgency = getUrgency();

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('taskStatus', task.status);
    onDragStart?.(task);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  // 紧凑模式（用于日历网格）
  if (compact) {
    return (
      <div
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onClick?.(task)}
        className={cn(
          'task-card cursor-pointer rounded-md px-2 py-1.5 text-xs border-l-2 mb-1',
          'bg-white hover:shadow-card transition-all',
          isDragging && 'opacity-60 scale-95',
          status.borderColor || 'border-slate-300'
        )}
      >
        <div className="flex items-center gap-1 mb-0.5">
          <span className={cn("w-1.5 h-1.5 rounded-full", status.color)} />
          <span className="font-medium text-slate-700 truncate flex-1">{task.company}</span>
        </div>
        <div className="text-slate-500 truncate">{task.position}</div>
        {urgency && (
          <div className={cn("text-[10px] mt-0.5 flex items-center gap-0.5", urgency.color)}>
            <Clock className="w-3 h-3" />
            {urgency.label}
          </div>
        )}
      </div>
    );
  }

  // 标准卡片（用于看板）
  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick?.(task)}
      className={cn(
        'task-card cursor-pointer bg-white rounded-xl p-4 border border-slate-200',
        'hover:border-primary/30 hover:shadow-card-hover transition-all duration-200',
        isDragging && 'opacity-60 scale-95 rotate-2',
        view === 'board' && 'mb-3'
      )}
    >
      {/* 头部：状态标识 + 优先级 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", status.color)} />
          <span className="text-xs font-medium text-slate-500">{status.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn("w-2 h-2 rounded-full", priority.color)} title={priority.label} />
          <button 
            className="p-1 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 公司 + 岗位 */}
      <div className="mb-3">
        <h4 className="font-semibold text-slate-800 mb-1 line-clamp-1">{task.company}</h4>
        <p className="text-sm text-slate-600 line-clamp-1">{task.position}</p>
      </div>

      {/* 截止日期 */}
      {task.endDate && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs mb-3",
          urgency?.color || 'text-slate-500'
        )}>
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(task.endDate).toLocaleDateString('zh-CN', { 
            month: 'short', 
            day: 'numeric' 
          })}</span>
          {urgency && <span className="font-medium">{urgency.label}</span>}
        </div>
      )}

      {/* 标签 */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 2).map((tag, idx) => (
            <span 
              key={idx}
              className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* 底部：附件数 + 笔记数 */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        {task.attachments?.length > 0 && (
          <div className="flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5" />
            <span>{task.attachments.length}</span>
          </div>
        )}
        {task.notes?.length > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{task.notes.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
