import { LayoutGrid, BarChart3, Search, StickyNote } from "lucide-react";
import Index from "./pages/Index.jsx";
import Analytics from "./pages/Analytics.jsx";
import SearchPage from "./pages/Search.jsx";
import Scratchpad from "./pages/Scratchpad.jsx";

export const navItems = [
  {
    title: "首页",
    to: "/",
    icon: <LayoutGrid className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "洞察分析",
    to: "/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <Analytics />,
  },
  {
    title: "搜索",
    to: "/search",
    icon: <Search className="h-4 w-4" />,
    page: <SearchPage />,
  },
  {
    title: "草稿箱",
    to: "/scratchpad",
    icon: <StickyNote className="h-4 w-4" />,
    page: <Scratchpad />,
  },
];
