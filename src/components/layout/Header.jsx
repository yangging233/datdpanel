import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Settings,
  LayoutGrid,
  ChevronDown,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import QuickScratchpadDrawer from '@/components/QuickScratchpadDrawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

const Header = ({
  onNotificationClick,
  onSettingsClick,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [migrateItem, setMigrateItem] = useState(null);
  const [migrateForm, setMigrateForm] = useState({ company: '', position: '' });
  const navigate = useNavigate();

  // 全局快捷键监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Shift + N 打开速记浮层
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsScratchpadOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 处理迁移草稿为任务
  const handleMigrate = (item) => {
    setMigrateItem(item);
    setMigrateForm({ company: '', position: '' });
  };

  // 确认迁移
  const confirmMigrate = () => {
    if (!migrateForm.company.trim() || !migrateForm.position.trim()) return;
    
    // 触发迁移逻辑，这里通过事件通知 Scratchpad 页面处理
    const event = new CustomEvent('migrate-scratchpad', {
      detail: {
        item: migrateItem,
        taskData: {
          company: migrateForm.company.trim(),
          position: migrateForm.position.trim(),
        }
      }
    });
    window.dispatchEvent(event);
    
    setMigrateItem(null);
    navigate('/scratchpad');
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-lg hidden sm:block">求职看板</span>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 速记按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            onClick={() => setIsScratchpadOpen(true)}
          >
            <StickyNote className="w-4 h-4" />
            <span>速记</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-500 ml-1">
              Ctrl+Shift+N
            </kbd>
          </Button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-600 hover:text-slate-800"
            onClick={onNotificationClick}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-interviewing rounded-full animate-pulse" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-slate-800"
            onClick={onSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* 用户头像 */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-300 flex items-center justify-center text-white font-medium text-sm">
                U
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-card border border-slate-100 py-1 animate-scale-in">
                <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  个人设置
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  数据导出
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 速记浮层 */}
      <QuickScratchpadDrawer
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        onMigrate={handleMigrate}
      />

      {/* 迁移确认对话框 */}
      <Dialog open={!!migrateItem} onOpenChange={() => setMigrateItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转为正式任务</DialogTitle>
            <DialogDescription>
              将草稿迁移为求职任务，填写公司和岗位信息。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4">
              <span className="text-slate-400">原草稿: </span>
              {migrateItem?.content}
            </div>
            
            <div className="space-y-2">
              <Label>公司名称</Label>
              <Input
                value={migrateForm.company}
                onChange={(e) => setMigrateForm(prev => ({ ...prev, company: e.target.value }))}
                placeholder="例如：字节跳动"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label>岗位名称</Label>
              <Input
                value={migrateForm.position}
                onChange={(e) => setMigrateForm(prev => ({ ...prev, position: e.target.value }))}
                placeholder="例如：前端开发工程师"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMigrateItem(null)}>
              取消
            </Button>
            <Button 
              onClick={confirmMigrate}
              disabled={!migrateForm.company.trim() || !migrateForm.position.trim()}
            >
              确认迁移
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
