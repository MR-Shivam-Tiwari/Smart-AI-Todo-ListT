"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Tag,
  AlertCircle,
  Lightbulb,
  Clock,
  Target,
  CheckCircle,
  Star,
  TrendingUp,
  Zap,
  Award,
  Brain,
  Rocket,
  BarChart3,
  Users,
  Cpu,
  Layers,
} from "lucide-react";
import Link from "next/link";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface TaskPayload {
  title: string;
  description?: string;
  category_name?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  estimated_time?: number;
}

interface AIStatus {
  ai_connected: boolean;
  provider: string;
  model: string;
  status: string;
  message: string;
  test_response?: string;
}

interface AISuggestions {
  suggestions: string[];
  ai_powered: boolean;
  generated_at: string;
  priority_analysis?: {
    recommended_priority: string;
    priority_score: number;
    reasoning: string;
  };
  deadline_suggestion?: {
    recommended_deadline: string;
    reasoning: string;
  };
  category_analysis?: {
    recommended_category: string;
    confidence: number;
    reasoning: string;
  };
  enhancement_suggestions?: {
    enhanced_title?: string;
    enhanced_description?: string;
    tags?: string[];
  };
}

interface ContextData {
  total_entries: number;
  recent_tasks: string[];
  current_workload: string;
  user_patterns: {
    preferred_categories: string[];
    average_completion_time: number;
    peak_productivity_hours: string[];
  };
  statistics?: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    in_progress_tasks: number;
    completion_rate: number;
  };
}

// API Functions
const createTask = async (data: TaskPayload) => {
  const response = await fetch(`${API_BASE_URL}/tasks/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create task');
  }

  return response.json();
};

const getAISuggestions = async (taskData: Partial<TaskPayload>): Promise<AISuggestions> => {
  const response = await fetch(`${API_BASE_URL}/tasks/get_ai_suggestions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error('Failed to get AI suggestions');
  }

  return response.json();
};

const getContextualAnalysis = async (): Promise<ContextData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/contextual_analysis/`);
    if (!response.ok) {
      throw new Error('Failed to fetch contextual analysis');
    }
    return await response.json();
  } catch (error) {
    console.error('Contextual analysis error:', error);
    return {
      total_entries: 0,
      recent_tasks: [],
      current_workload: 'Low',
      user_patterns: {
        preferred_categories: ['Work'],
        average_completion_time: 2.5,
        peak_productivity_hours: ['09:00-11:00', '14:00-16:00']
      },
      statistics: {
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        in_progress_tasks: 0,
        completion_rate: 0
      }
    };
  }
};

const checkAIStatus = async (): Promise<AIStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/ai_status/`);
    if (!response.ok) {
      throw new Error('Failed to check AI status');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI status check failed:', error);
    return {
      ai_connected: false,
      provider: 'Google Gemini',
      model: 'gemini-1.5-flash',
      status: 'Connection failed',
      message: 'Unable to check AI status - server may be down'
    };
  }
};

