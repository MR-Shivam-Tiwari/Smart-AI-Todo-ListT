"use client";
import { useState, useEffect } from "react";
import { Filter, Calendar, Tag, TrendingUp, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface FilterState {
  status: string[];
  priority: string[];
  category: string[];
  dateRange: string;
}

interface SidebarProps {
  onFilterChange: (filters: FilterState) => void;
  stats?: {
    total: number;
    completed: number;
    pending: number;
    urgent: number;
    overdue: number;
    inProgress: number;
  };
  categories?: string[];
  currentFilters?: FilterState;
}

export default function Sidebar({ 
  onFilterChange, 
  stats = { total: 0, completed: 0, pending: 0, urgent: 0, overdue: 0, inProgress: 0 },
  categories = [],
  currentFilters 
}: SidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    category: [],
    dateRange: "all",
  });

  // Sync with parent filters
  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  const statusOptions = [
    { value: "pending", label: "Pending", color: "#f59e0b" },
    { value: "in_progress", label: "In Progress", color: "#06b6d4" },
    { value: "completed", label: "Completed", color: "#10b981" },
  ];

  const priorityOptions = [
    { value: "urgent", label: "Urgent", color: "#8b5cf6" },        
    { value: "high", label: "High", color: "#ef4444" },
    { value: "medium", label: "Medium", color: "#f59e0b" },
    { value: "low", label: "Low", color: "#10b981" },
  ];

  const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "overdue", label: "Overdue" },
    { value: "no_deadline", label: "No Deadline" },
  ];

  const handleFilterChange = (type: keyof FilterState, value: string) => {
    const newFilters = { ...filters };
    
    if (type === "dateRange") {
      newFilters[type] = value;
    } else {
      const currentValues = newFilters[type] as string[];
      if (currentValues.includes(value)) {
        newFilters[type] = currentValues.filter((v) => v !== value);
      } else {
        newFilters[type] = [...currentValues, value];
      }
    }
    
    console.log('🔧 Sidebar filter change:', newFilters);
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      status: [],
      priority: [],
      category: [],
      dateRange: "all",
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.status.length > 0 || 
                          filters.priority.length > 0 || 
                          filters.category.length > 0 || 
                          filters.dateRange !== 'all';

  return (
    <div
      className="w-64 h-screen overflow-y-auto border-r"
      style={{
        backgroundColor: "var(--muted)",
        borderColor: "var(--border)",
      }}
    >
      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <Card className="task-card">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Quick Stats
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  Total Tasks
                </span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {stats.total}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  Completed
                </span>
                <span className="font-semibold text-green-600">{stats.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  In Progress
                </span>
                <span className="font-semibold text-blue-600">{stats.inProgress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  Pending
                </span>
                <span className="font-semibold text-yellow-600">{stats.pending}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Urgent</span>
                <span className="font-semibold text-red-600">{stats.urgent}</span>
              </div>
              {stats.overdue > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>Overdue</span>
                  <span className="font-semibold text-red-600">{stats.overdue}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date Range Filter */}
        <Card className="task-card">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Calendar className="h-4 w-4 mr-2 text-blue-500" />
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Date Range
              </h3>
            </div>
            <div className="space-y-2">
              {dateRangeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="dateRange"
                    checked={filters.dateRange === option.value}
                    onChange={() => handleFilterChange("dateRange", option.value)}
                    className="text-blue-600"
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--foreground)" }}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Filter */}
        <Card className="task-card">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Filter className="h-4 w-4 mr-2 text-blue-500" />
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Status
              </h3>
            </div>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(option.value)}
                    onChange={() => handleFilterChange("status", option.value)}
                    className="rounded border-gray-300"
                    style={{ accentColor: option.color }}
                  />
                  <span
                    className="px-2 py-1 rounded text-xs font-medium flex-1"
                    style={{
                      backgroundColor: option.color + "20",
                      color: option.color,
                      border: `1px solid ${option.color}40`,
                    }}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Filter */}
        <Card className="task-card">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Tag className="h-4 w-4 mr-2 text-blue-500" />
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Priority
              </h3>
            </div>
            <div className="space-y-2">
              {priorityOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(option.value)}
                    onChange={() =>
                      handleFilterChange("priority", option.value)
                    }
                    className="rounded border-gray-300"
                    style={{ accentColor: option.color }}
                  />
                  <span
                    className="px-2 py-1 rounded text-xs font-medium flex-1"
                    style={{
                      backgroundColor: option.color + "20",
                      color: option.color,
                      border: `1px solid ${option.color}40`,
                    }}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        {categories.length > 0 && (
          <Card className="task-card">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <Tag className="h-4 w-4 mr-2 text-purple-500" />
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Category
                </h3>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={() => handleFilterChange("category", category)}
                      className="rounded border-gray-300"
                      style={{ accentColor: "#8b5cf6" }}
                    />
                    <span
                      className="text-sm flex-1"
                      style={{ color: "var(--foreground)" }}
                    >
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clear Filters Button */}
        <Button
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            hasActiveFilters 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {hasActiveFilters ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </>
          ) : (
            'No Active Filters'
          )}
        </Button>

        {/* Active Filters Count */}
        {hasActiveFilters && (
          <div className="text-center">
            <span className="text-xs text-blue-600 font-medium">
              {filters.status.length + filters.priority.length + filters.category.length + (filters.dateRange !== 'all' ? 1 : 0)} active filters
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
