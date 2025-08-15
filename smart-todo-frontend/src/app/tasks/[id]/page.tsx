"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft, Sparkles, Calendar, AlertCircle, Lightbulb,
  Clock, Edit3, Save, Trash2, History, RotateCcw, Zap, Award
} from "lucide-react";
import Link from "next/link";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Task Interface
interface Task {
  id: string | number;
  title: string;
  description: string;
  category: string | null;
  category_name?: string;
  priority: "low" | "medium" | "high" | "urgent";
  priority_score: number;
  status: "pending" | "in_progress" | "completed";
  deadline: string | null;
  estimated_time?: number;
  created_at: string;
  updated_at: string;
  ai_suggestions?: string[];
}

// API Functions
const fetchTask = async (id: string): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/`);
  if (!response.ok) throw new Error('Failed to fetch task');
  return response.json();
};

const updateTask = async (id: string, data: Partial<Task>): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      category_name: data.category,
      priority: data.priority,
      status: data.status,
      deadline: data.deadline,
      estimated_time: data.estimated_time ? parseFloat(data.estimated_time.toString()) : undefined,
    }),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
};

const deleteTask = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete task');
};

export default function EditTask() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTask, setLoadingTask] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [originalTask, setOriginalTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    deadline: "",
    estimatedTime: "",
    status: "pending",
  });

  const priorityOptions = [
    { value: "low", label: "Low", color: "#10B981", bgColor: "#ECFDF5", textColor: "#065F46", icon: "🟢", description: "Can wait, not urgent" },
    { value: "medium", label: "Medium", color: "#F59E0B", bgColor: "#FFFBEB", textColor: "#92400E", icon: "🟡", description: "Important, moderate urgency" },
    { value: "high", label: "High", color: "#EF4444", bgColor: "#FEF2F2", textColor: "#991B1B", icon: "🔴", description: "Urgent, needs attention" },
    { value: "urgent", label: "Urgent", color: "#8B5CF6", bgColor: "#F3E8FF", textColor: "#5B21B6", icon: "🟣", description: "Critical, immediate action" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending", color: "#F59E0B", bgColor: "#FFFBEB", textColor: "#92400E", icon: "⏳", description: "Not started yet" },
    { value: "in_progress", label: "In Progress", color: "#06B6D4", bgColor: "#F0F9FF", textColor: "#0C4A6E", icon: "🔄", description: "Currently working on" },
    { value: "completed", label: "Completed", color: "#10B981", bgColor: "#ECFDF5", textColor: "#065F46", icon: "✅", description: "Task finished" },
  ];

  const categoryOptions = [
    { name: "Work", icon: "💼", color: "#3B82F6", description: "Professional tasks" },
    { name: "Personal", icon: "👤", color: "#10B981", description: "Personal goals" },
    { name: "Health", icon: "💊", color: "#EF4444", description: "Health & wellness" },
    { name: "Learning", icon: "📚", color: "#F59E0B", description: "Education & skills" },
    { name: "Family", icon: "👨‍👩‍👧‍👦", color: "#8B5CF6", description: "Family matters" },
    { name: "Finance", icon: "💰", color: "#059669", description: "Money & investments" },
    { name: "Travel", icon: "✈️", color: "#06B6D4", description: "Travel & adventure" },
    { name: "Shopping", icon: "🛒", color: "#EC4899", description: "Purchases & errands" },
    { name: "Other", icon: "📋", color: "#6B7280", description: "Miscellaneous" },
  ];

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) return;
      
      setLoadingTask(true);
      setError(null);
      
      try {
        const task = await fetchTask(taskId);
        
        setOriginalTask(task);
        setFormData({
          title: task.title,
          description: task.description || "",
          category: task.category_name || task.category || "",
          priority: task.priority,
          deadline: task.deadline ? task.deadline.slice(0, 16) : "",
          estimatedTime: task.estimated_time ? task.estimated_time.toString() : "",
          status: task.status,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load task');
      } finally {
        setLoadingTask(false);
      }
    };

    loadTask();
  }, [taskId]);

  // Check for changes
  useEffect(() => {
    if (originalTask) {
      const hasModifications =
        formData.title !== originalTask.title ||
        formData.description !== (originalTask.description || "") ||
        formData.category !== (originalTask.category_name || originalTask.category || "") ||
        formData.priority !== originalTask.priority ||
        formData.deadline !== (originalTask.deadline ? originalTask.deadline.slice(0, 16) : "") ||
        formData.status !== originalTask.status;

      setHasChanges(hasModifications);
    }
  }, [formData, originalTask]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const getAISuggestions = async () => {
    if (!formData.title.trim()) return;

    setLoading(true);
    setShowAiSuggestions(true);

    setTimeout(() => {
      const mockSuggestions = [
        `🔄 Consider updating "${formData.title}" based on current progress and new requirements`,
        `📈 Task complexity analysis: Current scope suggests ${Math.floor(Math.random() * 3) + 2}-${Math.floor(Math.random() * 3) + 5} hours total effort`,
        `🎯 Optimization tip: Break remaining work into ${Math.floor(Math.random() * 2) + 2} focused sessions`,
        `⚡ Progress boost: ${formData.status === "in_progress" ? "You're 60% there!" : "Ready to start strong!"} - maintain momentum`,
        `🔗 Related tasks: Consider linking with other ${formData.category} category items for efficiency`,
        `📊 Smart scheduling: Best completion window is ${Math.random() > 0.5 ? "this week" : "next 3 days"} based on your pattern`,
        `💡 Quality tip: Add specific success criteria to ensure clear completion standards`,
      ];
      setAiSuggestions(mockSuggestions);
      setLoading(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || !originalTask) return;

    setSaving(true);
    setError(null);

    try {
      await updateTask(taskId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority as any,
        status: formData.status as any,
        deadline: formData.deadline || null,
        estimated_time: formData.estimatedTime ? parseFloat(formData.estimatedTime) : undefined,
      });

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await deleteTask(taskId);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      setLoading(false);
    }
  };

  const resetToOriginal = () => {
    if (originalTask) {
      setFormData({
        title: originalTask.title,
        description: originalTask.description || "",
        category: originalTask.category_name || originalTask.category || "",
        priority: originalTask.priority,
        deadline: originalTask.deadline ? originalTask.deadline.slice(0, 16) : "",
        estimatedTime: originalTask.estimated_time ? originalTask.estimated_time.toString() : "",
        status: originalTask.status,
      });
    }
  };

  const getSelectedPriority = () => priorityOptions.find((p) => p.value === formData.priority);
  const getSelectedStatus = () => statusOptions.find((s) => s.value === formData.status);
  const getSelectedCategory = () => categoryOptions.find((c) => c.name === formData.category);

  // Loading state
  if (loadingTask) {
    return (
      <div className="min-h-screen min-w-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>Loading Task</h2>
          <p style={{ color: "var(--muted-foreground)" }}>Fetching task details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !originalTask) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>Error Loading Task</h2>
          <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>{error}</p>
          <Link href="/dashboard">
            <Button className="btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!originalTask) {
    return (
      <div className="min-h-screen min-w-screen flex  items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>Task Not Found</h2>
          <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>The task you're looking for doesn't exist or has been deleted.</p>
          <Link href="/dashboard">
            <Button className="btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen min-w-screen p-4 sm:p-6"
      style={{
        background: "linear-gradient(135deg, var(--background) 0%, var(--secondary/30) 50%, var(--background) 100%)",
      }}
    >
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-6 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-800 bg-clip-text text-transparent tracking-tight">
                Edit Task
              </h1>
              {hasChanges && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full border border-amber-300 dark:border-amber-700">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-amber-700 dark:text-amber-300 font-medium text-sm">Unsaved Changes</span>
                </div>
              )}
            </div>

            <p className="text-xl max-w-3xl mx-auto leading-relaxed text-muted-foreground">
              Update your task details with AI-powered insights and optimization suggestions
            </p>

            {/* Task History Info */}
            <div className="max-w-lg mx-auto mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <History className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Created: {new Date(originalTask.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Updated: {new Date(originalTask.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-8">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="xl:col-span-3">
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader className="pb-8">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
                      <Edit3 className="h-8 w-8 text-orange-600" />
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Task Editor
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    {hasChanges && (
                      <Button onClick={resetToOriginal} variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    )}
                    <Button onClick={handleDelete} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" disabled={loading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-10 px-8 pb-8">
                <form onSubmit={handleSubmit}>
                  {/* Title Input */}
                  <div className="space-y-4">
                    <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">Task Title *</label>
                    <Input
                      placeholder="e.g., Complete quarterly report, Learn React hooks..."
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="text-xl py-6 border-3 transition-all duration-300 focus:ring-4 bg-white/70 dark:bg-slate-700/70"
                      style={{
                        borderColor: formData.title !== originalTask?.title ? "#F59E0B" : formData.title ? "#3B82F6" : "var(--border)",
                        borderWidth: "2px",
                      }}
                      required
                      disabled={saving}
                    />
                    {formData.title !== originalTask?.title && (
                      <div className="flex items-center space-x-3 text-base p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Zap className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <span className="text-amber-700 dark:text-amber-300 font-medium">Title modified - AI will analyze the new scope</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">Description</label>
                    <textarea
                      placeholder="Describe your task in detail..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="w-full h-32 p-5 text-lg resize-none border-2 rounded-xl transition-all duration-300 focus:ring-4 bg-white/70 dark:bg-slate-700/70"
                      style={{
                        borderColor: formData.description !== (originalTask?.description || "") ? "#F59E0B" : formData.description ? "#3B82F6" : "var(--border)",
                        color: "var(--foreground)",
                      }}
                      disabled={saving}
                    />
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-5">
                    <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">Current Status</label>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {statusOptions.map((option) => {
                        const isSelected = formData.status === option.value;
                        const isChanged = formData.status !== originalTask?.status;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange("status", option.value)}
                            disabled={saving}
                            style={{
                              "--ring-color": option.color,
                              backgroundColor: isSelected ? option.bgColor : "var(--secondary)",
                              borderColor: isSelected ? option.color : isChanged && isSelected ? "#F59E0B" : "var(--border)",
                            } as React.CSSProperties}
                            className={`group p-6 rounded-2xl text-center transition-all duration-300 border-2 hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSelected ? "shadow-2xl ring-4 ring-opacity-30" : "hover:shadow-xl"
                            } ${isSelected ? "ring-[var(--ring-color)]" : ""}`}
                          >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">{option.icon}</div>
                            <div className="text-base font-bold mb-1" style={{ color: isSelected ? option.textColor : "var(--foreground)" }}>
                              {option.label}
                            </div>
                            <div className="text-xs opacity-80 text-muted-foreground">{option.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-5">
                    <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">Category</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                      {categoryOptions.map((category) => {
                        const isSelected = formData.category === category.name;
                        return (
                          <button
                            key={category.name}
                            type="button"
                            onClick={() => handleInputChange("category", category.name)}
                            disabled={saving}
                            className={`group p-5 rounded-2xl text-center transition-all duration-300 border-2 hover:scale-110 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSelected ? "shadow-2xl ring-4 ring-opacity-30" : "hover:shadow-xl"
                            }`}
                            style={{
                              backgroundColor: isSelected ? category.color + "15" : "var(--secondary)",
                              borderColor: isSelected ? category.color : "var(--border)",
                            }}
                          >
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{category.icon}</div>
                            <div className="text-sm font-bold mb-1" style={{ color: isSelected ? category.color : "var(--foreground)" }}>
                              {category.name}
                            </div>
                            <div className="text-xs opacity-70 text-muted-foreground">{category.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-5">
                    <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">Priority Level</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {priorityOptions.map((option) => {
                        const isSelected = formData.priority === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange("priority", option.value)}
                            disabled={saving}
                            style={{
                              "--ring-color": option.color,
                              backgroundColor: isSelected ? option.bgColor : "var(--secondary)",
                              borderColor: isSelected ? option.color : "var(--border)",
                            } as React.CSSProperties}
                            className={`group p-6 rounded-2xl text-center transition-all duration-300 border-2 hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSelected ? "shadow-2xl ring-4 ring-opacity-30" : "hover:shadow-xl"
                            } ${isSelected ? "ring-[var(--ring-color)]" : ""}`}
                          >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">{option.icon}</div>
                            <div className="text-base font-bold mb-1" style={{ color: isSelected ? option.textColor : "var(--foreground)" }}>
                              {option.label}
                            </div>
                            <div className="text-xs opacity-80 text-muted-foreground">{option.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date and Time Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 text-xl font-bold text-gray-800 dark:text-gray-200">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        <span>Due Date</span>
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange("deadline", e.target.value)}
                        className="py-5 text-lg border-2 transition-all duration-300 focus:ring-4 bg-white/70 dark:bg-slate-700/70"
                        style={{
                          borderColor: formData.deadline !== (originalTask?.deadline ? originalTask.deadline.slice(0, 16) : "") 
                            ? "#F59E0B" : formData.deadline ? "#3B82F6" : "var(--border)",
                        }}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 text-xl font-bold text-gray-800 dark:text-gray-200">
                        <Clock className="h-6 w-6 text-purple-600" />
                        <span>Estimated Time</span>
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g., 2.5 hours"
                        min="0.5"
                        step="0.5"
                        value={formData.estimatedTime}
                        onChange={(e) => handleInputChange("estimatedTime", e.target.value)}
                        className="py-5 text-lg border-2 transition-all duration-300 focus:ring-4 bg-white/70 dark:bg-slate-700/70"
                        style={{ borderColor: formData.estimatedTime ? "#3B82F6" : "var(--border)" }}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-10">
                    <Button
                      type="submit"
                      disabled={saving || !formData.title.trim() || !hasChanges}
                      className="w-full sm:w-auto px-10 py-5 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: hasChanges ? "linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #F59E0B 100%)" 
                          : "linear-gradient(135deg, #9CA3AF 0%, #6B7280 50%, #9CA3AF 100%)",
                        color: "white",
                      }}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-4"></div>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="h-6 w-6 mr-4" />
                          {hasChanges ? "Save Changes" : "No Changes"}
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={getAISuggestions}
                      disabled={loading || !formData.title.trim() || saving}
                      variant="outline"
                      className="w-full sm:w-auto px-10 py-5 text-xl font-bold rounded-2xl border-3 hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "#8B5CF6",
                        color: "#8B5CF6",
                        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                      }}
                    >
                      <Sparkles className="h-6 w-6 mr-4" />
                      AI Optimize
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Changes Summary */}
            {hasChanges && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30">
                      <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                    <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent font-bold">
                      Changes Made
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.title !== originalTask?.title && (
                    <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Title:</span>
                      <p className="text-sm text-amber-800 dark:text-amber-200">Modified</p>
                    </div>
                  )}
                  {formData.status !== originalTask?.status && (
                    <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Status:</span>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {originalTask?.status} → {formData.status}
                      </p>
                    </div>
                  )}
                  {formData.priority !== originalTask?.priority && (
                    <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Priority:</span>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {originalTask?.priority} → {formData.priority}
                      </p>
                    </div>
                  )}
                  {formData.category !== (originalTask?.category_name || originalTask?.category || "") && (
                    <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Category:</span>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {originalTask?.category_name || originalTask?.category || "None"} → {formData.category}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {showAiSuggestions && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                      <Lightbulb className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                      AI Optimization
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse space-y-3">
                          <div className="h-4 bg-purple-200 rounded-full w-full"></div>
                          <div className="h-4 bg-purple-200 rounded-full w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg border border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-slate-800/80">
                          <p className="text-base leading-relaxed text-purple-800 dark:text-purple-200 font-medium">
                            {suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Task Preview */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <Award className="h-6 w-6 text-green-600" />
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                    Current State
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Status:</span>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-2xl">{getSelectedStatus()?.icon}</span>
                    <span
                      className="px-3 py-1 rounded-xl text-sm font-bold"
                      style={{
                        backgroundColor: getSelectedStatus()?.bgColor,
                        color: getSelectedStatus()?.textColor,
                      }}
                    >
                      {getSelectedStatus()?.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="text-3xl">{getSelectedPriority()?.icon}</span>
                  <span
                    className="px-4 py-2 rounded-xl text-base font-bold"
                    style={{
                      backgroundColor: getSelectedPriority()?.bgColor,
                      color: getSelectedPriority()?.textColor,
                    }}
                  >
                    {getSelectedPriority()?.label} Priority
                  </span>
                </div>

                {formData.category && (
                  <div className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-green-200 dark:border-green-800">
                    <span className="text-3xl">{getSelectedCategory()?.icon}</span>
                    <span
                      className="px-4 py-2 rounded-xl text-base font-bold"
                      style={{
                        backgroundColor: getSelectedCategory()?.color + "20",
                        color: getSelectedCategory()?.color,
                      }}
                    >
                      {formData.category}
                    </span>
                  </div>
                )}

                {(formData.deadline || formData.estimatedTime) && (
                  <div className="space-y-3">
                    {formData.deadline && (
                      <div className="flex items-center space-x-3 text-green-700 dark:text-green-300">
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">Due: {new Date(formData.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {formData.estimatedTime && (
                      <div className="flex items-center space-x-3 text-green-700 dark:text-green-300">
                        <Clock className="h-5 w-5" />
                        <span className="font-medium">{formData.estimatedTime} hours estimated</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
