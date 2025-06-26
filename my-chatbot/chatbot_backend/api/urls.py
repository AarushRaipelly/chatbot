from django.urls import path
from .views import ChatAPIView, register_user

urlpatterns = [
    path("chat/", ChatAPIView.as_view(), name="chat"),
     path('register/', register_user),
]


