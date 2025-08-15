import os
from pathlib import Path

 
BASE_DIR = Path(__file__).resolve().parent.parent

 
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-your-secret-key-here-change-for-production'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'tasks',
    'context',
    'ai_integration',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'smart_todo.urls'

# TEMPLATES configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'smart_todo.wsgi.application'
 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'neondb',
        'USER': 'neondb_owner',
        'PASSWORD': 'npg_VqFnU34IRDsw',
        'HOST': 'ep-blue-night-adqf392k-pooler.c-2.us-east-1.aws.neon.tech',
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require',
            'sslcert': None,
            'sslkey': None,
            'sslrootcert': None,
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files 
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# Media files  
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

 
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

CORS_ALLOW_ALL_ORIGINS = True   
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

 

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',   
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}


# Google Gemini AI Configuration 
GEMINI_API_KEY = 'AIzaSyBjxqIuGC6PVWtfsJDpLLoxuGnqbxG9EC0'

# AI Processing Settings 
AI_PROVIDER = 'gemini'   
AI_MODEL = 'gemini-1.5-flash'  
AI_MAX_TOKENS = 800
AI_TEMPERATURE = 0.7
AI_TIMEOUT = 30  # seconds
AI_RETRY_ATTEMPTS = 3

# AI Feature Toggles - ALL ENABLED
AI_CONTEXT_PROCESSING = True
AI_TASK_PRIORITIZATION = True
AI_DEADLINE_SUGGESTIONS = True
AI_SMART_CATEGORIZATION = True
AI_TASK_ENHANCEMENT = True

# Fallback AI Settings
AI_FALLBACK_ENABLED = True

# AI Processing Limits (Assignment Requirements)
AI_DAILY_LIMIT = 1000  # requests per day
AI_RATE_LIMIT = 60  # requests per minute
AI_USER_LIMIT = 100  # requests per user per day

# AI Cache Settings
AI_CACHE_ENABLED = True
AI_CACHE_TIMEOUT = 3600  # 1 hour

# Context Analysis Settings (Assignment Feature)
CONTEXT_ANALYSIS_ENABLED = True
CONTEXT_RETENTION_DAYS = 30
CONTEXT_BATCH_SIZE = 100

# Smart Categorization Settings (Assignment Feature)
AUTO_CATEGORIZATION = True
CATEGORY_CONFIDENCE_THRESHOLD = 0.7

# Task Enhancement Settings (Assignment Feature)
TASK_ENHANCEMENT_ENABLED = True
ENHANCEMENT_SUGGESTIONS_LIMIT = 8

# Priority Scoring Settings (Assignment Feature)
PRIORITY_SCORING_ENABLED = True
PRIORITY_WEIGHT_DEADLINE = 0.4
PRIORITY_WEIGHT_COMPLEXITY = 0.3
PRIORITY_WEIGHT_CONTEXT = 0.3

# Deadline Suggestion Settings (Assignment Feature)
DEADLINE_SUGGESTION_ENABLED = True
DEFAULT_DEADLINE_BUFFER_DAYS = 2

# =========================================
#  CACHING CONFIGURATION
# =========================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'smart-todo-cache',
        'TIMEOUT': 300,  # 5 minutes default
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    },
    'ai_cache': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'ai-suggestions-cache',
        'TIMEOUT': AI_CACHE_TIMEOUT,
        'OPTIONS': {
            'MAX_ENTRIES': 500,
        }
    }
}

 

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
        'ai_formatter': {
            'format': ' {levelname} {asctime} {module} - {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'level': 'INFO',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
            'maxBytes': 1024*1024*5,  # 5MB
            'backupCount': 3,
        },
        'ai_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'ai_integration.log',
            'formatter': 'ai_formatter',
            'maxBytes': 1024*1024*2,  # 2MB
            'backupCount': 2,
        },
        'context_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'context_analysis.log',
            'formatter': 'verbose',
            'maxBytes': 1024*1024*2,  # 2MB
            'backupCount': 2,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django.db.backends': {
            'level': 'WARNING',   
            'handlers': ['console'],
            'propagate': False,
        },
        'tasks': {
            'level': 'INFO',
            'handlers': ['console', 'file'],
            'propagate': False,
        },
        'context.models': {
            'level': 'INFO',
            'handlers': ['console', 'context_file'],
            'propagate': False,
        },
        'ai_integration': {
            'level': 'INFO',
            'handlers': ['console', 'ai_file'],
            'propagate': False,
        },
        'tasks.views': {
            'level': 'DEBUG',
            'handlers': ['console', 'ai_file'],
            'propagate': False,
        },
    },
}

 
# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Performance settings
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  
FILE_UPLOAD_MAX_MEMORY_SIZE = 2621440  

