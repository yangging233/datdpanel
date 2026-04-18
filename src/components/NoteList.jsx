import { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Calendar,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { generateId } from '@/lib/data';

const NOTE_TYPES = {
  GENERAL: { id: 'general', label: '一般笔记', color: 'bg-slate-100 text-slate-700' },
  INTERVIEW: { id: 'interview', label: '面试复盘', color: 'bg-blue-100 text-blue-700' },
  FOLLOWUP: { id: 'followup', label: '跟进记录', color: 'bg-green-100 text-green-700' },
  QUESTION: { id: 'question', label: '问题记录', color: 'bg-orange-100 text-orange-700' },
};

const NoteItem = ({ note, isEditing, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [editedType, setEditedType] = useState(note.type);

  const noteType = NOTE_TYPES[note.type?.toUpperCase()] || NOTE_TYPES.GENERAL;

  const handleSaveEdit = () => {
    onUpdate?.({
      ...note,
      content: editedContent,
      type: editedType,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingNote(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(note.content);
    setEditedType(note.type);
    setIsEditingNote(false);
  };

  if (isEditingNote) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs">类型:</Label>
          <div className="flex gap-1">
            {Object.values(NOTE_TYPES).map((type) => (
              <button
                key={type.id}
                onClick={() => setEditedType(type.id)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors",
                  editedType === type.id ? type.color : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          rows={4}
          placeholder="输入笔记内容..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
            <X className="w-4 h-4 mr-1" />
            取消
          </Button>
          <Button size="sm" onClick={handleSaveEdit}>
            <Save className="w-4 h-4 mr-1" />
            保存
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group relative rounded-lg border transition-all",
        isExpanded ? "bg-white shadow-sm border-slate-200 p-4" : "bg-slate-50 border-transparent hover:bg-slate-100 p-3"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className={cn("text-xs", noteType.color)}>
              {noteType.label}
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(note.createdAt), 'M月d日 HH:mm', { locale: zhCN })}
            </span>
          </div>
          <div 
            className={cn(
              "text-sm text-slate-700 whitespace-pre-wrap",
              !isExpanded && "line-clamp-3"
            )}
          >
            {note.content}
          </div>
          {note.content.length > 100 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary hover:text-primary-600 mt-2"
            >
              {isExpanded ? '收起' : '展开更多'}
            </button>
          )}
        </div>
        
        {isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-8 w-8"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingNote(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(note.id)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

const NoteList = ({ notes, isEditing, onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState({
    type: 'general',
    content: '',
  });

  const handleAdd = () => {
    if (!newNote.content.trim()) return;
    
    const note = {
      id: generateId(),
      ...newNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    onUpdate?.([note, ...notes]);
    setNewNote({ type: 'general', content: '' });
    setShowAddForm(false);
  };

  const handleUpdateNote = (updatedNote) => {
    onUpdate?.(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleDeleteNote = (id) => {
    onUpdate?.(notes.filter(n => n.id !== id));
  };

  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const noteTypeCount = notes.reduce((acc, note) => {
    const type = note.type || 'general';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            笔记 ({notes.length})
          </span>
        </div>
        {isEditing && !showAddForm && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-1"
          >
            <Plus className="w-3 h-3" />
            添加笔记
          </Button>
        )}
      </div>

      {/* 笔记类型统计 */}
      {notes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(noteTypeCount).map(([type, count]) => {
            const noteType = NOTE_TYPES[type.toUpperCase()] || NOTE_TYPES.GENERAL;
            return (
              <Badge key={type} variant="secondary" className={cn("text-xs", noteType.color)}>
                {noteType.label}: {count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* 添加笔记表单 */}
      {showAddForm && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">类型:</Label>
            <div className="flex gap-1 flex-wrap">
              {Object.values(NOTE_TYPES).map((type) => (
                <button
                  key={type.id}
                  onClick={() => setNewNote(prev => ({ ...prev, type: type.id }))}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-colors",
                    newNote.type === type.id ? type.color : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            value={newNote.content}
            onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            placeholder="输入笔记内容，支持记录面试问题、跟进情况、个人感悟等..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!newNote.content.trim()}>
              添加
            </Button>
          </div>
        </div>
      )}

      {/* 笔记列表 */}
      {sortedNotes.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          暂无笔记
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isEditing={isEditing}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteList;
