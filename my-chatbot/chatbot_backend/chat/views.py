# chat/views.py
import os
import json
import traceback
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from groq import Groq  # make sure you've installed groq via pip

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
