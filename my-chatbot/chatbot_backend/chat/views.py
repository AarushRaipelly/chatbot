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
def get_user_info(request):
    user = request.user
    return Response({
        "first_name": user.first_name,
        "last_name": user.last_name,
    })

@csrf_exempt
def chat_view(request):
    try:
        data = json.loads(request.body)
        user_input = data.get("message", "")

        if not user_input:
            return JsonResponse({"error": "Message is required"}, status=400)

        # ✅ Make sure your API key is properly set
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="llama3-70b-8192",  # or whichever model Groq supports
            messages=[
                {"role": "user", "content": user_input},
            ]
        )

        assistant_reply = response.choices[0].message.content.strip()

        return JsonResponse({"response": assistant_reply})
    
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


from groq import Groq

def chat_api(request):
    data = request.json()
    message = data.get('message')
    session_id = data.get('sessionId')
    conversation_history = data.get('conversationHistory', [])
    system_prompt = data.get('systemPrompt', 'You are a helpful assistant.')
    
    client = Groq(api_key="your-groq-api-key")
    
    # Build messages array with conversation history
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add conversation history (this maintains context)
    for msg in conversation_history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Make the API call to Groq with full conversation context
    chat_completion = client.chat.completions.create(
        messages=messages,
        model="llama3-8b-8192",  # or your preferred model
        max_tokens=30,
        temperature=0.7,
    )
    
    response = chat_completion.choices[0].message.content
    
    return {"response": response}