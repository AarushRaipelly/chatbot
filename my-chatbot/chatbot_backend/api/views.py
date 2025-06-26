from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class ChatAPIView(APIView):
    def post(self, request):
        user_message = request.data.get("message")

        if not user_message:
            return Response({"error": "No message provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Dummy response logic — replace with real LLM logic later
        bot_response = f"You said: {user_message}"

        return Response({"response": bot_response}, status=status.HTTP_200_OK)
