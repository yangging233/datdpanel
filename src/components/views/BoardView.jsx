import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/TaskCard';
import { STATUS_ORDER, TASK_STATUS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const BoardView = ({ tasks, onTaskClick, onTaskMove, onNewTask }) => {
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // 按状态分组任务
  const tasksByStatus = useMemo(() => {
    const grouped = {};
    STATUS_ORDER.forEach(status => {
      grouped[status] = tasks.filter(t => t.status === status);
    });
    return grouped;
  }, [tasks]);

  const handleDragOver = (e, status) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('taskStatus');
    setDragOverColumn(null);
    
    if (taskId && currentStatus !== status) {
      onTaskMove?.(taskId, { status });
    }
  };

  // 看板列宽度计算
  const getColumnWidth = () => {
    const count = STATUS_ORDER.length;
    if (count <= 4) return 'w-72';
    if (count <= 5) return 'w-64';
    return 'w-56';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">看板视图</h2>
        <div className="text-sm text-slate-500">
          共 {tasks.length} 个任务 · 拖拽卡片变更状态
        </div>
      </div>

      {/* 看板列 */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {STATUS_ORDER.map((statusKey) => {
            const status = TASK_STATUS[statusKey.toUpperCase()];
            const columnTasks = tasksByStatus[statusKey] || [];
            const isDragOver = dragOverColumn === statusKey;

            return (
              <div 
                key={statusKey}
                className={cn(
                  'flex-shrink-0 flex flex-col h-full rounded-xl transition-all duration-200',
                  getColumnWidth(),
                  isDragOver 
                    ? 'bg-primary/5 border-2 border-dashed border-primary' 
                    : 'bg-slate-50 border border-slate-200'
                )}
                onDragOver={(e) => handleDragOver(e, statusKey)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, statusKey)}
              >
                {/* 列头部 */}
                <div className="p-3 border-b border-slate-200 bg-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-2.5 rounded-full", status.color)} />
                      <span className="font-semibold text-slate-700">{status.label}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* 任务列表 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      view="board"
                      onClick={onTaskClick}
                    />
                  ))}

                  {/* 空状态 */}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                      暂无任务
                    </div>
                  )}

                  {/* 快速添加按钮 */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-slate-600 border-2 border-dashed border-slate-200 hover:border-slate-300"
                    onClick={() => onNewTask?.({ status: statusKey })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    添加任务
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BoardView;
