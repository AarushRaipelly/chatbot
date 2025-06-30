# from django.urls import path
# from . import views
# from .views import get_user_info, register_user

# urlpatterns = [
#     path('chat/', views.chat_view, name='chat'),
#      path('api/user/', get_user_info, name='get_user_info'),
#      path('api/register/', register_user),
# ]
from django.urls import path
from . import views

urlpatterns = [
    # Chat endpoints
    path('chat/', views.chat_view, name='chat'),
    path('api/sessions/create/', views.create_new_session, name='create_new_session'),
    path('api/sessions/', views.get_user_sessions, name='get_user_sessions'),
    # path('api/sessions/<int:session_id>/messages/', views.get_session_messages, name='get_session_messages'),
    path('api/sessions/<str:session_id>/delete/', views.delete_session, name='delete_session'),
    path('api/sessions/<str:session_id>/update-title/', views.update_session_title, name='update_session_title'),
    path('api/sessions/<uuid:session_id>/messages/', views.session_messages),

    # User endpoints
    path('api/user/', views.get_user_info, name='get_user_info'),
    path('api/register/', views.register_user, name='register_user'),
]