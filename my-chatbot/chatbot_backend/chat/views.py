import os
import json
import traceback
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from groq import Groq
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import Session, Message
from .serializer import SessionSerializer, MessageSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
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
            password=make_password(data['password'])
        )

        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
    except KeyError as e:
        return Response({'error': f'Missing field: {e}'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    sessions = Session.objects.filter(user=request.user)
    serializer = SessionSerializer(sessions, many=True)
    return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def chat_view(request):
    if request.method == 'GET':
        session_id = request.GET.get("session_id") or request.GET.get("sessionId")
        return JsonResponse({
            "message": "GET request received on /api/chat/",
            "session_id": session_id,
        })

    try:
        data = request.data  # use DRF's smart parser
        user_input = data.get("message", "")
        session_id = data.get("session_id") or data.get("sessionId")
        guest_session_id = data.get("guest_session_id") or data.get("guestSessionId")
        is_guest = data.get("is_guest", False)

        if not user_input:
            return JsonResponse({"error": "Message is required"}, status=400)

        session = None

        if is_guest:
            if not guest_session_id:
                guest_session_id = str(uuid.uuid4())

            if session_id:
                try:
                    session = Session.objects.get(
                        id=session_id,
                        is_guest_session=True,
                        guest_session_id=guest_session_id,
                    )
                except Session.DoesNotExist:
                    pass

            if not session:
                session = Session.objects.create(
                    title="Guest Chat",
                    is_guest_session=True,
                    guest_session_id=guest_session_id,
                )
        else:
            if not request.user.is_authenticated:
                return JsonResponse(
                    {"error": "Authentication required for user sessions"}, status=401
                )

            if session_id:
                try:
                    session = Session.objects.get(id=session_id, user=request.user)
                except Session.DoesNotExist:
                    pass

            if not session:
                session = Session.objects.create(user=request.user, title="New Chat")

        # Save user message
        Message.objects.create(session=session, role="user", content=user_input)

        messages = list(session.messages.all())
        conversation_history = [
            {"role": msg.role, "content": msg.content} for msg in messages[:-1]
        ]

        from groq import Groq
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                *conversation_history,
                {"role": "user", "content": user_input},
            ],
            max_tokens=1000,
            temperature=0.7,
        )

        assistant_reply = response.choices[0].message.content.strip()

        Message.objects.create(session=session, role="assistant", content=assistant_reply)

        if session.messages.count() == 2 and session.title in ["New Chat", "Guest Chat"]:
            title = user_input[:47] + "..." if len(user_input) > 50 else user_input
            session.title = title
            session.save()

        response_data = {
            "response": assistant_reply,
            "session_id": str(session.id),
        }

        if is_guest:
            response_data["guest_session_id"] = guest_session_id

        return JsonResponse(response_data)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_sessions(request):
    """Get all sessions for the authenticated user"""
    sessions = Session.objects.filter(user=request.user, is_guest_session=False)
    serializer = SessionSerializer(sessions, many=True)
    return Response(serializer.data)

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_sessions(request):
#     sessions = Session.objects.filter(user=request.user)
#     serializer = SessionSerializer(sessions, many=True)
#     return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_sessions(request):
    if request.user.is_authenticated:
        sessions = Session.objects.filter(user=request.user, is_guest_session=False)
    else:
        guest_session_id = request.GET.get('guest_session_id')
        if not guest_session_id:
            return Response({"error": "Guest session ID required"}, status=400)
        sessions = Session.objects.filter(guest_session_id=guest_session_id, is_guest_session=True)

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

@api_view(['GET'])
@permission_classes([AllowAny])
def session_messages(request, session_id):
    """Get messages for a specific session"""
    try:
        if request.user.is_authenticated:
            # Authenticated user - can access their own sessions
            session = Session.objects.get(id=session_id, user=request.user)
        else:
            # Guest user - can only access guest sessions with proper guest_session_id
            guest_session_id = request.GET.get('guest_session_id')
            if not guest_session_id:
                return Response({"error": "Guest session ID required"}, status=400)
            session = Session.objects.get(
                id=session_id, 
                is_guest_session=True, 
                guest_session_id=guest_session_id
            )
        
        messages = session.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response({
            "session": SessionSerializer(session).data,
            "messages": serializer.data
        })
    except Session.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)

# @api_view(['DELETE'])
# @permission_classes([IsAuthenticated])
# def delete_session(request, session_id):
#     """Delete a session (only for authenticated users)"""
#     try:
#         session = Session.objects.get(id=session_id, user=request.user)
#         session.delete()
#         return Response({"message": "Session deleted successfully"})
#     except Session.DoesNotExist:
#         return Response({"error": "Session not found"}, status=404)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_session(request, session_id):
    try:
        if request.user.is_authenticated:
            session = Session.objects.get(id=session_id, user=request.user)
        else:
            guest_session_id = request.data.get('guest_session_id')
            if not guest_session_id:
                return Response({"error": "Guest session ID required"}, status=400)
            session = Session.objects.get(id=session_id, is_guest_session=True, guest_session_id=guest_session_id)

        session.delete()
        return Response({"message": "Session deleted successfully"})
    except Session.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)


# @api_view(['PUT'])
# @permission_classes([IsAuthenticated])
# def update_session_title(request, session_id):
#     """Update session title (only for authenticated users)"""
#     try:
#         session = Session.objects.get(id=session_id, user=request.user)
#         new_title = request.data.get('title', '').strip()
#         if not new_title:
#             return Response({"error": "Title is required"}, status=400)
        
#         session.title = new_title
#         session.save()
#         return Response({"message": "Session title updated successfully"})
#     except Session.DoesNotExist:
#         return Response({"error": "Session not found"}, status=404)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_session_title(request, session_id):
    try:
        if request.user.is_authenticated:
            session = Session.objects.get(id=session_id, user=request.user)
        else:
            guest_session_id = request.data.get('guest_session_id')
            if not guest_session_id:
                return Response({"error": "Guest session ID required"}, status=400)
            session = Session.objects.get(id=session_id, is_guest_session=True, guest_session_id=guest_session_id)

        new_title = request.data.get('title', '').strip()
        if not new_title:
            return Response({"error": "Title is required"}, status=400)

        session.title = new_title
        session.save()
        return Response({"message": "Session title updated successfully"})
    except Session.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_new_session(request):
    """Create a new session"""
    is_guest = request.data.get('is_guest', False)
    
    if is_guest:
        guest_session_id = str(uuid.uuid4())
        session = Session.objects.create(
            title="Guest Chat",
            is_guest_session=True,
            guest_session_id=guest_session_id
        )
        return Response({
            "session_id": str(session.id),
            "guest_session_id": guest_session_id,
            "title": session.title
        })
    else:
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)
        
        session = Session.objects.create(
            user=request.user,
            title="New Chat"
        )
        return Response({
            "session_id": str(session.id),
            "title": session.title
        })
