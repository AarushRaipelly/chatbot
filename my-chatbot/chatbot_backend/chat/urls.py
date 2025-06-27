from django.urls import path
from . import views
from .views import get_user_info

urlpatterns = [
    path('chat/', views.chat_view, name='chat'),
     path('api/user/', get_user_info, name='get_user_info')
]