import { useState, useRef } from 'react';
import { 
  Paperclip, 
  FileText, 
  Image, 
  File, 
  Link, 
  ExternalLink, 
  Trash2, 
  Plus,
  Upload,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/data';

const ATTACHMENT_TYPES = {
  FILE: 'file',
  LINK: 'link',
  EMAIL: 'email',
};

const getFileIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image;
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return FileText;
  return File;
};

const AttachmentItem = ({ attachment, isEditing, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const renderIcon = () => {
    switch (attachment.type) {
      case ATTACHMENT_TYPES.LINK:
        return <Link className="w-4 h-4 text-blue-500" />;
      case ATTACHMENT_TYPES.EMAIL:
        return <MailIcon className="w-4 h-4 text-orange-500" />;
      default:
        const Icon = getFileIcon(attachment.name);
        return <Icon className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleClick = () => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all group",
        attachment.url ? "cursor-pointer hover:bg-slate-50 hover:border-slate-300" : "bg-slate-50",
        isHovered && isEditing && "border-red-200 bg-red-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
        {renderIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-700 truncate">
          {attachment.name}
        </div>
        {attachment.size && (
          <div className="text-xs text-slate-400">
            {(attachment.size / 1024 / 1024).toFixed(2)} MB
          </div>
        )}
        {attachment.description && (
          <div className="text-xs text-slate-500 truncate mt-0.5">
            {attachment.description}
          </div>
        )}
      </div>
      {isEditing && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(attachment.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
      {attachment.url && !isEditing && (
        <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100" />
      )}
    </div>
  );
};

const MailIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const AttachmentList = ({ attachments, isEditing, onUpdate }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAttachment, setNewAttachment] = useState({
    type: ATTACHMENT_TYPES.LINK,
    name: '',
    url: '',
    description: '',
  });
  const fileInputRef = useRef(null);

  const handleAdd = () => {
    if (!newAttachment.name) return;
    
    const attachment = {
      id: generateId(),
      ...newAttachment,
      createdAt: new Date().toISOString(),
    };
    
    onUpdate?.([...attachments, attachment]);
    setNewAttachment({ type: ATTACHMENT_TYPES.LINK, name: '', url: '', description: '' });
    setShowAddDialog(false);
  };

  const handleDelete = (id) => {
    onUpdate?.(attachments.filter(a => a.id !== id));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 模拟文件上传，实际项目中应上传到服务器
      const attachment = {
        id: generateId(),
        type: ATTACHMENT_TYPES.FILE,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        description: '',
        createdAt: new Date().toISOString(),
      };
      onUpdate?.([...attachments, attachment]);
    }
  };

  const groupedAttachments = attachments.reduce((acc, att) => {
    acc[att.type] = acc[att.type] || [];
    acc[att.type].push(att);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            附件 ({attachments.length})
          </span>
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1"
            >
              <Upload className="w-3 h-3" />
              上传文件
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              添加链接
            </Button>
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          暂无附件
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              isEditing={isEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 添加附件对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加附件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>类型</Label>
              <div className="flex gap-2">
                {[
                  { value: ATTACHMENT_TYPES.LINK, label: '链接', icon: Link },
                  { value: ATTACHMENT_TYPES.EMAIL, label: '邮件', icon: MailIcon },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={newAttachment.type === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewAttachment(prev => ({ ...prev, type: value }))}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>名称</Label>
              <Input
                value={newAttachment.name}
                onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                placeholder={newAttachment.type === ATTACHMENT_TYPES.EMAIL ? '邮件主题' : '链接名称'}
              />
            </div>
            <div className="space-y-2">
              <Label>{newAttachment.type === ATTACHMENT_TYPES.EMAIL ? '邮箱地址' : 'URL'}</Label>
              <Input
                value={newAttachment.url}
                onChange={(e) => setNewAttachment(prev => ({ ...prev, url: e.target.value }))}
                placeholder={newAttachment.type === ATTACHMENT_TYPES.EMAIL ? 'recruiter@company.com' : 'https://...'}
              />
            </div>
            <div className="space-y-2">
              <Label>描述（可选）</Label>
              <Input
                value={newAttachment.description}
                onChange={(e) => setNewAttachment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="添加备注..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAdd} disabled={!newAttachment.name}>
              添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttachmentList;