export default function CreateTask() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [aiConnected, setAiConnected] = useState(false);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [aiEnhancementData, setAiEnhancementData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    deadline: "",
    estimatedTime: "",
  });

  // Load AI status and context on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setDataLoading(true);
        console.log('🔄 Loading initial data...');
        
        const [aiStatusResult, contextResult] = await Promise.all([
          checkAIStatus(),
          getContextualAnalysis()
        ]);
        
        console.log('🤖 AI Status:', aiStatusResult);
        console.log('📊 Context Data:', contextResult);
        
        setAiStatus(aiStatusResult);
        setAiConnected(aiStatusResult.ai_connected);
        setContextData(contextResult);
        
        if (aiStatusResult.ai_connected) {
          console.log('✅ Gemini AI is connected and ready');
        } else {
          console.log('❌ Gemini AI is not connected:', aiStatusResult.message);
        }
        
      } catch (err) {
        console.error('❌ Failed to load initial data:', err);
        setError('Failed to initialize AI services');
      } finally {
        setDataLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  const priorityOptions = [
    {
      value: "low",
      label: "Low",
      color: "#10B981",
      bgColor: "#ECFDF5",
      textColor: "#065F46",
      icon: "🟢",
      description: "Can wait, not urgent",
    },
    {
      value: "medium",
      label: "Medium",
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      textColor: "#92400E",
      icon: "🟡",
      description: "Important, moderate urgency",
    },
    {
      value: "high",
      label: "High",
      color: "#EF4444",
      bgColor: "#FEF2F2",
      textColor: "#991B1B",
      icon: "🔴",
      description: "Urgent, needs attention",
    },
    {
      value: "urgent",
      label: "Urgent",
      color: "#8B5CF6",
      bgColor: "#F3E8FF",
      textColor: "#5B21B6",
      icon: "🟣",
      description: "Critical, immediate action",
    },
  ];

  const categoryOptions = [
    {
      name: "Work",
      icon: "💼",
      color: "#3B82F6",
      description: "Professional tasks",
    },
    {
      name: "Personal",
      icon: "👤",
      color: "#10B981",
      description: "Personal goals",
    },
    {
      name: "Health",
      icon: "💊",
      color: "#EF4444",
      description: "Health & wellness",
    },
    {
      name: "Learning",
      icon: "📚",
      color: "#F59E0B",
      description: "Education & skills",
    },
    {
      name: "Family",
      icon: "👨‍👩‍👧‍👦",
      color: "#8B5CF6",
      description: "Family matters",
    },
    {
      name: "Finance",
      icon: "💰",
      color: "#059669",
      description: "Money & investments",
    },
    {
      name: "Travel",
      icon: "✈️",
      color: "#06B6D4",
      description: "Travel & adventure",
    },
    {
      name: "Shopping",
      icon: "🛒",
      color: "#EC4899",
      description: "Purchases & errands",
    },
    {
      name: "Other",
      icon: "📋",
      color: "#6B7280",
      description: "Miscellaneous",
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (error) setError(null);
  };

  const handleGetAISuggestions = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a task title first');
      return;
    }

    setAiLoading(true);
    setShowAiSuggestions(true);
    setError(null);

    try {
      console.log('🧠 Getting AI suggestions for:', formData.title);
      
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category || undefined,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent'
      };

      const result = await getAISuggestions(taskData);
      console.log('✅ AI suggestions received:', result);
      
      setAiSuggestions(result.suggestions);
      setAiEnhancementData(result);
      
      // Apply AI suggestions to form if available
      if (result.priority_analysis?.recommended_priority) {
        setFormData(prev => ({ 
          ...prev, 
          priority: result.priority_analysis!.recommended_priority 
        }));
      }
      
      if (result.category_analysis?.recommended_category) {
        setFormData(prev => ({ 
          ...prev, 
          category: result.category_analysis!.recommended_category 
        }));
      }
      
      if (result.deadline_suggestion?.recommended_deadline) {
        // Convert ISO string to datetime-local format
        const deadline = new Date(result.deadline_suggestion.recommended_deadline);
        const localDateTime = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        
        setFormData(prev => ({ 
          ...prev, 
          deadline: localDateTime
        }));
      }

      if (result.enhancement_suggestions?.enhanced_description) {
        setFormData(prev => ({ 
          ...prev, 
          description: result.enhancement_suggestions!.enhanced_description || prev.description
        }));
      }
      
    } catch (err) {
      console.error('❌ AI suggestions error:', err);
      // Enhanced fallback suggestions based on assignment requirements
      setAiSuggestions([
        `🎯 Task Breakdown: Break "${formData.title}" into 3-4 smaller subtasks for better progress tracking`,
        `⏰ Time Management: Estimated 2-4 hours based on ${formData.priority} priority and similar tasks`,
        `🚨 Priority Analysis: ${formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} priority appropriate based on urgency indicators`,
        `🏷️ Category Optimization: ${formData.category || 'Work'} category recommended for optimal organization`,
        `💡 Context Integration: Consider current workload and schedule for realistic planning`,
        `⚡ Smart Scheduling: Best completion time during peak productivity hours (9-11 AM or 2-4 PM)`,
        `🔥 AI Enhancement: Task complexity suggests breaking into phases for better execution`
      ]);
      setError('AI suggestions unavailable - showing intelligent fallback analysis');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('📝 Creating task with data:', formData);
      
      // Prepare enhanced data for API with AI insights
      const taskData: TaskPayload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category_name: formData.category || undefined,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        deadline: formData.deadline || undefined,
        estimated_time: formData.estimatedTime ? parseFloat(formData.estimatedTime) : undefined,
      };

      // Call API to create task with AI enhancement
      const createdTask = await createTask(taskData);
      
      console.log('✅ AI-Enhanced Task created successfully:', createdTask);
      
      // Show success state
      setSuccess(true);
      
      // Wait a moment to show success, then redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
      
    } catch (error) {
      console.error('❌ Error creating task:', error);
      setError(error instanceof Error ? error.message : 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAIStatus = async () => {
    try {
      setDataLoading(true);
      const newStatus = await checkAIStatus();
      setAiStatus(newStatus);
      setAiConnected(newStatus.ai_connected);
      console.log('🔄 AI status refreshed:', newStatus);
    } catch (err) {
      console.error('❌ Failed to refresh AI status:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const getSelectedPriority = () => {
    return priorityOptions.find((p) => p.value === formData.priority);
  };

  const getSelectedCategory = () => {
    return categoryOptions.find((c) => c.name === formData.category);
  };

  const getProgressPercentage = () => {
    const requiredFields = ["title"];
    const optionalFields = [
      "description",
      "category",
      "priority",
      "deadline",
      "estimatedTime",
    ];

    const filledRequired = requiredFields.filter((field) =>
      formData[field as keyof typeof formData].trim()
    ).length;
    const filledOptional = optionalFields.filter((field) =>
      formData[field as keyof typeof formData].trim()
    ).length;

    return Math.round(
      ((filledRequired * 3 + filledOptional) /
        (requiredFields.length * 3 + optionalFields.length)) *
        100
    );
  };

  const getMotivationalMessage = () => {
    const progress = getProgressPercentage();
    if (progress === 0)
      return "🌟 Let's start by giving your task a clear title!";
    if (progress < 30)
      return "🚀 Great start! Keep adding details to unlock AI-powered insights.";
    if (progress < 60)
      return "💪 Excellent progress! AI analysis ready for intelligent suggestions.";
    if (progress < 90)
      return "🎯 Outstanding! Your task is taking shape with AI enhancement.";
    return "✨ Perfect! Task ready for AI-powered creation with context analysis!";
  };

  // Show loading state while data is being fetched
  if (dataLoading) {
    return (
      <div className="min-h-screen min-w-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>Initializing Smart AI Todo</h2>
          <p style={{ color: "var(--muted-foreground)" }}>Loading AI services and context analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen min-w-screen p-4 sm:p-6"
      style={{
        background:
          "linear-gradient(135deg, var(--background) 0%, var(--secondary/30) 50%, var(--background) 100%)",
      }}
    >
      {/* Centered Container */}
      <div className="max-w-8xl mx-auto">
        {/* Enhanced Header with Complete AI Branding */}
        <div className="text-center mb-10">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="mb-6 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4 rounded-full">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 tracking-tight">
              Smart AI Todo Creation
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed text-muted-foreground">
              Transform your ideas into intelligent, context-aware tasks with Google Gemini AI-powered 
              prioritization, deadline suggestions, and smart categorization
            </p>

            {/* Enhanced AI Status with Context Information */}
            <div className="max-w-2xl mx-auto mt-6 space-y-4">
              {aiConnected ? (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <Star className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-300 font-semibold">
                      🧠 Gemini AI Connected - Context Analysis Ready
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center p-2 bg-white/50 rounded-lg">
                      <Cpu className="h-4 w-4 mx-auto mb-1 text-green-600" />
                      <div className="font-semibold text-green-800">Smart Prioritization</div>
                    </div>
                    <div className="text-center p-2 bg-white/50 rounded-lg">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-green-600" />
                      <div className="font-semibold text-green-800">Deadline Suggestions</div>
                    </div>
                    <div className="text-center p-2 bg-white/50 rounded-lg">
                      <Layers className="h-4 w-4 mx-auto mb-1 text-green-600" />
                      <div className="font-semibold text-green-800">Context Integration</div>
                    </div>
                  </div>
                  {aiStatus?.test_response && (
                    <div className="text-center mt-2 text-xs text-green-600">
                      ✅ Test Response: {aiStatus.test_response}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="text-orange-700 dark:text-orange-300 font-medium">
                      AI Offline - Using Intelligent Fallback Analysis
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-orange-600 mb-2">
                      {aiStatus?.message || 'Gemini AI service unavailable'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshAIStatus}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      disabled={dataLoading}
                    >
                      {dataLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border border-orange-600 border-t-transparent mr-2"></div>
                          Checking...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-2" />
                          Retry Connection
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Context Data Display */}
              {contextData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg border text-center">
                    <Users className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                    <div className="font-bold text-blue-600">{contextData.total_entries}</div>
                    <div className="text-xs text-muted-foreground">Context Entries</div>
                  </div>
                  <div className="bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg border text-center">
                    <BarChart3 className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                    <div className="font-bold text-purple-600">{contextData.current_workload}</div>
                    <div className="text-xs text-muted-foreground">Current Load</div>
                  </div>
                  <div className="bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg border text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-green-600" />
                    <div className="font-bold text-green-600">{contextData.user_patterns.average_completion_time}h</div>
                    <div className="text-xs text-muted-foreground">Avg Time</div>
                  </div>
                  <div className="bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg border text-center">
                    <Target className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                    <div className="font-bold text-orange-600">{contextData.user_patterns.preferred_categories[0]}</div>
                    <div className="text-xs text-muted-foreground">Top Category</div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Progress indicator */}
            <div className="max-w-lg mx-auto mt-8">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="font-medium text-muted-foreground">
                  AI Enhancement Progress
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className="font-bold text-lg"
                    style={{ color: "var(--primary)" }}
                  >
                    {getProgressPercentage()}%
                  </span>
                  {getProgressPercentage() === 100 && (
                    <Award className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
              <div className="relative">
                <div
                  className="w-full h-3 rounded-full"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  <div
                    className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 relative overflow-hidden"
                    style={{ width: `${getProgressPercentage()}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <p className="text-sm mt-2 text-center font-medium text-blue-600 dark:text-blue-400">
                {getMotivationalMessage()}
              </p>
            </div>
          </div>
        </div>

        {/* Success Message with AI Enhancement Confirmation */}
        {success && (
          <div className="max-w-md mx-auto mb-8">
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                🧠 AI-Enhanced Task Created Successfully! 
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-2">
                Your task has been intelligently analyzed and enhanced with:
              </p>
              <div className="text-sm text-green-600 space-y-1">
                <div>✓ Smart Priority Scoring</div>
                <div>✓ Context-Aware Categorization</div>
                <div>✓ Deadline Optimization</div>
                <div>✓ Task Enhancement Suggestions</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-8">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-300 font-medium">
                  {error}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="xl:col-span-3">
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader className="pb-8">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-indigo-900/30">
                      <Brain className="h-8 w-8 text-blue-600" />
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Smart Task Creation
                    </span>
                  </div>

                  {/* Enhanced Stats with AI Features */}
                  <div className="hidden sm:flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        {Object.values(formData).filter((v) => v.trim()).length}/6 Enhanced
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-purple-700 dark:text-purple-400">
                        {aiConnected ? "Gemini Ready" : success ? "✅ Created" : "Smart Analysis"}
                      </span>
                    </div>
                    {aiEnhancementData && (
                      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          AI Enhanced
                        </span>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-10 px-8 pb-8">
                <form onSubmit={handleSubmit}>
                  {/* Enhanced Title Input with AI Suggestions */}
                  <div className="space-y-4">
                    <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">
                      What needs to be accomplished? *
                    </label>
                    <Input
                      placeholder="e.g., Complete quarterly sales report, Learn advanced React patterns, Plan family vacation..."
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="text-xl py-6 border-3 transition-all duration-300 focus:ring-4 bg-white/70 dark:bg-slate-700/70"
                      style={{
                        borderColor: formData.title
                          ? "#3B82F6"
                          : "var(--border)",
                        borderWidth: "2px",
                      }}
                      required
                      disabled={loading || success}
                    />
                    {formData.title && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-base p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <span className="text-green-700 dark:text-green-300 font-medium">
                            Excellent! Clear, actionable title ready for AI analysis.
                          </span>
                          {aiConnected && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center space-x-1">
                              <Brain className="h-3 w-3" />
                              <span>AI Analysis Ready</span>
                            </span>
                          )}
                        </div>
                        
                        {/* Enhanced Title Suggestion */}
                        {aiEnhancementData?.enhancement_suggestions?.enhanced_title && 
                         aiEnhancementData.enhancement_suggestions.enhanced_title !== formData.title && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center space-x-2 mb-2">
                              <Sparkles className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                AI Enhanced Title Suggestion:
                              </span>
                            </div>
                            <p className="text-blue-800 dark:text-blue-200 font-medium">
                              "{aiEnhancementData.enhancement_suggestions.enhanced_title}"
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 text-blue-600 border-blue-300"
                              onClick={() => handleInputChange("title", aiEnhancementData.enhancement_suggestions.enhanced_title)}
                            >
                              Apply Enhancement
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Description with AI Context */}
                  <div className="space-y-4">
                    <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">
                      Add context and details (optional)
                    </label>
                    <textarea
                      placeholder={aiConnected 
                        ? "Describe your task in detail... AI will analyze context, complexity, and suggest optimizations based on your patterns and current workload."
                        : "Describe your task in detail... Include specific requirements, deliverables, or important context."
                      }
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      className="w-full h-32 p-5 text-lg resize-none border-2 rounded-xl transition-all duration-300 focus:ring-4 bg-white/70 dark:bg-slate-700/70"
                      style={{
                        borderColor: formData.description
                          ? "#3B82F6"
                          : "var(--border)",
                        color: "var(--foreground)",
                      }}
                      disabled={loading || success}
                    />
                    
                    {/* AI Enhanced Description Suggestion */}
                    {aiEnhancementData?.enhancement_suggestions?.enhanced_description && 
                     aiEnhancementData.enhancement_suggestions.enhanced_description !== formData.description && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            AI Enhanced Description:
                          </span>
                        </div>
                        <p className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed">
                          {aiEnhancementData.enhancement_suggestions.enhanced_description}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 text-purple-600 border-purple-300"
                          onClick={() => handleInputChange("description", aiEnhancementData.enhancement_suggestions.enhanced_description)}
                        >
                          Apply AI Enhancement
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Category Selection with AI Recommendations */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">
                        Choose a category
                      </label>
                      {aiEnhancementData?.category_analysis && (
                        <div className="text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-200">
                          <span className="text-blue-700 dark:text-blue-300 font-medium">
                            🧠 AI Suggests: {aiEnhancementData.category_analysis.recommended_category}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                      {categoryOptions.map((category) => {
                        const isSelected = formData.category === category.name;
                        const isAIRecommended = aiEnhancementData?.category_analysis?.recommended_category === category.name;
                        
                        return (
                          <button
                            key={category.name}
                            type="button"
                            onClick={() =>
                              handleInputChange("category", category.name)
                            }
                            disabled={loading || success}
                            className={`group relative p-5 rounded-2xl text-center transition-all duration-300 border-2 hover:scale-110 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSelected
                                ? `shadow-2xl ring-4 ring-opacity-30`
                                : "hover:shadow-xl"
                            }`}
                            style={{
                              backgroundColor: isSelected
                                ? category.color + "15"
                                : "var(--secondary)",
                              borderColor: isSelected
                                ? category.color
                                : isAIRecommended ? "#3B82F6" : "var(--border)",
                            }}
                          >
                            {isAIRecommended && (
                              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                AI
                              </div>
                            )}
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                              {category.icon}
                            </div>
                            <div
                              className="text-sm font-bold mb-1"
                              style={{
                                color: isSelected
                                  ? category.color
                                  : "var(--foreground)",
                              }}
                            >
                              {category.name}
                            </div>
                            <div className="text-xs opacity-70 text-muted-foreground">
                              {category.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Enhanced Priority Selection with AI Analysis */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200">
                        Set priority level
                      </label>
                      {aiEnhancementData?.priority_analysis && (
                        <div className="text-sm bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-200">
                          <span className="text-orange-700 dark:text-orange-300 font-medium">
                            🎯 AI Score: {aiEnhancementData.priority_analysis.priority_score}/100
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {priorityOptions.map((option) => {
                        const isSelected = formData.priority === option.value;
                        const isAIRecommended = aiEnhancementData?.priority_analysis?.recommended_priority === option.value;
                        
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              handleInputChange("priority", option.value)
                            }
                            disabled={loading || success}
                            style={{
                              "--ring-color": option.color,
                              backgroundColor: isSelected
                                ? option.bgColor
                                : "var(--secondary)",
                              borderColor: isSelected
                                ? option.color
                                : isAIRecommended ? "#F59E0B" : "var(--border)",
                            } as React.CSSProperties}
                            className={`group relative p-6 rounded-2xl text-center transition-all duration-300 border-2 hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSelected
                                ? "shadow-2xl ring-4 ring-opacity-30"
                                : "hover:shadow-xl"
                            } ${isSelected ? "ring-[var(--ring-color)]" : ""}`}
                          >
                            {isAIRecommended && (
                              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                AI
                              </div>
                            )}
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                              {option.icon}
                            </div>
                            <div
                              className="text-base font-bold mb-1"
                              style={{
                                color: isSelected
                                  ? option.textColor
                                  : "var(--foreground)",
                              }}
                            >
                              {option.label}
                            </div>
                            <div className="text-xs opacity-80 text-muted-foreground">
                              {option.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* AI Priority Analysis Explanation */}
                    {aiEnhancementData?.priority_analysis?.reasoning && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                            AI Priority Analysis:
                          </span>
                        </div>
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                          {aiEnhancementData.priority_analysis.reasoning}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Date and Time Fields with AI Suggestions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 text-xl font-bold text-gray-800 dark:text-gray-200">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        <span>Due date</span>
                        {aiEnhancementData?.deadline_suggestion && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            AI Optimized
                          </span>
                        )}
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) =>
                          handleInputChange("deadline", e.target.value)
                        }
                        className="py-5 text-lg border-2 transition-all duration-300 focus:ring-4 bg-white/70 dark:bg-slate-700/70"
                        style={{
                          borderColor: formData.deadline
                            ? "#3B82F6"
                            : "var(--border)",
                        }}
                        disabled={loading || success}
                      />
                      
                      {/* AI Deadline Suggestion */}
                      {aiEnhancementData?.deadline_suggestion?.reasoning && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              AI Deadline Analysis:
                            </span>
                          </div>
                          <p className="text-blue-800 dark:text-blue-200 text-sm">
                            {aiEnhancementData.deadline_suggestion.reasoning}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 text-xl font-bold text-gray-800 dark:text-gray-200">
                        <Clock className="h-6 w-6 text-purple-600" />
                        <span>Estimated time</span>
                        {contextData && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            Avg: {contextData.user_patterns.average_completion_time}h
                          </span>
                        )}
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g., 2.5 hours"
                        min="0.5"
                        step="0.5"
                        value={formData.estimatedTime}
                        onChange={(e) =>
                          handleInputChange("estimatedTime", e.target.value)
                        }
                        className="py-5 text-lg border-2 transition-all duration-300 focus:ring-4 bg-white/70 dark:bg-slate-700/70"
                        style={{
                          borderColor: formData.estimatedTime
                            ? "#3B82F6"
                            : "var(--border)",
                        }}
                        disabled={loading || success}
                      />
                      
                      {/* Time Estimation Help */}
                      {contextData && (
                        <div className="text-sm text-muted-foreground p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          💡 Based on your patterns: Similar {formData.category || 'tasks'} typically take {contextData.user_patterns.average_completion_time} hours
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Action Buttons with AI Features */}
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-10">
                    <Button
                      type="submit"
                      disabled={loading || !formData.title.trim() || success}
                      className="w-full sm:w-auto px-12 py-6 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: success
                          ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                          : aiConnected
                          ? "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 30%, #6366F1 60%, #4F46E5 100%)"
                          : "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #3B82F6 100%)",
                        color: "white",
                      }}
                    >
                      {success ? (
                        <>
                          <CheckCircle className="h-6 w-6 mr-4" />
                          🧠 AI-Enhanced Task Created!
                        </>
                      ) : loading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-4"></div>
                          Creating with AI Analysis...
                        </>
                      ) : (
                        <>
                          <Brain className="h-6 w-6 mr-4" />
                          {aiConnected ? "Create Smart AI Task" : "Create Enhanced Task"}
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleGetAISuggestions}
                      disabled={aiLoading || !formData.title.trim() || success}
                      variant="outline"
                      className="w-full sm:w-auto px-12 py-6 text-xl font-bold rounded-2xl border-3 hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: aiConnected ? "#8B5CF6" : "#F59E0B",
                        color: aiConnected ? "#8B5CF6" : "#F59E0B",
                        background: aiConnected
                          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)"
                          : "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
                      }}
                    >
                      {aiLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-4"></div>
                          🧠 AI Analyzing Context...
                        </>
                      ) : (
                        <>
                          {aiConnected ? <Sparkles className="h-6 w-6 mr-4" /> : <Lightbulb className="h-6 w-6 mr-4" />}
                          {aiConnected ? "Get AI Enhancement" : "Get Smart Analysis"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar with AI Features */}
          <div className="space-y-6">
            {/* AI Suggestions with Complete Analysis */}
            {showAiSuggestions && (
              <Card className={`shadow-xl border-0 backdrop-blur-sm ${
                aiConnected 
                  ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20'
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
              }`}>
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className={`p-3 rounded-xl ${
                      aiConnected 
                        ? 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30'
                        : 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30'
                    }`}>
                      {aiConnected ? <Brain className="h-6 w-6 text-purple-600" /> : <Lightbulb className="h-6 w-6 text-amber-600" />}
                    </div>
                    <span className={`font-bold ${
                      aiConnected 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent'
                    }`}>
                      {aiConnected ? 'AI Context Analysis' : 'Smart Insights'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiLoading ? (
                    <div className="space-y-5">
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="animate-pulse space-y-3">
                          <div className={`h-4 rounded-full w-full ${
                            aiConnected ? 'bg-purple-200' : 'bg-amber-200'
                          }`}></div>
                          <div className={`h-4 rounded-full w-3/4 ${
                            aiConnected ? 'bg-purple-200' : 'bg-amber-200'
                          }`}></div>
                        </div>
                      ))}
                      <div className="text-center mt-6">
                        <div className="flex items-center justify-center space-x-2">
                          <Brain className="h-6 w-6 text-purple-600 animate-pulse" />
                          <span className="text-base font-medium text-purple-600">
                            {aiConnected ? '🧠 Gemini AI analyzing context, patterns & optimization...' : 'Generating intelligent task suggestions...'}
                          </span>
                        </div>
                        <div className="text-sm text-purple-500 mt-2">
                          Processing: Priority • Category • Timeline • Enhancement
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {aiSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`p-5 rounded-xl transition-all duration-300 hover:shadow-lg border-2 bg-white/90 dark:bg-slate-800/90 ${
                            aiConnected 
                              ? 'border-purple-200 dark:border-purple-800 hover:border-purple-300 hover:bg-purple-50/50'
                              : 'border-amber-200 dark:border-amber-800 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <p className={`text-base leading-relaxed font-medium ${
                            aiConnected 
                              ? 'text-purple-800 dark:text-purple-200'
                              : 'text-amber-800 dark:text-amber-200'
                          }`}>
                            {suggestion}
                          </p>
                        </div>
                      ))}
                      
                      {aiConnected && (
                        <div className="space-y-3 mt-6">
                          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-center space-x-2">
                              <Star className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                Powered by Google Gemini 1.5 Flash
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/60 p-2 rounded text-center">
                              <Cpu className="h-3 w-3 mx-auto mb-1 text-blue-600" />
                              <div className="font-semibold text-blue-800">Context Aware</div>
                            </div>
                            <div className="bg-white/60 p-2 rounded text-center">
                              <BarChart3 className="h-3 w-3 mx-auto mb-1 text-green-600" />
                              <div className="font-semibold text-green-800">Smart Priority</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Enhanced Pro Tips with Assignment Features */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                    AI Features
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      icon: "🧠",
                      tip: "Context Processing: AI analyzes your daily patterns and suggests optimal task timing",
                      color: "#3B82F6",
                    },
                    {
                      icon: "⚡",
                      tip: "Smart Prioritization: AI scores tasks based on urgency, context, and workload",
                      color: "#10B981",
                    },
                    {
                      icon: "📅",
                      tip: "Deadline Intelligence: AI suggests realistic deadlines considering complexity",
                      color: "#F59E0B",
                    },
                    {
                      icon: "🏷️",
                      tip: "Auto-Categorization: AI recommends categories based on task content and patterns",
                      color: "#8B5CF6",
                    },
                    {
                      icon: "✨",
                      tip: "Task Enhancement: AI improves descriptions with context-aware details",
                      color: "#EC4899",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 rounded-xl hover:shadow-md transition-all duration-200 border border-blue-200 dark:border-blue-800 bg-white/60 dark:bg-slate-800/60"
                    >
                      <span className="text-2xl flex-shrink-0">
                        {item.icon}
                      </span>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 leading-relaxed">
                        {item.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Task Preview with AI Indicators */}
            {(formData.title ||
              formData.category ||
              formData.priority !== "medium") && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <Star className="h-6 w-6 text-green-600" />
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                      Smart Task Preview
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {formData.title && (
                    <div className="p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-green-200 dark:border-green-800">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                        Task Title:
                      </span>
                      <p className="text-lg font-bold text-green-800 dark:text-green-200 mt-1">
                        {formData.title}
                      </p>
                      {aiConnected && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Brain className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            AI Enhancement: Context analysis, priority scoring & smart categorization
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.category && (
                    <div className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-green-200 dark:border-green-800">
                      <span className="text-3xl">
                        {getSelectedCategory()?.icon}
                      </span>
                      <div className="flex-1">
                        <span
                          className="px-4 py-2 rounded-xl text-base font-bold"
                          style={{
                            backgroundColor: getSelectedCategory()?.color + "20",
                            color: getSelectedCategory()?.color,
                          }}
                        >
                          {formData.category}
                        </span>
                        {aiEnhancementData?.category_analysis && (
                          <div className="text-xs text-green-600 mt-1">
                            AI Confidence: {Math.round(aiEnhancementData.category_analysis.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-green-200 dark:border-green-800">
                    <span className="text-3xl">
                      {getSelectedPriority()?.icon}
                    </span>
                    <div className="flex-1">
                      <span
                        className="px-4 py-2 rounded-xl text-base font-bold"
                        style={{
                          backgroundColor: getSelectedPriority()?.bgColor,
                          color: getSelectedPriority()?.textColor,
                        }}
                      >
                        {getSelectedPriority()?.label} Priority
                      </span>
                      {aiEnhancementData?.priority_analysis && (
                        <div className="text-xs text-green-600 mt-1">
                          AI Priority Score: {aiEnhancementData.priority_analysis.priority_score}/100
                        </div>
                      )}
                    </div>
                  </div>

                  {(formData.deadline || formData.estimatedTime) && (
                    <div className="space-y-3">
                      {formData.deadline && (
                        <div className="flex items-center space-x-3 text-green-700 dark:text-green-300">
                          <Calendar className="h-5 w-5" />
                          <span className="font-medium">
                            Due: {new Date(formData.deadline).toLocaleDateString()}
                            {aiEnhancementData?.deadline_suggestion && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">
                                AI Optimized
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {formData.estimatedTime && (
                        <div className="flex items-center space-x-3 text-green-700 dark:text-green-300">
                          <Clock className="h-5 w-5" />
                          <span className="font-medium">
                            {formData.estimatedTime} hours estimated
                            {contextData && (
                              <span className="text-xs text-green-500 ml-2">
                                (Your avg: {contextData.user_patterns.average_completion_time}h)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
