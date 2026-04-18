import { useState, useEffect, useRef } from 'react';
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lightbulb,
  Search,
  MoreHorizontal,
  Keyboard,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getScratchpad, saveScratchpad, createScratchpadItem, migrateScratchpadToTask } from '@/lib/data';
import { generateId } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Scratchpad = () => {
  const [items, setItems] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [migratingItem, setMigratingItem] = useState(null);
  const [migrateForm, setMigrateForm] = useState({ company: '', position: '' });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // 加载草稿数据
  useEffect(() => {
    const data = getScratchpad();
    setItems(data);
  }, []);

  // 监听迁移事件（来自速记浮层）
  useEffect(() => {
    const handleMigrateEvent = (e) => {
      const { item, taskData } = e.detail;
      setMigratingItem(item);
      setMigrateForm(taskData);
    };

    window.addEventListener('migrate-scratchpad', handleMigrateEvent);
    return () => window.removeEventListener('migrate-scratchpad', handleMigrateEvent);
  }, []);

  // 添加草稿
  const handleAdd = () => {
    if (!newContent.trim()) {
      toast.error('请输入内容');
      return;
    }
    
    const newItem = {
      id: generateId(),
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isMigrated: false,
    };
    
    const updated = [newItem, ...items];
    setItems(updated);
    saveScratchpad(updated);
    setNewContent('');
    
    toast.success('草稿已保存');
    
    // 保持焦点
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // 删除草稿
  const handleDelete = (id) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    saveScratchpad(updated);
    toast.success('草稿已删除');
  };

  // 开始编辑
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editContent.trim()) return;
    
    const updated = items.map(item => 
      item.id === editingId 
        ? { ...item, content: editContent.trim(), updatedAt: new Date().toISOString() }
        : item
    );
    setItems(updated);
    saveScratchpad(updated);
    setEditingId(null);
    setEditContent('');
    toast.success('修改已保存');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // 迁移为任务
  const handleMigrate = () => {
    if (!migrateForm.company.trim() || !migrateForm.position.trim()) return;
    
    const taskData = {
      company: migrateForm.company.trim(),
      position: migrateForm.position.trim(),
      status: 'preparing',
      priority: 'medium',
      description: migratingItem.content,
      startDate: new Date().toISOString(),
      endDate: null,
      tags: ['来自草稿箱'],
      attachments: [],
      notes: [{
        id: generateId(),
        type: 'general',
        content: `从草稿箱迁移: ${migratingItem.content}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
    };
    
    const newTask = migrateScratchpadToTask(migratingItem.id, taskData);
    if (newTask) {
      // 更新本地状态
      const updated = items.map(item => 
        item.id === migratingItem.id 
          ? { ...item, isMigrated: true, migratedToTaskId: newTask.id }
          : item
      );
      setItems(updated);
      saveScratchpad(updated);
      setMigratingItem(null);
      setMigrateForm({ company: '', position: '' });
      
      toast.success('已迁移为任务', {
        description: `${newTask.company} - ${newTask.position}`,
      });
      
      // 提示并跳转到首页
      setTimeout(() => navigate('/'), 500);
    }
  };

  // 筛选草稿
  const filteredItems = items.filter(item => 
    !item.isMigrated && 
    (item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const migratedItems = items.filter(item => item.isMigrated);

  // 统计
  const stats = {
    total: items.length,
    active: items.filter(i => !i.isMigrated).length,
    migrated: migratedItems.length,
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 头部 */}
      <div className="bg-white border-b border-slate-200 p-4 lg:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <StickyNote className="w-6 h-6 text-primary" />
                草稿箱
              </h1>
              <p className="text-sm text-slate-500 mt-1">快速记录想法，稍后整理为正式任务</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-slate-800">{stats.active}</div>
                <div className="text-slate-400 text-xs">待处理</div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <div className="font-semibold text-slate-800">{stats.migrated}</div>
                <div className="text-slate-400 text-xs">已迁移</div>
              </div>
            </div>
          </div>

          {/* 快速输入 */}
          <div className="relative">
            <Input
              ref={inputRef}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="记录一个想法... (按回车快速保存)"
              className="pr-24 py-6 text-base bg-slate-50 border-slate-200 focus:bg-white"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-500">
                回车
              </kbd>
              <Button 
                size="sm"
                onClick={handleAdd}
                disabled={!newContent.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            </div>
          </div>

          {/* 搜索 */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索草稿内容..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* 草稿列表 */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 快捷提示 */}
          <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
            <Keyboard className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-700 font-medium mb-1">快捷键提示</p>
              <p className="text-xs text-blue-600/80">
                按 <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-200 mx-1">Ctrl+Shift+N</kbd> 
                可从任何页面快速打开速记浮层，无需切换页面即可记录想法。
              </p>
            </div>
          </div>

          {/* 活跃草稿 */}
          {filteredItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                待处理草稿
                <Badge variant="secondary">{filteredItems.length}</Badge>
              </h3>
              {filteredItems.map((item) => (
                <Card 
                  key={item.id}
                  className="group hover:shadow-md transition-shadow border-l-4 border-l-primary"
                >
                  <CardContent className="p-4">
                    {editingId === item.id ? (
                      // 编辑模式
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            <X className="w-4 h-4 mr-1" />
                            取消
                          </Button>
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-4 h-4 mr-1" />
                            保存
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 查看模式
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {item.content}
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(item.createdAt), 'M月d日 HH:mm', { locale: zhCN })}
                              </span>
                              {item.updatedAt !== item.createdAt && (
                                <span className="text-slate-300">已编辑</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMigratingItem(item)}
                              className="text-primary hover:text-primary-600"
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              转为任务
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEdit(item)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-500 focus:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 已迁移草稿 */}
          {migratedItems.length > 0 && !searchQuery && (
            <div className="space-y-3">
              <Separator />
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                已迁移为任务
                <Badge variant="secondary" className="bg-green-100 text-green-700">{migratedItems.length}</Badge>
              </h3>
              <div className="opacity-60">
                {migratedItems.slice(0, 3).map((item) => (
                  <Card key={item.id} className="mb-3 border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-600 line-clamp-2">{item.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              已迁移
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {format(new Date(item.createdAt), 'M月d日', { locale: zhCN })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {migratedItems.length > 3 && (
                  <p className="text-center text-sm text-slate-400 py-2">
                    还有 {migratedItems.length - 3} 个已迁移草稿
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                {searchQuery ? '未找到匹配草稿' : '暂无草稿'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {searchQuery 
                  ? '尝试其他搜索词' 
                  : '在上方输入框记录你的第一个想法，或使用 Ctrl+Shift+N 快速打开速记浮层'}
              </p>
              {!searchQuery && (
                <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    <span>Ctrl+Shift+N 快速速记</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 迁移对话框 */}
      <Dialog open={!!migratingItem} onOpenChange={() => setMigratingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转为正式任务</DialogTitle>
            <DialogDescription>
              将草稿迁移为求职任务，填写公司和岗位信息后即可在首页管理。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4">
              <span className="text-slate-400">原草稿: </span>
              {migratingItem?.content}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">公司名称</label>
              <Input
                value={migrateForm.company}
                onChange={(e) => setMigrateForm(prev => ({ ...prev, company: e.target.value }))}
                placeholder="例如：字节跳动"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">岗位名称</label>
              <Input
                value={migrateForm.position}
                onChange={(e) => setMigrateForm(prev => ({ ...prev, position: e.target.value }))}
                placeholder="例如：前端开发工程师"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>迁移后，原草稿内容将自动保存为该任务的笔记，方便后续回顾。</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMigratingItem(null)}>
              取消
            </Button>
            <Button 
              onClick={handleMigrate}
              disabled={!migrateForm.company.trim() || !migrateForm.position.trim()}
            >
              确认迁移
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scratchpad;
