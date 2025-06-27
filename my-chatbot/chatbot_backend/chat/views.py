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
