"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  MessageSquare, Mail, FileText, Trash2, Plus, Calendar,
  TrendingUp, Brain, Activity, Download, Search, Sparkles,
  Clock, Target, RefreshCw, BarChart3, AlertCircle, Zap, Star
} from "lucide-react";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Enhanced Interfaces
interface ContextEntry {
  id: string | number;
  content: string;
  source_type: "whatsapp" | "email" | "notes";
  processing_status: "unprocessed" | "processing" | "processed" | "failed";
  processed_insights: string[];
  metadata: Record<string, any>;
  insights_count: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

interface ContextStats {
  total_entries: number;
  whatsapp_count: number;
  email_count: number;
  notes_count: number;
  processed_count: number;
  failed_count: number;
  processing_count: number;
  total_insights: number;
  ai_success_rate: number;
  recent_activity: Array<{
    id: string | number;
    content: string;
    source_type: string;
    processing_status: string;
    created_at: string;
    insights_count: number;
  }>;
}

interface AIStatus {
  ai_connected: boolean;
  server: string;
  model?: string;
  server_url?: string;
  message: string;
  models_available?: number;
  test_successful?: boolean;
  instructions?: string[];
}

// Enhanced API Functions
const fetchEntries = async (): Promise<ContextEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/context/entries/`);
  if (!response.ok) throw new Error('Failed to fetch entries');
  return response.json();
};

const createEntry = async (data: { content: string; source_type: string; metadata?: Record<string, any> }): Promise<ContextEntry> => {
  const response = await fetch(`${API_BASE_URL}/context/entries/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create entry');
  return response.json();
};

const deleteEntry = async (id: string | number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/context/entries/${id}/`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete entry');
};

const fetchStats = async (): Promise<ContextStats> => {
  const response = await fetch(`${API_BASE_URL}/context/entries/stats/`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

const reprocessEntry = async (id: string | number): Promise<ContextEntry> => {
  const response = await fetch(`${API_BASE_URL}/context/entries/${id}/reprocess/`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reprocess entry');
  const data = await response.json();
  return data.entry;
};

const checkAIStatus = async (): Promise<AIStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/context/entries/ai_status/`);
    return await response.json();
  } catch {
    return { 
      ai_connected: false, 
      server: 'Google Gemini',
      message: 'Unable to check AI status - server may be down'
    };
  }
};

