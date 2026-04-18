import { useState, useEffect } from 'react';
import { 
  X, 
  Edit2, 
  Save, 
  Trash2, 
  Building2, 
  Briefcase, 
  Calendar, 
  Clock, 
  Tag, 
  Paperclip, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { TASK_STATUS, PRIORITY, STATUS_ORDER } from '@/lib/constants';
import { updateTask, deleteTask } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import AttachmentList from './AttachmentList';
import NoteList from './NoteList';

const TaskDetailDrawer = ({ task, isOpen, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 当任务变化时初始化编辑状态
  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setIsEditing(false);
    }
  }, [task, isOpen]);

  if (!isOpen || !task || !editedTask) return null;

  const status = TASK_STATUS[task.status.toUpperCase()] || TASK_STATUS.PREPARING;
  const priority = PRIORITY[task.priority.toUpperCase()] || PRIORITY.MEDIUM;

  // 保存编辑
  const handleSave = () => {
    setIsSaving(true);
    const updated = updateTask(task.id, editedTask);
    if (updated) {
      onUpdate?.(updated);
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  // 取消编辑
  const handleCancel = () => {
    setEditedTask({ ...task });
    setIsEditing(false);
  };

  // 删除任务
  const handleDelete = () => {
    const success = deleteTask(task.id);
    if (success) {
      onDelete?.(task.id);
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  // 更新字段
  const updateField = (field, value) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };

  // 添加标签
  const handleAddTag = (tag) => {
    if (tag && !editedTask.tags?.includes(tag)) {
      updateField('tags', [...(editedTask.tags || []), tag]);
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove) => {
    updateField('tags', editedTask.tags?.filter(t => t !== tagToRemove) || []);
  };

  // 计算紧急度
  const getUrgency = () => {
    if (!task.endDate) return null;
    const daysLeft = Math.ceil((new Date(task.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { color: 'text-slate-400', label: '已过期', bg: 'bg-slate-100' };
    if (daysLeft === 0) return { color: 'text-urgent-high', label: '今天截止', bg: 'bg-urgent-high/10' };
    if (daysLeft <= 1) return { color: 'text-urgent-high', label: '明天截止', bg: 'bg-urgent-high/10' };
    if (daysLeft <= 3) return { color: 'text-urgent-medium', label: `${daysLeft}天后截止`, bg: 'bg-urgent-medium/10' };
    return { color: 'text-slate-500', label: `${daysLeft}天后截止`, bg: 'bg-slate-100' };
  };

  const urgency = getUrgency();

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* 抽屉 */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-drawer z-50 animate-slide-in-right flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", status.color)} />
            <span className="text-sm font-medium text-slate-500">{status.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  取消
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-1"
                >
                  <Save className="w-4 h-4" />
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="text-slate-600"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* 公司和岗位 */}
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>公司名称</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={editedTask.company}
                        onChange={(e) => updateField('company', e.target.value)}
                        className="pl-10"
                        placeholder="输入公司名称"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>岗位名称</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={editedTask.position}
                        onChange={(e) => updateField('position', e.target.value)}
                        className="pl-10"
                        placeholder="输入岗位名称"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">{task.company}</h2>
                  <p className="text-lg text-slate-600">{task.position}</p>
                </div>
              )}
            </div>

            {/* 状态和信息卡片 */}
            <div className="grid grid-cols-2 gap-3">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>状态</Label>
                    <Select 
                      value={editedTask.status} 
                      onValueChange={(value) => updateField('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  <div className="space-y-2">
                    <Label>优先级</Label>
                    <Select 
                      value={editedTask.priority} 
                      onValueChange={(value) => updateField('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                </>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">状态</div>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", status.color)} />
                      <span className="font-medium text-slate-700">{status.label}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">优先级</div>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", priority.color)} />
                      <span className="font-medium text-slate-700">{priority.label}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 日期 */}
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>开始日期</Label>
                      <Input
                        type="date"
                        value={editedTask.startDate ? format(new Date(editedTask.startDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => updateField('startDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>截止日期</Label>
                      <Input
                        type="date"
                        value={editedTask.endDate ? format(new Date(editedTask.endDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => updateField('endDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {task.startDate ? format(new Date(task.startDate), 'M月d日', { locale: zhCN }) : '未设置'} 
                      {' - '}
                      {task.endDate ? format(new Date(task.endDate), 'M月d日', { locale: zhCN }) : '未设置'}
                    </span>
                  </div>
                  {urgency && (
                    <Badge variant="secondary" className={cn(urgency.bg, urgency.color, 'border-0')}>
                      {urgency.label}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              {isEditing ? (
                <>
                  <Label>描述</Label>
                  <Textarea
                    value={editedTask.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="添加任务描述..."
                    rows={4}
                  />
                </>
              ) : (
                <>
                  {task.description && (
                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
                      {task.description}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 标签 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">标签</span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {editedTask.tags?.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {tag}
                        <button 
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="添加标签..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling;
                        handleAddTag(input.value);
                        input.value = '';
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {task.tags?.length > 0 ? (
                    task.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">暂无标签</span>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* 附件区域 */}
            <div className="space-y-3">
              <AttachmentList 
                attachments={editedTask.attachments || []}
                isEditing={isEditing}
                onUpdate={(attachments) => updateField('attachments', attachments)}
              />
            </div>

            <Separator />

            {/* 笔记区域 */}
            <div className="space-y-3">
              <NoteList 
                notes={editedTask.notes || []}
                isEditing={isEditing}
                onUpdate={(notes) => updateField('notes', notes)}
              />
            </div>

            {/* 元信息 */}
            <div className="text-xs text-slate-400 space-y-1 pt-4">
              <div>创建时间: {format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm')}</div>
              <div>最后更新: {format(new Date(task.updatedAt), 'yyyy-MM-dd HH:mm')}</div>
            </div>
          </div>
        </ScrollArea>

        {/* 删除确认对话框 */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
              <DialogDescription>
                确定要删除 "{task.company} - {task.position}" 吗？此操作无法撤销。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default TaskDetailDrawer;
