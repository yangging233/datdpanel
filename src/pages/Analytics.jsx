import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Award,
  Filter,
  Download,
  RefreshCw,
  PieChart,
  Activity,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getTasks } from '@/lib/data';
import { TASK_STATUS, STATUS_ORDER, PRIORITY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 颜色配置
const COLORS = {
  preparing: '#94A3B8',
  applied: '#3B5BFF',
  screening: '#8B5CF6',
  written: '#F59E0B',
  interviewing: '#EC4899',
  offered: '#10B981',
  rejected: '#EF4444',
};

const Analytics = () => {
  const [tasks, setTasks] = useState([]);
  const [timeRange, setTimeRange] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    const data = getTasks();
    setTasks(data);
    setIsLoading(false);
  }, []);

  // 根据时间范围筛选任务
  const filteredTasks = useMemo(() => {
    if (timeRange === 'all') return tasks;
    
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = subDays(now, days);
    
    return tasks.filter(task => {
      const taskDate = parseISO(task.createdAt);
      return taskDate >= cutoffDate;
    });
  }, [tasks, timeRange]);

  // 核心统计数据
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const interviewing = filteredTasks.filter(t => t.status === 'interviewing').length;
    const offered = filteredTasks.filter(t => t.status === 'offered').length;
    const rejected = filteredTasks.filter(t => t.status === 'rejected').length;
    const applied = filteredTasks.filter(t => t.status === 'applied').length;
    const inProgress = filteredTasks.filter(t => 
      ['screening', 'written', 'interviewing'].includes(t.status)
    ).length;
    
    // 计算转化率
    const conversionRate = total > 0 ? ((offered / total) * 100).toFixed(1) : 0;
    const interviewRate = total > 0 ? ((interviewing / total) * 100).toFixed(1) : 0;
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;
    
    // 平均每个岗位的面试轮数（简化计算）
    const avgInterviews = interviewing > 0 ? 
      (filteredTasks.filter(t => t.status === 'interviewing').reduce((acc, t) => acc + (t.notes?.length || 0), 0) / interviewing).toFixed(1) 
      : 0;

    // 本周新增
    const thisWeekStart = startOfWeek(new Date(), { locale: zhCN });
    const thisWeekEnd = endOfWeek(new Date(), { locale: zhCN });
    const thisWeekCount = filteredTasks.filter(t => 
      isWithinInterval(parseISO(t.createdAt), { start: thisWeekStart, end: thisWeekEnd })
    ).length;

    return {
      total,
      interviewing,
      offered,
      rejected,
      applied,
      inProgress,
      conversionRate,
      interviewRate,
      rejectionRate,
      avgInterviews,
      thisWeekCount,
      activeCount: total - rejected - offered,
    };
  }, [filteredTasks]);

  // 状态分布数据
  const statusDistribution = useMemo(() => {
    return STATUS_ORDER.map(status => ({
      name: TASK_STATUS[status.toUpperCase()]?.label || status,
      value: filteredTasks.filter(t => t.status === status).length,
      color: COLORS[status],
      key: status,
    })).filter(item => item.value > 0);
  }, [filteredTasks]);

  // 优先级分布数据
  const priorityDistribution = useMemo(() => {
    return Object.entries(PRIORITY).map(([key, config]) => ({
      name: config.label,
      value: filteredTasks.filter(t => t.priority === key.toLowerCase()).length,
      color: config.color.replace('bg-', '#').replace('priority-low', '94A3B8').replace('priority-medium', 'F59E0B').replace('priority-high', 'EF4444'),
    }));
  }, [filteredTasks]);

  // 周趋势数据
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const weeks = eachWeekOfInterval({
      start: subDays(now, 84), // 过去12周
      end: now,
    }, { locale: zhCN });

    return weeks.map(week => {
      const weekStart = startOfWeek(week, { locale: zhCN });
      const weekEnd = endOfWeek(week, { locale: zhCN });
      
      const weekTasks = filteredTasks.filter(t => {
        const taskDate = parseISO(t.createdAt);
        return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
      });

      return {
        week: format(week, 'MM/dd', { locale: zhCN }),
        新增: weekTasks.length,
        面试中: weekTasks.filter(t => t.status === 'interviewing').length,
        Offer: weekTasks.filter(t => t.status === 'offered').length,
      };
    });
  }, [filteredTasks]);

  // 转化率漏斗数据
  const funnelData = useMemo(() => {
    const total = filteredTasks.length;
    if (total === 0) return [];

    return [
      { name: '已投递', value: filteredTasks.filter(t => t.status !== 'preparing').length, fill: COLORS.applied },
      { name: '简历筛选', value: filteredTasks.filter(t => ['screening', 'written', 'interviewing', 'offered', 'rejected'].includes(t.status)).length, fill: COLORS.screening },
      { name: '笔试/面试', value: filteredTasks.filter(t => ['written', 'interviewing', 'offered', 'rejected'].includes(t.status)).length, fill: COLORS.interviewing },
      { name: '已Offer', value: filteredTasks.filter(t => t.status === 'offered').length, fill: COLORS.offered },
    ];
  }, [filteredTasks]);

  // 最近活动
  const recentActivities = useMemo(() => {
    return [...filteredTasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
      .map(task => {
        const status = TASK_STATUS[task.status.toUpperCase()];
        const daysLeft = task.endDate ? 
          Math.ceil((new Date(task.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
        return {
          id: task.id,
          company: task.company,
          position: task.position,
          status: status?.label,
          statusColor: status?.color,
          updatedAt: task.updatedAt,
          daysLeft,
          priority: task.priority,
        };
      });
  }, [filteredTasks]);

  // 导出数据
  const handleExport = () => {
    const dataStr = JSON.stringify(filteredTasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `job-tracker-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* 头部 */}
      <div className="bg-white border-b border-slate-200 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                洞察分析
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                追踪求职进度，分析投递效果，优化求职策略
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="7d">近7天</SelectItem>
                  <SelectItem value="30d">近30天</SelectItem>
                  <SelectItem value="90d">近90天</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                导出数据
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setTasks(getTasks());
                    setIsLoading(false);
                  }, 500);
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <ScrollArea className="flex-1">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
          
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">总投递数</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
                    <p className="text-xs text-slate-400 mt-1">本周新增 +{stats.thisWeekCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">面试中</p>
                    <p className="text-2xl font-bold text-pink-600 mt-1">{stats.interviewing}</p>
                    <p className="text-xs text-slate-400 mt-1">占比 {stats.interviewRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">已获Offer</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.offered}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      转化率 {stats.conversionRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">进行中</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats.activeCount}</p>
                    <p className="text-xs text-slate-400 mt-1">含筛选、笔试阶段</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 图表区域 */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 状态分布 - 饼图 */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-slate-500" />
                  状态分布
                </CardTitle>
                <CardDescription>各阶段岗位数量占比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* 状态统计列表 */}
                <div className="mt-4 space-y-2">
                  {statusDistribution.map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{item.value}</span>
                        <span className="text-xs text-slate-400">
                          {stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 趋势分析 - 折线图 */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-500" />
                  投递趋势
                </CardTitle>
                <CardDescription>近12周新增投递与面试转化情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrend}>
                      <defs>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B5BFF" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3B5BFF" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOffer" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="week" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend iconType="circle" />
                      <Area 
                        type="monotone" 
                        dataKey="新增" 
                        stroke="#3B5BFF" 
                        fillOpacity={1} 
                        fill="url(#colorNew)" 
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Offer" 
                        stroke="#10B981" 
                        fillOpacity={1} 
                        fill="url(#colorOffer)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 转化率漏斗 & 优先级分布 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 转化率漏斗 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-slate-500" />
                  转化漏斗
                </CardTitle>
                <CardDescription>从投递到Offer的转化情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                        width={80}
                      />
                      <Tooltip 
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* 转化率说明 */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{stats.conversionRate}%</div>
                    <div className="text-xs text-slate-500">整体转化率</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{stats.rejectionRate}%</div>
                    <div className="text-xs text-slate-500">拒绝率</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{stats.avgInterviews}</div>
                    <div className="text-xs text-slate-500">平均面试轮次</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 优先级分布 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  优先级分布
                </CardTitle>
                <CardDescription>按优先级统计岗位数量</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                        {priorityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 优先级建议 */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-blue-800">优化建议：</span>
                      <span className="text-blue-700">
                        {stats.activeCount > 10 
                          ? '当前进行中的岗位较多，建议优先跟进高优先级岗位，避免精力分散。'
                          : '投递量适中，建议继续扩大投递范围，增加面试机会。'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最近活动 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-500" />
                最近更新
              </CardTitle>
              <CardDescription>最近更新的岗位状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", activity.statusColor)} />
                        <div>
                          <p className="font-medium text-slate-800">{activity.company}</p>
                          <p className="text-sm text-slate-500">{activity.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="text-xs">
                          {activity.status}
                        </Badge>
                        {activity.daysLeft !== null && activity.daysLeft >= 0 && (
                          <span className={cn(
                            "text-xs",
                            activity.daysLeft <= 3 ? "text-red-500" : "text-slate-400"
                          )}>
                            {activity.daysLeft === 0 ? '今天截止' : `${activity.daysLeft}天后截止`}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {format(new Date(activity.updatedAt), 'MM-dd HH:mm')}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    暂无最近活动
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 页脚提示 */}
          <div className="text-center text-sm text-slate-400 pb-4">
            数据最后更新：{format(new Date(), 'yyyy年MM月dd日 HH:mm')}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Analytics;
