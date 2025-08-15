from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContextEntryViewSet

router = DefaultRouter()
router.register(r'entries', ContextEntryViewSet, basename='contextentry')

urlpatterns = [
    path('', include(router.urls)),
]
