# chat/views.py
import os
import json
import traceback
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from groq import Groq  # make sure you've installed groq via pip
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import Session, Message
from .serializer import SessionSerializer, MessageSerializer

@api_view(['POST'])
def register_user(request):
    data = request.data
    try:
        if User.objects.filter(username=data['username']).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=data['email']).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            first_name=data['first_name'],
            username=data['username'],
            email=data['email'],
            password=make_password(data['password'])  # Hash the password
        )

        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
    except KeyError as e:
        return Response({'error': f'Missing field: {e}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    sessions = Session.objects.filter(user=request.user)
    serializer = SessionSerializer(sessions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    data = request.data
    title = data.get('title', 'New Chat')
    
    session = Session.objects.create(
        user=request.user,
        title=title
    )
    
    serializer = SessionSerializer(session)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_session(request, session_id):
    try:
        session = Session.objects.get(id=session_id, user=request.user)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    data = request.data
    if 'title' in data:
        session.title = data['title']
        session.save()
    
    serializer = SessionSerializer(session)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    try:
        session = Session.objects.get(id=session_id, user=request.user)
        session.delete()
        return Response({'message': 'Session deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_messages(request, session_id):
    try:
        session = Session.objects.get(id=session_id, user=request.user)
        messages = session.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    return Response({
        "first_name": user.first_name,
        "last_name": user.last_name,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_view(request):
    try:
        data = request.data
        user_input = data.get("message", "")
        session_id = data.get("session_id")

        if not user_input:
            return Response({"error": "Message is required"}, status=400)

        if not session_id:
            return Response({"error": "Session ID is required"}, status=400)

        # Get or create session for the authenticated user
        try:
            session = Session.objects.get(id=session_id, user=request.user)
        except Session.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

        # Save user message
        user_message = Message.objects.create(
            session=session,
            role="user",
            content=user_input
        )

        # ✅ Make sure your API key is properly set
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="llama3-70b-8192",  # or whichever model Groq supports
            messages=[
                {"role": "user", "content": user_input},
            ]
        )

        assistant_reply = response.choices[0].message.content.strip()

        # Save assistant message
        assistant_message = Message.objects.create(
            session=session,
            role="assistant",
            content=assistant_reply
        )

        # Update session title if it's still default
        if session.title == "New Chat":
            session.title = user_input[:50] + "..." if len(user_input) > 50 else user_input
            session.save()

        return Response({"response": assistant_reply})
    
    except Exception as e:
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)
