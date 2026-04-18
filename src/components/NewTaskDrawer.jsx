import { useState } from 'react';
import { 
  X, 
  Plus,
  Building2, 
  Briefcase, 
  Calendar, 
  Tag,
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
import { TASK_STATUS, PRIORITY, STATUS_ORDER } from '@/lib/constants';
import { createTask } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const NewTaskDrawer = ({ isOpen, onClose, onCreate, defaultStatus = 'preparing' }) => {
  const [task, setTask] = useState({
    company: '',
    position: '',
    status: defaultStatus,
    priority: 'medium',
    startDate: new Date().toISOString(),
    endDate: null,
    description: '',
    tags: [],
    attachments: [],
    notes: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setTask(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = (tag) => {
    if (tag && !task.tags?.includes(tag)) {
      updateField('tags', [...(task.tags || []), tag]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    updateField('tags', task.tags?.filter(t => t !== tagToRemove) || []);
  };

  const handleSubmit = () => {
    if (!task.company || !task.position) return;
    
    setIsSaving(true);
    const newTask = createTask(task);
    onCreate?.(newTask);
    setIsSaving(false);
    
    // 重置表单
    setTask({
      company: '',
      position: '',
      status: 'preparing',
      priority: 'medium',
      startDate: new Date().toISOString(),
      endDate: null,
      description: '',
      tags: [],
      attachments: [],
      notes: [],
    });
    onClose();
  };

  const canSubmit = task.company.trim() && task.position.trim();

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
          <h2 className="text-lg font-semibold text-slate-800">新建求职任务</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || isSaving}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              创建
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* 必填信息 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="required">公司名称</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={task.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    className="pl-10"
                    placeholder="例如：字节跳动"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="required">岗位名称</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={task.position}
                    onChange={(e) => updateField('position', e.target.value)}
                    className="pl-10"
                    placeholder="例如：前端开发工程师"
                  />
                </div>
              </div>
            </div>

            {/* 状态和优先级 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select 
                  value={task.status} 
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
                  value={task.priority} 
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
            </div>

            {/* 日期 */}
            <div className="space-y-3">
              <Label>时间安排</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">开始日期</Label>
                  <Input
                    type="date"
                    value={task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => updateField('startDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">截止日期</Label>
                  <Input
                    type="date"
                    value={task.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => updateField('endDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
              </div>
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={task.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="添加任务描述，如投递渠道、内推人信息等..."
                rows={4}
              />
            </div>

            {/* 标签 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <Label>标签</Label>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {task.tags?.map((tag, idx) => (
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
                    placeholder="添加标签，按回车确认..."
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
            </div>

            {/* 快速提示 */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">💡 提示</p>
              <p className="text-blue-600/80">
                创建任务后，您可以添加附件（简历、作品集链接）和笔记（面试复盘、跟进记录）来更好地管理求职进度。
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default NewTaskDrawer;
