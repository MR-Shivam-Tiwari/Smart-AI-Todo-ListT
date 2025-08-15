"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TaskCard from "@/app/tasks/TaskCard";
import QuickAddTask from "@/app/tasks/QuickAddTask";
import { ReactElement } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Search,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

/* ---------- Task Type ---------- */
export interface Task {
  id: string | number;
  title: string;
  description: string;
  category: string | null;
  category_name?: string;
  priority: "low" | "medium" | "high" | "urgent";
  priority_score: number;
  status: "pending" | "in_progress" | "completed";
  deadline: string | null;
  created_at: string;
  updated_at: string;
  ai_suggestions?: string[];
}

/* ---------- Filter Interface ---------- */
export interface FilterState {
  status: string[];
  priority: string[];
  category: string[];
  dateRange: string;
}

/* ---------- API helpers ---------- */
const fetchTasks = async (): Promise<Task[]> => {
  const res = await fetch(`${API}/tasks/`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
};

const createTask = async (payload: { title: string; description?: string }) => {
  const res = await fetch(`${API}/tasks/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      priority: "medium",
      category_name: "General",
    }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
};

const updateStatus = async (id: string | number, status: string) => {
  const res = await fetch(`${API}/tasks/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
};

const deleteTask = async (id: string | number) => {
  const res = await fetch(`${API}/tasks/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
};

/* ---------- Dashboard ---------- */
export default function Dashboard() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filtered, setFiltered] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    category: [],
    dateRange: "all",
  });

  /* ---------- initial fetch ---------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTasks();
        console.log("✅ Fetched tasks:", data.length);
        setTasks(data);
        setFiltered(data);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- enhanced filter logic ---------- */
  const applyFilters = useCallback(
    (raw = tasks, q = searchQuery, f = filters) => {
      if (!Array.isArray(raw)) return setFiltered([]);

      let list = [...raw];
      console.log("🔍 Applying filters:", {
        total: list.length,
        search: q,
        filters: f,
      });

      // Status filter
      if (f.status.length > 0) {
        list = list.filter((t) => f.status.includes(t.status));
        console.log("📊 After status filter:", list.length);
      }

      // Priority filter
      if (f.priority.length > 0) {
        list = list.filter((t) => f.priority.includes(t.priority));
        console.log("⚡ After priority filter:", list.length);
      }

      // Category filter
      if (f.category.length > 0) {
        list = list.filter((t) => {
          const taskCategory = t.category_name || t.category || "";
          return f.category.includes(taskCategory);
        });
        console.log("🏷️ After category filter:", list.length);
      }

      // Date range filter
      if (f.dateRange !== "all") {
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        list = list.filter((t) => {
          if (!t.deadline) return f.dateRange === "no_deadline";

          const taskDate = new Date(t.deadline);
          const taskDateOnly = new Date(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate()
          );

          switch (f.dateRange) {
            case "today":
              return taskDateOnly.getTime() === today.getTime();
            case "this_week":
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay());
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              return taskDateOnly >= weekStart && taskDateOnly <= weekEnd;
            case "overdue":
              return taskDateOnly < today && t.status !== "completed";
            case "no_deadline":
              return !t.deadline;
            default:
              return true;
          }
        });
        console.log("📅 After date filter:", list.length);
      }

      // Search filter
      if (q) {
        list = list.filter(
          (t) =>
            t.title.toLowerCase().includes(q.toLowerCase()) ||
            t.description.toLowerCase().includes(q.toLowerCase()) ||
            (t.category_name &&
              t.category_name.toLowerCase().includes(q.toLowerCase())) ||
            (t.category && t.category.toLowerCase().includes(q.toLowerCase()))
        );
        console.log("🔎 After search filter:", list.length);
      }

      // Sorting
      list.sort((a, b) => {
        switch (sortBy) {
          case "priority":
            return b.priority_score - a.priority_score;
          case "deadline":
            const aDate = a.deadline
              ? new Date(a.deadline).getTime()
              : Number.MAX_SAFE_INTEGER;
            const bDate = b.deadline
              ? new Date(b.deadline).getTime()
              : Number.MAX_SAFE_INTEGER;
            return aDate - bDate;
          case "created":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "status":
            return (
              ({ pending: 0, in_progress: 1, completed: 2 } as any)[a.status] -
              ({ pending: 0, in_progress: 1, completed: 2 } as any)[b.status]
            );
          default:
            return 0;
        }
      });

      console.log("✅ Final filtered list:", list.length);
      setFiltered(list);
    },
    [tasks, searchQuery, filters, sortBy]
  );

  /* ---------- handlers ---------- */
  const handleFilterChange = (newFilters: FilterState) => {
    console.log("🔧 Filter change:", newFilters);
    setFilters(newFilters);
    applyFilters(tasks, searchQuery, newFilters);
  };

  const handleSearch = (q: string) => {
    console.log("🔍 Search change:", q);
    setSearchQuery(q);
    applyFilters(tasks, q, filters);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await updateStatus(id, status);
      const next = tasks.map((t) => (t.id === id ? updated : t));
      setTasks(next);
      applyFilters(next, searchQuery, filters);
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Status update failed");
    }
  };

  const handleAddTask = async (payload: {
    title: string;
    description: string;
  }) => {
    try {
      const newTask = await createTask(payload);
      const next = [...tasks, newTask];
      setTasks(next);
      applyFilters(next, searchQuery, filters);
    } catch (err) {
      console.error("Add task failed:", err);
      alert("Failed to add task");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      const next = tasks.filter((t) => t.id !== id);
      setTasks(next);
      applyFilters(next, searchQuery, filters);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
    }
  };

  const handleEdit = (t: Task) => router.push(`/tasks/${t.id}`);

  /* ---------- recompute on sort change ---------- */
  useEffect(() => {
    applyFilters(tasks, searchQuery, filters);
  }, [sortBy, applyFilters]);

  /* ---------- quick stats ---------- */
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const urgent = tasks.filter((t) => t.priority === "urgent").length;
  const overdue = tasks.filter(
    (t) =>
      t.deadline &&
      new Date(t.deadline) < new Date() &&
      t.status !== "completed"
  ).length;
  const completionRate = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  // Get unique categories for sidebar
  const categories = [
    ...new Set(tasks.map((t) => t.category_name || t.category).filter(Boolean)),
  ];

  /* ---------- loading / error ---------- */
  if (loading)
    return (
      <LoadingUI
        onFilterChange={handleFilterChange}
        stats={{}}
        categories={[]}
      />
    );
  if (error)
    return (
      <ErrorUI
        msg={error}
        onFilterChange={handleFilterChange}
        stats={{}}
        categories={[]}
      />
    );

  const stats = {
    total: tasks.length,
    completed,
    pending,
    urgent,
    overdue,
    inProgress,
  };

  /* ---------- render ---------- */
  return (
    <div className="flex w-full h-screen">
      <div className="w-64 flex-shrink-0 h-full">
        <Sidebar
          onFilterChange={handleFilterChange}
          stats={stats}
          categories={categories.filter((c): c is string => c !== null)}
          currentFilters={filters}
        />
      </div>

      <div
        className="flex-1 h-full overflow-y-auto custom-scrollbar"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="p-6 min-h-full">
          {/* header */}
          <Header />

          {/* stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total"
              value={tasks.length}
              icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
              ring="blue"
              sub={`${completionRate}% done`}
            />
            <StatCard
              title="Completed"
              value={completed}
              icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
              ring="green"
            />
            <StatCard
              title="In Progress"
              value={inProgress}
              icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
              ring="blue"
            />
            <StatCard
              title="Urgent"
              value={urgent}
              icon={<AlertCircle className="h-6 w-6 text-red-600" />}
              ring="red"
              sub={overdue ? `${overdue} overdue` : "On track"}
            />
          </div>

          {/* search + sort */}
          <Card className="task-card mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-10 h-12"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="text-sm"
                    style={{ color: "var(--foreground)" }}
                  >
                    Sort by:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input h-12 px-3 rounded-lg"
                    style={{
                      backgroundColor: "var(--background)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="priority">Priority</option>
                    <option value="deadline">Deadline</option>
                    <option value="created">Created</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active filters indicator */}
          {(filters.status.length > 0 ||
            filters.priority.length > 0 ||
            filters.category.length > 0 ||
            filters.dateRange !== "all") && (
            <Card className="task-card mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Active filters:
                  </span>
                  {filters.status.map((status) => (
                    <span
                      key={status}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      Status: {status}
                    </span>
                  ))}
                  {filters.priority.map((priority) => (
                    <span
                      key={priority}
                      className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs"
                    >
                      Priority: {priority}
                    </span>
                  ))}
                  {filters.category.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                    >
                      Category: {category}
                    </span>
                  ))}
                  {filters.dateRange !== "all" && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      Date: {filters.dateRange}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    ({filtered.length} tasks shown)
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* quick add */}
          <div className="mb-6">
            <QuickAddTask onAddTask={handleAddTask} />
          </div>

          {/* tasks list */}
          <TasksSection
            tasks={filtered}
            search={searchQuery}
            handlers={{ handleStatusChange, handleEdit, handleDelete }}
          />
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #64748b;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

/* ---------- sub-components ---------- */
function Header() {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-4">
        <div>
          <h1
            className="text-4xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            Welcome back! 👋
          </h1>
          <p
            className="text-lg mt-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Here's what's happening today
          </p>
        </div>
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Calendar className="h-4 w-4" />
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  ring,
}: {
  title: string;
  value: number;
  sub?: string;
  icon: ReactElement;
  ring: "blue" | "green" | "red";
}) {
  const color = ring === "green" ? "green" : ring === "red" ? "red" : "blue";
  return (
    <Card className="task-card group hover:shadow-lg transition-transform hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {title}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {value}
            </p>
            {sub && (
              <p
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {sub}
              </p>
            )}
          </div>
          <div
            className={`h-12 w-12 bg-${color}-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TasksSection({
  tasks,
  search,
  handlers,
}: {
  tasks: Task[];
  search: string;
  handlers: {
    handleStatusChange: (id: string, status: string) => void;
    handleEdit: (t: Task) => void;
    handleDelete: (id: string) => void;
  };
}) {
  if (!tasks.length)
    return (
      <Card className="task-card">
        <CardContent className="p-12 text-center">
          <p
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            {search ? "No matching tasks" : "No tasks yet"}
          </p>
          <p style={{ color: "var(--muted-foreground)" }}>
            {search
              ? "Try adjusting your search or filters"
              : "Use the quick add form above to create one"}
          </p>
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      {tasks.map((task, i) => (
        <div
          key={task.id}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <TaskCard
            task={task}
            onStatusChange={handlers.handleStatusChange}
            onEdit={handlers.handleEdit}
            onDelete={handlers.handleDelete}
          />
        </div>
      ))}
    </div>
  );
}

function LoadingUI({
  onFilterChange,
  stats,
  categories,
}: {
  onFilterChange: (f: FilterState) => void;
  stats: any;
  categories: string[];
}) {
  return (
    <div className="flex w-full h-screen">
      <div className="w-64 flex-shrink-0">
        <Sidebar
          onFilterChange={onFilterChange}
          stats={stats}
          categories={categories}
        />
      </div>
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center">
          <div className="animate-spin h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-6" />
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Loading Dashboard…
          </h2>
        </div>
      </div>
    </div>
  );
}

function ErrorUI({
  msg,
  onFilterChange,
  stats,
  categories,
}: {
  msg: string;
  onFilterChange: (f: FilterState) => void;
  stats: any;
  categories: string[];
}) {
  return (
    <div className="flex w-full h-screen">
      <div className="w-64 flex-shrink-0">
        <Sidebar
          onFilterChange={onFilterChange}
          stats={stats}
          categories={categories}
        />
      </div>
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <p className="text-red-600 text-lg">{msg}</p>
      </div>
    </div>
  );
}
