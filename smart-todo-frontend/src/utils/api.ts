import axios from 'axios';
import { Task, ContextEntry, Category } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Task APIs
export const taskAPI = {
  // Get all tasks
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/');
    return response.data;
  },

  // Get single task
  getTask: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  // Create new task
  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  // Update task
  updateTask: async (id: string, taskData: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/`, taskData);
    return response.data;
  },

  // Delete task
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}/`);
  },

  // Get AI suggestions for task
  getAISuggestions: async (taskData: Partial<Task>): Promise<any> => {
    const response = await api.post('/tasks/ai-suggestions/', taskData);
    return response.data;
  },
};

// Context APIs
export const contextAPI = {
  // Get all context entries
  getContextEntries: async (): Promise<ContextEntry[]> => {
    const response = await api.get('/context/');
    return response.data;
  },

  // Create new context entry
  createContextEntry: async (contextData: Partial<ContextEntry>): Promise<ContextEntry> => {
    const response = await api.post('/context/', contextData);
    return response.data;
  },

  // Delete context entry
  deleteContextEntry: async (id: string): Promise<void> => {
    await api.delete(`/context/${id}/`);
  },
};

// Category APIs
export const categoryAPI = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories/');
    return response.data;
  },

  // Create new category
  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const response = await api.post('/categories/', categoryData);
    return response.data;
  },
};

export default api;