const clearOldEntries = async (): Promise<{ deleted_count: number }> => {
  const response = await fetch(`${API_BASE_URL}/context/entries/clear_old/`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to clear old entries');
  return response.json();
};

// Utility function
const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ContextPage() {
  const [entries, setEntries] = useState<ContextEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ContextEntry[]>([]);
  const [stats, setStats] = useState<ContextStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [newEntry, setNewEntry] = useState({
    content: "",
    source_type: "notes" as const,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string | number>>(new Set());
  
  // AI Status States
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [aiConnected, setAiConnected] = useState(false);

  // Enhanced Load initial data with AI status
  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);
        const [entriesData, statsData, aiStatusData] = await Promise.all([
          fetchEntries(),
          fetchStats(),
          checkAIStatus()
        ]);
        setEntries(entriesData);
        setStats(statsData);
        setAiStatus(aiStatusData);
        setAiConnected(aiStatusData.ai_connected);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, []);

  // Periodic AI status check
  useEffect(() => {
    const checkAI = async () => {
      const status = await checkAIStatus();
      setAiStatus(status);
      setAiConnected(status.ai_connected);
    };
    
    const interval = setInterval(checkAI, 45000); // Check every 45 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = entries;

    if (selectedFilter !== "all") {
      filtered = filtered.filter(entry => entry.source_type === selectedFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.processed_insights?.some(insight => 
          insight.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredEntries(filtered);
  }, [entries, selectedFilter, searchQuery]);

  const sourceConfig = {
    whatsapp: {
      icon: MessageSquare,
      color: "#10B981",
      bgColor: "#ECFDF5",
      textColor: "#065F46",
      label: "WhatsApp",
    },
    email: {
      icon: Mail,
      color: "#3B82F6",
      bgColor: "#EFF6FF",
      textColor: "#1E40AF",
      label: "Email",
    },
    notes: {
      icon: FileText,
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      textColor: "#92400E",
      label: "Notes",
    },
  };

  // Enhanced Submit Handler with Real-time Processing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Create entry (AI processing happens automatically in backend)
      const createdEntry = await createEntry({
        content: newEntry.content.trim(),
        source_type: newEntry.source_type,
        metadata: { 
          created_from: 'context_hub',
          ai_provider: 'gemini',
          ai_enabled: aiConnected,
          timestamp: new Date().toISOString()
        }
      });

      // Add to entries immediately
      setEntries(prev => [createdEntry, ...prev]);
      setNewEntry({ content: "", source_type: "notes" });
      
      // Show processing status if AI is connected
      if (aiConnected && createdEntry.processing_status === 'processing') {
        // Poll for processing completion
        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/context/entries/${createdEntry.id}/`);
            if (response.ok) {
              const updatedEntry = await response.json();
              if (updatedEntry.processing_status !== 'processing') {
                setEntries(prev => prev.map(e => e.id === createdEntry.id ? updatedEntry : e));
                clearInterval(pollInterval);
                
                // Show success message for AI processing
                if (updatedEntry.processing_status === 'processed') {
                  console.log('✅ Gemini AI processing completed successfully');
                }
              }
            }
          } catch (err) {
            clearInterval(pollInterval);
          }
        }, 3000); // Check every 3 seconds for Gemini

        // Clear interval after 60 seconds
        setTimeout(() => clearInterval(pollInterval), 60000);
      }
      
      // Refresh stats
      const newStats = await fetchStats();
      setStats(newStats);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      
      // Refresh stats
      const newStats = await fetchStats();
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const handleReprocess = async (id: string | number) => {
    setProcessingIds(prev => new Set(prev).add(id));
    
    try {
      const updatedEntry = await reprocessEntry(id);
      setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
      
      // Success message
      if (updatedEntry.processing_status === 'processed') {
        console.log('✅ Entry reprocessed successfully with Gemini AI');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reprocess entry');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleClearOld = async () => {
    if (!confirm('Are you sure you want to delete entries older than 30 days?')) return;

    try {
      const result = await clearOldEntries();
      alert(`Deleted ${result.deleted_count} old entries`);
      
      // Refresh data
      const [entriesData, statsData] = await Promise.all([
        fetchEntries(),
        fetchStats()
      ]);
      setEntries(entriesData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear old entries');
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen min-w-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>Loading Context Hub</h2>
          <p style={{ color: "var(--muted-foreground)" }}>Connecting to Gemini AI and fetching your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen min-w-screen p-4 sm:p-6"
      style={{
        background: "linear-gradient(135deg, var(--background) 0%, var(--secondary/20) 100%)",
      }}
    >
      <div className="max-w-8xl mx-auto">
        {/* Enhanced Header with Gemini Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4 rounded-full">
              <Brain className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Context Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your messages, emails, and notes into actionable insights with Google Gemini AI-powered analysis
          </p>

          {/* Enhanced Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-6">
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border">
                <div className="text-2xl font-bold text-purple-600">{stats.total_entries}</div>
                <div className="text-xs text-muted-foreground">Total Entries</div>
              </div>
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border">
                <div className="text-2xl font-bold text-blue-600">{stats.total_insights}</div>
                <div className="text-xs text-muted-foreground">Gemini Insights</div>
              </div>
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border">
                <div className="text-2xl font-bold text-green-600">{stats.processed_count}</div>
                <div className="text-xs text-muted-foreground">AI Processed</div>
              </div>
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg p-3 border">
                <div className="text-2xl font-bold text-orange-600">{stats.ai_success_rate}%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
          )}

          {/* Enhanced AI Status Indicator for Gemini */}
          <div className="mt-6">
            {aiConnected ? (
              <div className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <Star className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-300 font-semibold">
                    🤖 Google Gemini 1.5 Flash Connected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-sm">
                    Ready for intelligent analysis
                  </span>
                  {aiStatus?.test_successful && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center space-x-1">
                      <Zap className="h-3 w-3" />
                      <span>Tested</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-300 font-semibold">
                      ❌ Gemini AI Disconnected
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-red-600 text-sm mb-2">
                    {aiStatus?.message || 'Please check your Gemini API configuration'}
                  </p>
                  {aiStatus?.instructions && (
                    <div className="text-xs text-red-500 space-y-1">
                      {aiStatus.instructions.map((instruction, index) => (
                        <div key={index}>• {instruction}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mb-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:bg-red-100"
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-3">
            {/* Enhanced Add New Context with Gemini Branding */}
            <Card className="shadow-xl border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm mb-6">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
                      <Plus className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="text-2xl font-semibold">Add Context Entry</span>
                  </div>
                  {/* Enhanced AI Status Badge */}
                  {aiConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <Star className="h-3 w-3 text-green-600" />
                      <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                        Gemini Ready
                      </span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Source Type Selection */}
                  <div className="space-y-3">
                    <label className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                      Choose Source Type
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(sourceConfig).map(([type, config]) => {
                        const active = newEntry.source_type === type;
                        const Icon = config.icon;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewEntry(prev => ({ ...prev, source_type: type as any }))}
                            disabled={loading}
                            className={`p-4 rounded-xl text-center transition-all duration-200 border-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                              active ? "shadow-lg" : "hover:shadow-md"
                            }`}
                            style={{
                              backgroundColor: active ? config.bgColor : "var(--secondary)",
                              borderColor: active ? config.color : "var(--border)",
                            }}
                          >
                            <Icon
                              className="h-8 w-8 mx-auto mb-2"
                              style={{
                                color: active ? config.color : "var(--muted-foreground)",
                              }}
                            />
                            <div
                              className="font-semibold text-sm"
                              style={{
                                color: active ? config.textColor : "var(--foreground)",
                              }}
                            >
                              {config.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Enhanced Content Input */}
                  <div className="space-y-3">
                    <label className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                      Content
                    </label>
                    <textarea
                      placeholder={aiConnected 
                        ? "Paste your message, email content, or notes here. Google Gemini AI will analyze it and provide intelligent insights..."
                        : "Add your content here. Connect Gemini AI for intelligent analysis."
                      }
                      value={newEntry.content}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full h-32 p-4 text-base resize-none border-2 rounded-xl transition-all duration-200 focus:ring-2 bg-white/50 dark:bg-slate-700/50"
                      style={{
                        borderColor: newEntry.content ? (aiConnected ? "#10B981" : "var(--primary)") : "var(--border)",
                        color: "var(--foreground)",
                      }}
                      required
                      disabled={loading}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--muted-foreground)" }}>
                        {newEntry.content.length} characters
                      </span>
                      {aiConnected && newEntry.content.length > 10 && (
                        <span className="text-green-600 flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>Gemini will analyze this content</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !newEntry.content.trim()}
                    className="w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: aiConnected 
                        ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                        : "linear-gradient(135deg, var(--primary) 0%, var(--primary)/80 100%)",
                      color: "white",
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        {aiConnected ? "Gemini Processing..." : "Processing..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-3" />
                        {aiConnected ? "Add & Gemini Analyze" : "Add Context Entry"}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search through your context entries and Gemini AI insights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-3 border-2 rounded-xl bg-white/50 dark:bg-slate-700/50"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-3 border-2 rounded-xl bg-white/50 dark:bg-slate-700/50"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <option value="all">All Sources</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="notes">Notes</option>
              </select>
            </div>

            {/* Enhanced Context Entries */}
            <div className="space-y-6">
              {filteredEntries.length === 0 ? (
                <Card className="shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                      No entries found
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "Start by adding your first context entry above"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredEntries.map((entry) => {
                  const config = sourceConfig[entry.source_type];
                  const Icon = config.icon;
                  const isProcessing = processingIds.has(entry.id);

                  return (
                    <Card
                      key={entry.id}
                      className="shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div
                              className="p-3 rounded-xl"
                              style={{ backgroundColor: config.bgColor }}
                            >
                              <Icon className="h-6 w-6" style={{ color: config.color }} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className="text-lg font-semibold"
                                  style={{ color: config.textColor }}
                                >
                                  {config.label}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  entry.processing_status === 'processed' ? 'bg-green-100 text-green-800' :
                                  entry.processing_status === 'processing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                                  entry.processing_status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {entry.processing_status === 'processing' ? (
                                    <div className="flex items-center space-x-1">
                                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                                      <span>Gemini Processing...</span>
                                    </div>
                                  ) : (
                                    entry.processing_status
                                  )}
                                </span>
                                {aiConnected && entry.processing_status === 'processed' && (
                                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded flex items-center space-x-1">
                                    <Star className="h-3 w-3" />
                                    <span>Gemini Enhanced</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center space-x-2">
                                <Clock className="h-3 w-3" />
                                <span>{formatDateTime(entry.created_at)}</span>
                                {entry.insights_count > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{entry.insights_count} Gemini insights</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReprocess(entry.id)}
                              disabled={isProcessing || !aiConnected}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title={aiConnected ? "Reprocess with Gemini AI" : "Gemini AI not connected"}
                            >
                              {isProcessing ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div
                          className="p-4 rounded-xl mb-4"
                          style={{ backgroundColor: "var(--secondary)" }}
                        >
                          <p
                            className="text-base leading-relaxed"
                            style={{ color: "var(--foreground)" }}
                          >
                            {entry.content}
                          </p>
                        </div>

                        {entry.processed_insights && entry.processed_insights.length > 0 && (
                          <div
                            className="p-4 rounded-xl border"
                            style={{
                              background: entry.processing_status === 'processed' 
                                ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
                                : "linear-gradient(135deg, var(--accent) 0%, var(--accent)/70 100%)",
                              borderColor: entry.processing_status === 'processed' 
                                ? "#10B981" 
                                : "var(--primary)/20",
                            }}
                          >
                            <div className="flex items-center space-x-2 mb-3">
                              {entry.processing_status === 'processing' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              ) : (
                                <Star className="h-4 w-4" style={{ 
                                  color: entry.processing_status === 'processed' ? '#10B981' : 'var(--primary)' 
                                }} />
                              )}
                              <span
                                className="font-semibold text-sm"
                                style={{ 
                                  color: entry.processing_status === 'processed' ? '#10B981' : 'var(--primary)' 
                                }}
                              >
                                {entry.processing_status === 'processed' ? 'Gemini AI-Generated Insights' : 'Processing Insights'}
                              </span>
                              {entry.processing_status === 'processed' && aiConnected && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center space-x-1">
                                  <Zap className="h-3 w-3" />
                                  <span>Gemini 1.5 Flash</span>
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {entry.processed_insights.map((insight, index) => (
                                <div
                                  key={index}
                                  className="text-sm flex items-start space-x-2 p-3 rounded-lg"
                                  style={{
                                    backgroundColor: entry.processing_status === 'processed'
                                      ? "#F0FDF4"
                                      : "var(--background)/50",
                                    color: entry.processing_status === 'processed'
                                      ? "#166534"
                                      : "var(--accent-foreground)",
                                    border: entry.processing_status === 'processed'
                                      ? "1px solid #BBF7D0"
                                      : "none"
                                  }}
                                >
                                  <span className="text-xs">✦</span>
                                  <span className="flex-1">{insight}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Enhanced AI Status Card */}
            {aiStatus && (
              <Card className={`shadow-lg border-0 ${
                aiConnected 
                  ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20'
                  : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-900/20'
              }`}>
                <CardHeader className="pb-4">
                  <CardTitle className={`flex items-center space-x-2 text-lg ${
                    aiConnected ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <Star className="h-5 w-5" />
                    <span>Gemini AI Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Provider:</span>
                    <span className="text-sm font-semibold">{aiStatus.server}</span>
                  </div>
                  {aiStatus.model && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Model:</span>
                      <span className="text-sm">{aiStatus.model}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <span className={`text-sm font-bold flex items-center space-x-1 ${
                      aiConnected ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {aiConnected ? (
                        <>
                          <Zap className="h-3 w-3" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          <span>Disconnected</span>
                        </>
                      )}
                    </span>
                  </div>
                  {aiStatus.server_url && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      API: {aiStatus.server_url}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Enhanced Stats */}
            {stats && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span>Context Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Enhanced Processing Stats */}
                    <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center space-x-1">
                          <Star className="h-3 w-3 text-green-600" />
                          <span>Gemini Processing</span>
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {stats.ai_success_rate}% success
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Processed:</span>
                          <span className="text-green-600 font-semibold">{stats.processed_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing:</span>
                          <span className="text-blue-600 font-semibold">{stats.processing_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Failed:</span>
                          <span className="text-red-600 font-semibold">{stats.failed_count}</span>
                        </div>
                      </div>
                    </div>

                    {/* Source Distribution */}
                    {Object.entries(sourceConfig).map(([type, config]) => {
                      const count = (stats as any)[`${type}_count`] || 0;
                      const Icon = config.icon;
                      const percentage = stats.total_entries > 0 ? (count / stats.total_entries) * 100 : 0;

                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" style={{ color: config.color }} />
                              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                                {config.label}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold">{count}</span>
                              <span className="text-xs text-muted-foreground">
                                ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor: config.color,
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Quick Actions */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                  onClick={async () => {
                    const status = await checkAIStatus();
                    setAiStatus(status);
                    setAiConnected(status.ai_connected);
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Check Gemini Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                  onClick={handleClearOld}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Old Entries
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Recent Activity */}
            {stats && stats.recent_activity.length > 0 && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {stats.recent_activity.slice(0, 3).map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-amber-800 dark:text-amber-200 font-medium">
                            {activity.content.length > 50 ? `${activity.content.substring(0, 50)}...` : activity.content}
                          </p>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-amber-600 dark:text-amber-400">
                            <span>{sourceConfig[activity.source_type as keyof typeof sourceConfig]?.label}</span>
                            <span>•</span>
                            <span>{formatDateTime(activity.created_at)}</span>
                            <span>•</span>
                            <span className={`px-1 py-0.5 rounded text-xs ${
                              activity.processing_status === 'processed' ? 'bg-green-100 text-green-700' :
                              activity.processing_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                              activity.processing_status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {activity.processing_status}
                            </span>
                            {activity.insights_count > 0 && (
                              <>
                                <span>•</span>
                                <Star className="h-3 w-3" />
                                <span>{activity.insights_count} insights</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
