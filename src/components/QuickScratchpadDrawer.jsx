import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Plus, 
  StickyNote, 
  Clock, 
  ArrowRight,
  Sparkles,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createScratchpadItem, getScratchpad } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

const QuickScratchpadDrawer = ({ isOpen, onClose, onMigrate }) => {
  const [content, setContent] = useState('');
  const [recentItems, setRecentItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  // 加载最近的草稿
  useEffect(() => {
    if (isOpen) {
      const items = getScratchpad();
      setRecentItems(items.filter(i => !i.isMigrated).slice(0, 5));
      // 自动聚焦到输入框
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 处理保存
  const handleSave = () => {
    if (!content.trim()) {
      toast.error('请输入内容');
      return;
    }

    setIsSaving(true);
    const newItem = createScratchpadItem(content.trim());
    
    // 更新最近列表
    setRecentItems(prev => [newItem, ...prev].slice(0, 5));
    setContent('');
    setIsSaving(false);
    
    toast.success('已保存到草稿箱', {
      description: '按 Ctrl+Shift+N 快速打开',
    });
  };

  // 处理快捷键
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape 关闭
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // 快速迁移为任务
  const handleQuickMigrate = (item) => {
    onClose();
    onMigrate?.(item);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* 浮层 */}
      <div className="fixed right-4 top-20 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl z-50 animate-scale-in border border-slate-100 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">快速速记</h3>
              <p className="text-xs text-slate-500">记录灵感，稍后整理</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-500">
              <Keyboard className="w-3 h-3" />
              Ctrl+Shift+N
            </kbd>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 输入区域 */}
        <div className="p-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="记录一个想法...&#10;支持多行输入&#10;Ctrl+Enter 快速保存"
              className="min-h-[120px] resize-none bg-slate-50 border-slate-200 focus:bg-white pr-12"
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-400">
              {content.length > 0 && `${content.length} 字`}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-3 h-3" />
              <span>AI 将在后续版本帮您整理</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                取消
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={!content.trim() || isSaving}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                保存
              </Button>
            </div>
          </div>
        </div>

        {/* 最近草稿 */}
        {recentItems.length > 0 && (
          <>
            <div className="h-px bg-slate-100 mx-4" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-700">最近草稿</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 text-primary"
                  onClick={() => {
                    onClose();
                    window.location.href = '#/scratchpad';
                  }}
                >
                  查看全部
                </Button>
              </div>
              
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {recentItems.map((item) => (
                    <div 
                      key={item.id}
                      className="group p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                      onClick={() => handleQuickMigrate(item)}
                    >
                      <p className="text-sm text-slate-700 line-clamp-2 mb-2">
                        {item.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(item.createdAt), 'M月d日 HH:mm', { locale: zhCN })}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickMigrate(item);
                          }}
                        >
                          转为任务
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* 空状态提示 */}
        {recentItems.length === 0 && (
          <div className="px-4 pb-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-500 mb-2">暂无草稿</p>
              <p className="text-xs text-slate-400">
                在上方输入想法，快速记录下来
              </p>
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            按 <kbd className="px-1.5 py-0.5 bg-white rounded border text-slate-600 mx-1">Ctrl+Enter</kbd> 保存，<kbd className="px-1.5 py-0.5 bg-white rounded border text-slate-600 mx-1">Esc</kbd> 关闭
          </p>
        </div>
      </div>
    </>
  );
};

export default QuickScratchpadDrawer;
