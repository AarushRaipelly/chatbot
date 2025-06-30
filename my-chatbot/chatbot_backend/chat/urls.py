from django.urls import path
from . import views
from .views import (
    get_user_info, register_user, get_sessions, create_session, 
    update_session, delete_session, get_session_messages
)

urlpatterns = [
    path('chat/', views.chat_view, name='chat'),
    path('api/user/', get_user_info, name='get_user_info'),
    path('api/register/', register_user),
    path('api/sessions/', get_sessions, name='get_sessions'),
    path('api/sessions/create/', create_session, name='create_session'),
    path('api/sessions/<int:session_id>/', update_session, name='update_session'),
    path('api/sessions/<int:session_id>/delete/', delete_session, name='delete_session'),
    path('api/sessions/<int:session_id>/messages/', get_session_messages, name='get_session_messages'),
]