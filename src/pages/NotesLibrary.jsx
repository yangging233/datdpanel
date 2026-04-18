import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  Briefcase,
  MessageSquare,
  FileText,
  Phone,
  HelpCircle,
  MoreHorizontal,
  Trash2,
  Edit2,
  ExternalLink,
  Clock,
  Tag,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { getAllNotes, getTasks, saveTasks } from '@/lib/data';
import { TASK_STATUS, NOTE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

// 笔记类型配置
const NOTE_TYPE_CONFIG = {
  general: { label: '一般笔记', icon: FileText, color: 'bg-slate-100 text-slate-700' },
  interview: { label: '面试复盘', icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
  followup: { label: '跟进记录', icon: Phone, color: 'bg-green-100 text-green-700' },
  question: { label: '问题记录', icon: HelpCircle, color: 'bg-orange-100 text-orange-700' },
};

const NotesLibrary = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('general');

  // 加载数据
  useEffect(() => {
    const loadData = () => {
      const allNotes = getAllNotes();
      const allTasks = getTasks();
      setNotes(allNotes);
      setTasks(allTasks);
    };
    loadData();
  }, []);

  // 筛选笔记
  const filteredNotes = useMemo(() => {
    let result = notes;

    // 类型筛选
    if (selectedType !== 'all') {
      result = result.filter(note => (note.type || 'general') === selectedType);
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note => 
        note.content?.toLowerCase().includes(query) ||
        note.taskCompany?.toLowerCase().includes(query) ||
        note.taskPosition?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notes, selectedType, searchQuery]);

  // 统计信息
  const stats = useMemo(() => {
    const total = notes.length;
    const byType = {};
    Object.keys(NOTE_TYPE_CONFIG).forEach(type => {
      byType[type] = notes.filter(n => (n.type || 'general') === type).length;
    });
    return { total, byType };
  }, [notes]);

  // 开始编辑
  const startEdit = (note) => {
    setEditingNote(note);
    setEditContent(note.content);
    setEditType(note.type || 'general');
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editContent.trim()) {
      toast.error('笔记内容不能为空');
      return;
    }

    const updatedTasks = tasks.map(task => {
      if (task.id === editingNote.taskId) {
        return {
          ...task,
          notes: task.notes.map(note => 
            note.id === editingNote.id 
              ? { ...note, content: editContent.trim(), type: editType, updatedAt: new Date().toISOString() }
              : note
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    });

    saveTasks(updatedTasks);
    setTasks(updatedTasks);
    setNotes(getAllNotes());
    setEditingNote(null);
    toast.success('笔记已更新');
  };

  // 删除笔记
  const confirmDelete = () => {
    const updatedTasks = tasks.map(task => {
      if (task.id === deletingNote.taskId) {
        return {
          ...task,
          notes: task.notes.filter(note => note.id !== deletingNote.id),
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    });

    saveTasks(updatedTasks);
    setTasks(updatedTasks);
    setNotes(getAllNotes());
    setDeletingNote(null);
    toast.success('笔记已删除');
  };

  // 跳转到任务详情
  const navigateToTask = (taskId) => {
    navigate('/', { state: { openTaskId: taskId } });
  };

  // 获取笔记类型配置
  const getNoteTypeConfig = (type) => {
    return NOTE_TYPE_CONFIG[type || 'general'] || NOTE_TYPE_CONFIG.general;
  };

  // 高亮搜索文本
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">{part}</mark> : part
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 头部 */}
      <div className="bg-white border-b border-slate-200 p-4 lg:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                笔记库
              </h1>
              <p className="text-sm text-slate-500 mt-1">查看和管理所有求职笔记</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center px-4 py-2 bg-slate-50 rounded-lg">
                <div className="font-semibold text-slate-800">{stats.total}</div>
                <div className="text-slate-400 text-xs">总笔记数</div>
              </div>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索笔记内容、公司或岗位..."
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedType('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    selectedType === 'all' 
                      ? "bg-primary text-white" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  全部
                </button>
                {Object.entries(NOTE_TYPE_CONFIG).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      selectedType === type 
                        ? config.color 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-5xl mx-auto">
          {/* 笔记类型统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(NOTE_TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              const count = stats.byType[type] || 0;
              return (
                <Card 
                  key={type} 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedType === type ? "ring-2 ring-primary" : ""
                  )}
                  onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{count}</div>
                      <div className="text-xs text-slate-500">{config.label}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 笔记列表 */}
          {filteredNotes.length > 0 ? (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const typeConfig = getNoteTypeConfig(note.type);
                const TypeIcon = typeConfig.icon;
                const status = TASK_STATUS[note.taskStatus?.toUpperCase()];

                return (
                  <Card 
                    key={note.id} 
                    className="group hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* 类型图标 */}
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", typeConfig.color)}>
                          <TypeIcon className="w-5 h-5" />
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          {/* 头部信息 */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={cn("text-xs", typeConfig.color)}>
                                {typeConfig.label}
                              </Badge>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(note.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                              </span>
                              {note.updatedAt !== note.createdAt && (
                                <span className="text-xs text-slate-300">已编辑</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-primary hover:text-primary-600"
                                onClick={() => navigateToTask(note.taskId)}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                查看任务
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEdit(note)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setDeletingNote(note)}
                                    className="text-red-500 focus:text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* 笔记内容 */}
                          <div className="text-slate-800 whitespace-pre-wrap leading-relaxed mb-3">
                            {highlightText(note.content, searchQuery)}
                          </div>

                          {/* 关联任务信息 */}
                          <div 
                            className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => navigateToTask(note.taskId)}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-700">{note.taskCompany}</span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600">{note.taskPosition}</span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1">
                              <span className={cn("w-2 h-2 rounded-full", status?.color)} />
                              <span className="text-xs text-slate-500">{status?.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* 空状态 */
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                {searchQuery || selectedType !== 'all' ? '未找到匹配笔记' : '暂无笔记'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {searchQuery || selectedType !== 'all' 
                  ? '尝试调整搜索词或筛选条件' 
                  : '在任务详情中添加笔记后，它们会显示在这里'}
              </p>
              <Button onClick={() => navigate('/')}>
                去创建笔记
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑笔记</DialogTitle>
            <DialogDescription>
              修改笔记内容和类型
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">类型:</span>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(NOTE_TYPE_CONFIG).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setEditType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      editType === type ? config.color : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              placeholder="输入笔记内容..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)}>
              取消
            </Button>
            <Button onClick={saveEdit} disabled={!editContent.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={!!deletingNote} onOpenChange={() => setDeletingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这条笔记吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingNote(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesLibrary;
