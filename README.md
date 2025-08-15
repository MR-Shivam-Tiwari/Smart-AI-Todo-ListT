# 🧠 Smart AI Todo List - Full Stack Assignment

Transform your task management with Google Gemini AI-powered intelligent insights, context-aware prioritization, and smart automation.

## 🚀 Assignment Overview

This project implements a comprehensive Smart Todo List application with AI integration for intelligent task management, built as part of the Full Stack Developer position assignment.
     
### 🎯 Key Features Implemented

- **🤖 AI-Powered Task Enhancement** - Google Gemini integration for intelligent task analysis
- **📊 Context Processing** - Analyzes daily patterns and suggests optimal timing
- **⚡ Smart Prioritization** - AI scores tasks based on urgency and context
- **📅 Deadline Intelligence** - Suggests realistic deadlines considering complexity
- **🏷️ Auto-Categorization** - Recommends categories based on content analysis
- **✨ Task Enhancement** - Improves descriptions with context-aware details

## 📱 Screenshots of UI Created

### 1. Smart Task Creation Interface
<img width="1920" height="806" alt="image" src="https://github.com/user-attachments/assets/3efd85d8-4ad7-45d4-8b71-b8214eeed52d" />
*AI-powered task creation with real-time suggestions and smart categorization*

### 2. AI Suggestions Panel
<img width="1914" height="663" alt="image" src="https://github.com/user-attachments/assets/f8c0b9f1-4562-4e96-97a0-7b7ff411ba9f" />

*Intelligent recommendations powered by Google Gemini with context analysis*

### 3. Dashboard Overview
<img width="1920" height="908" alt="image" src="https://github.com/user-attachments/assets/4bf5d352-e9a9-4989-8b32-0e42979d0ab1" />

*Comprehensive task management dashboard with AI insights*

### 4. Context Analysis Display
<img width="1920" height="776" alt="image" src="https://github.com/user-attachments/assets/c683caf1-16ef-4276-98e6-c2c1dfb0fdf7" />

*Real-time context processing showing user patterns and workload analysis*
 
## 🛠️ Tech Stack

### Backend
- **Django 5.1** - Python web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database (Neon cloud)
- **Google Gemini AI** - AI processing engine
### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **TypeScript** - Type safety

### AI Integration
- **Google Gemini 1.5 Flash** - Primary AI model
- **Context Analysis** - Daily pattern processing
- **Smart Suggestions** - Intelligent recommendations
- **Priority Scoring** - Automated task ranking

## 🚀 Setup Instructions for Running the Application

### Prerequisites
Required software versions
Python 3.11+
Node.js 18+
PostgreSQL 14+
Git
### Step 1: Clone Repository
git clone https://github.com/MR-Shivam-Tiwari/Smart-AI-Todo-ListT.git
cd smart-todo-ai
### Step 2: Backend Setup (Django)
Navigate to backend directory
cd smart-todo-backend

Create and activate virtual environment
python -m venv venv

Windows
venv\Scripts\activate

macOS/Linux
source venv/bin/activate

Install dependencies
pip install -r requirements.txt

Create database tables
python manage.py makemigrations
python manage.py migrate

Create superuser (optional)
python manage.py createsuperuser

Start Django server
python manage.py runserver

### Step 3: Frontend Setup (Next.js)
Open new terminal and navigate to frontend
cd smart-todo-frontend

Install Node.js dependencies
npm install

Start development server
npm run dev
### Step 4: Access Application
Backend API: http://127.0.0.1:8000/
Frontend UI: http://localhost:3000/
Admin Panel: http://127.0.0.1:8000/admin/

Test AI status endpoint
curl http://127.0.0.1:8000/api/tasks/ai_status/

Expected response:
{
"ai_connected": true,
"provider": "Google Gemini",
"model": "gemini-1.5-flash",
"status": "Connected and operational",
"message": "✅ Gemini AI ready for task enhancement"
}