# Session settings
SESSION_COOKIE_AGE = 86400  
SESSION_SAVE_EVERY_REQUEST = True

 
# Task Management Settings
DEFAULT_PRIORITY = 'medium'
DEFAULT_CATEGORY = 'Other'
MAX_TASKS_PER_USER = 1000
TASK_TITLE_MAX_LENGTH = 200
TASK_DESCRIPTION_MAX_LENGTH = 2000

# Context Data Settings (Assignment Requirement)
CONTEXT_DATA_SOURCES = [
    'whatsapp_messages',
    'email_content',
    'user_notes',
    'calendar_events',
    'daily_logs'
]

# AI Analysis Features (Assignment Requirements)
AI_FEATURES = {
    'context_processing': AI_CONTEXT_PROCESSING,
    'task_prioritization': AI_TASK_PRIORITIZATION,
    'deadline_suggestions': AI_DEADLINE_SUGGESTIONS,
    'smart_categorization': AI_SMART_CATEGORIZATION,
    'task_enhancement': AI_TASK_ENHANCEMENT,
}

# Assignment Requirements Check
ASSIGNMENT_REQUIREMENTS = {
    'ai_context_processing': AI_CONTEXT_PROCESSING,
    'ai_task_prioritization': AI_TASK_PRIORITIZATION,
    'ai_deadline_suggestions': AI_DEADLINE_SUGGESTIONS,
    'ai_smart_categorization': AI_SMART_CATEGORIZATION,
    'ai_task_enhancement': AI_TASK_ENHANCEMENT,
    'context_analysis_enabled': CONTEXT_ANALYSIS_ENABLED,
    'priority_scoring_enabled': PRIORITY_SCORING_ENABLED,
    'deadline_suggestion_enabled': DEADLINE_SUGGESTION_ENABLED,
    'gemini_api_configured': bool(GEMINI_API_KEY),
}

# =========================================
# 📁 CREATE NECESSARY DIRECTORIES
# =========================================

directories_to_create = [
    BASE_DIR / 'logs',
    BASE_DIR / 'media',
    BASE_DIR / 'staticfiles',
    BASE_DIR / 'static',
]

for directory in directories_to_create:
    os.makedirs(directory, exist_ok=True)

 
if DEBUG:
    print("=" * 70)
    print(" SMART TODO - AI INTEGRATION STATUS (HARDCODED)")
    print("=" * 70)
    print(f" GEMINI_API_KEY: {' Loaded' if GEMINI_API_KEY else ' Missing'}")
    if GEMINI_API_KEY:
        print(f" Key Preview: {GEMINI_API_KEY[:15]}...{GEMINI_API_KEY[-8:]}")
    print(f" AI Provider: {AI_PROVIDER}")
    print(f" AI Model: {AI_MODEL}")
    print(f"  AI Temperature: {AI_TEMPERATURE}")
    print(f" Max Tokens: {AI_MAX_TOKENS}")
    print(f" Timeout: {AI_TIMEOUT}s")
    print()
    print("  AI FEATURES STATUS:")
    for feature, enabled in AI_FEATURES.items():
        status = " ENABLED" if enabled else " DISABLED"
        print(f"   - {feature.replace('_', ' ').title()}: {status}")
    print()
    print(" ASSIGNMENT REQUIREMENTS:")
    for req, status in ASSIGNMENT_REQUIREMENTS.items():
        check = "" if status else ""
        print(f"   {check} {req.replace('_', ' ').title()}: {status}")
    print()
    print(f" Context Analysis: {' ENABLED' if CONTEXT_ANALYSIS_ENABLED else ' DISABLED'}")
    print(f" Priority Scoring: {' ENABLED' if PRIORITY_SCORING_ENABLED else ' DISABLED'}")
    print(f" Deadline Suggestions: {' ENABLED' if DEADLINE_SUGGESTION_ENABLED else ' DISABLED'}")
    print(f"  Auto Categorization: {' ENABLED' if AUTO_CATEGORIZATION else ' DISABLED'}")
    print(f" AI Cache: {' ENABLED' if AI_CACHE_ENABLED else ' DISABLED'}")
    print()
    print(f" Database: {DATABASES['default']['NAME']} @ {DATABASES['default']['HOST']}")
    print(f" Environment: DEVELOPMENT (DEBUG={DEBUG})")
    print("=" * 70)

# =========================================
# 🔧 ENSURE PROPER IMPORTS ARE AVAILABLE
# =========================================

try:
    import google.generativeai as genai
    print(" google-generativeai library imported successfully")
except ImportError:
    print(" google-generativeai library not found. Install with: pip install google-generativeai")

try:
    import rest_framework
    print(" django-rest-framework imported successfully")
except ImportError:
    print(" django-rest-framework not found. Install with: pip install djangorestframework")

try:
    import corsheaders
    print(" django-cors-headers imported successfully")
except ImportError:
    print(" django-cors-headers not found. Install with: pip install django-cors-headers")

print(" All configurations hardcoded successfully - No .env file needed!")
