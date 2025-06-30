# Backend Code Documentation

## Project Structure

```
chatbot_backend/
├── chatbot_backend/          # Main Django project
│   ├── __init__.py
│   ├── settings.py          # Django settings and configuration
│   ├── urls.py              # Main URL routing
│   ├── wsgi.py              # WSGI configuration
│   └── asgi.py              # ASGI configuration
├── chat/                    # Chat application
│   ├── migrations/          # Database migrations
│   ├── __init__.py
│   ├── admin.py            # Django admin configuration
│   ├── apps.py             # App configuration
│   ├── models.py           # Database models
│   ├── serializer.py       # DRF serializers
│   ├── urls.py             # App URL routing
│   ├── views.py            # API view functions
│   └── tests.py            # Unit tests
├── api/                     # Additional API app (unused)
└── manage.py               # Django management script
```

---

## Models Documentation

### File: `chat/models.py`

#### Session Model
```python
class Session(models.Model):
    """
    Represents a chat session belonging to a specific user.
    
    Attributes:
        user (ForeignKey): Reference to the Django User model
        title (CharField): Session title, defaults to "New Chat"
        created_at (DateTimeField): Timestamp of session creation
    
    Meta:
        ordering: Sessions ordered by creation date (newest first)
    """
```

**Fields:**
- `user`: Links session to a specific user (CASCADE delete)
- `title`: String up to 100 characters for session identification
- `created_at`: Auto-populated timestamp on creation

**Relationships:**
- One-to-Many with User (user can have multiple sessions)
- One-to-Many with Message (session can have multiple messages)

#### Message Model
```python
class Message(models.Model):
    """
    Represents a single message within a chat session.
    
    Attributes:
        session (ForeignKey): Reference to the parent Session
        role (CharField): Either "user" or "assistant"
        content (TextField): The actual message content
        timestamp (DateTimeField): When the message was created
    
    Meta:
        ordering: Messages ordered by timestamp (oldest first)
    """
```

**Fields:**
- `session`: Links message to a specific session (CASCADE delete)
- `role`: Distinguishes between user and AI messages (max 20 chars)
- `content`: Unlimited text content for the message
- `timestamp`: Auto-populated timestamp on creation

---

## Views Documentation

### File: `chat/views.py`

#### Authentication Views

##### `register_user(request)`
```python
@api_view(['POST'])
def register_user(request):
    """
    Register a new user account.
    
    Args:
        request: HTTP request containing user registration data
        
    Request Data:
        - first_name: User's first name
        - username: Unique username
        - email: User's email address
        - password: Plain text password (will be hashed)
    
    Returns:
        Response: JSON response with success message or error
        
    Raises:
        KeyError: If required fields are missing
        HTTP_400_BAD_REQUEST: If username/email already exists
    """
```

**Process Flow:**
1. Extract user data from request
2. Check for existing username/email
3. Create user with hashed password
4. Return success response

##### `get_user_info(request)`
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """
    Get authenticated user's basic information.
    
    Args:
        request: HTTP request with authentication token
        
    Returns:
        Response: JSON containing user's first_name and last_name
        
    Security:
        Requires valid JWT authentication token
    """
```

#### Session Management Views

##### `get_sessions(request)`
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    """
    Retrieve all chat sessions for the authenticated user.
    
    Args:
        request: Authenticated HTTP request
        
    Returns:
        Response: JSON array of user's sessions with nested messages
        
    Security:
        Only returns sessions belonging to the authenticated user
    """
```

##### `create_session(request)`
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """
    Create a new chat session for the authenticated user.
    
    Args:
        request: HTTP request with optional title
        
    Request Data:
        - title (optional): Custom session title, defaults to "New Chat"
    
    Returns:
        Response: JSON representation of created session
        
    Process:
        1. Extract title from request data
        2. Create session linked to authenticated user  
        3. Return serialized session data
    """
```

##### `update_session(request, session_id)`
```python
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_session(request, session_id):
    """
    Update an existing session's properties.
    
    Args:
        request: HTTP request with update data
        session_id: ID of session to update
        
    Request Data:
        - title: New session title
    
    Returns:
        Response: Updated session data or error if not found
        
    Security:
        Only allows updating sessions owned by authenticated user
    """
```

##### `delete_session(request, session_id)`
```python
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    """
    Delete a session and all its associated messages.
    
    Args:
        request: Authenticated HTTP request
        session_id: ID of session to delete
        
    Returns:
        Response: Success message or error if not found
        
    Process:
        1. Verify session exists and belongs to user
        2. Delete session (cascades to delete messages)
        3. Return confirmation
        
    Security:
        Only allows deleting sessions owned by authenticated user
    """
```

##### `get_session_messages(request, session_id)`
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_messages(request, session_id):
    """
    Retrieve all messages for a specific session.
    
    Args:
        request: Authenticated HTTP request
        session_id: ID of session to get messages from
        
    Returns:
        Response: JSON array of messages ordered by timestamp
        
    Security:
        Only returns messages from sessions owned by authenticated user
    """
```

#### Chat Processing View

##### `chat_view(request)`
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_view(request):
    """
    Process a chat message and generate AI response.
    
    Args:
        request: HTTP request with message and session data
        
    Request Data:
        - message: User's message content
        - session_id: ID of session for the conversation
    
    Returns:
        Response: JSON with AI response
        
    Process Flow:
        1. Validate message and session_id
        2. Verify session belongs to authenticated user
        3. Save user message to database
        4. Call Groq AI API for response
        5. Save AI response to database
        6. Update session title if default
        7. Return AI response
        
    External Dependencies:
        - Groq API for AI responses
        - GROQ_API_KEY environment variable
        
    Error Handling:
        - Missing message/session_id: 400 Bad Request
        - Session not found: 404 Not Found
        - AI API errors: 500 Internal Server Error
    """
```

**Detailed Process:**
1. **Input Validation**: Checks for required message and session_id
2. **Authorization**: Verifies session belongs to authenticated user
3. **Message Storage**: Creates user Message record in database
4. **AI Processing**: Calls Groq API with user input
5. **Response Storage**: Creates assistant Message record
6. **Title Update**: Auto-updates session title from user's first message
7. **Response Return**: Returns AI-generated response

---

## Serializers Documentation

### File: `chat/serializer.py`

#### MessageSerializer
```python
class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for Message model.
    
    Handles conversion between Message model instances and JSON.
    Includes all fields: id, session, role, content, timestamp
    
    Usage:
        - Serializing: Convert Message objects to JSON
        - Deserializing: Create Message objects from JSON data
    """
    class Meta:
        model = Message
        fields = '__all__'
```

#### SessionSerializer
```python
class SessionSerializer(serializers.ModelSerializer):
    """
    Serializer for Session model with nested messages.
    
    Includes all session fields plus related messages.
    Messages are read-only and automatically included.
    
    Features:
        - Nested message serialization
        - Read-only message relationship
        - Full session data representation
    """
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Session
        fields = '__all__'
```

---

## URL Configuration

### File: `chat/urls.py`

```python
urlpatterns = [
    # Chat endpoint
    path('chat/', views.chat_view, name='chat'),
    
    # User endpoints
    path('api/user/', get_user_info, name='get_user_info'),
    path('api/register/', register_user),
    
    # Session management endpoints
    path('api/sessions/', get_sessions, name='get_sessions'),
    path('api/sessions/create/', create_session, name='create_session'),
    path('api/sessions/<int:session_id>/', update_session, name='update_session'),
    path('api/sessions/<int:session_id>/delete/', delete_session, name='delete_session'),
    path('api/sessions/<int:session_id>/messages/', get_session_messages, name='get_session_messages'),
]
```

### File: `chatbot_backend/urls.py`

```python
urlpatterns = [
    path("admin/", admin.site.urls),              # Django admin interface
    path("api/", include("chat.urls")),           # Chat app URLs with /api/ prefix
    path("api/token/", TokenObtainPairView.as_view()),     # JWT login
    path("api/token/refresh/", TokenRefreshView.as_view()), # JWT refresh
    path('', include('chat.urls')),               # Direct chat URLs
]
```

---

## Settings Configuration

### File: `chatbot_backend/settings.py`

#### Key Settings

```python
# Security Settings
SECRET_KEY = 'django-insecure-i6(4+u!ius!&f%-s=(v*)*hpye!ryw$kiqn@c!9=8u50a34ue_'
DEBUG = True  # Set to False in production
ALLOWED_HOSTS = []  # Configure for production

# Database Configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Installed Applications
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',           # Django REST Framework
    'rest_framework_simplejwt', # JWT Authentication
    'corsheaders',             # CORS handling
    'chat',                    # Custom chat app
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]  # React dev server
CORS_ALLOW_ALL_ORIGINS = True  # Set to False in production

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# External API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Not currently used
GROQ_API_KEY = os.getenv("GROQ_API_KEY")      # Used for AI responses
```

---

## Security Considerations

### Authentication & Authorization
- JWT tokens for stateless authentication
- Permission classes ensure user-specific data access
- Password hashing using Django's built-in system

### Data Protection
- User sessions isolated by foreign key relationships
- Input validation on all endpoints
- SQL injection protection via ORM

### Production Recommendations
1. **Environment Variables**: Move sensitive settings to environment variables
2. **CORS**: Restrict CORS origins to specific domains
3. **HTTPS**: Enable SSL/TLS encryption
4. **Rate Limiting**: Implement API rate limiting
5. **Logging**: Add comprehensive logging for monitoring
6. **Database**: Use PostgreSQL instead of SQLite
7. **Secret Key**: Generate new SECRET_KEY for production

---

## Error Handling

### Common Error Patterns
```python
# Session ownership validation
try:
    session = Session.objects.get(id=session_id, user=request.user)
except Session.DoesNotExist:
    return Response({'error': 'Session not found'}, status=404)

# Input validation
if not user_input:
    return Response({"error": "Message is required"}, status=400)

# External API error handling
try:
    # API call
    response = client.chat.completions.create(...)
except Exception as e:
    traceback.print_exc()
    return Response({"error": str(e)}, status=500)
```

---

## Dependencies

### Core Requirements
- **Django 5.2.3**: Web framework
- **djangorestframework**: REST API development
- **djangorestframework-simplejwt**: JWT authentication
- **django-cors-headers**: CORS handling
- **groq**: AI API client
- **python-dotenv**: Environment variable management

### Development Tools
- **sqlite3**: Development database
- **python-decouple**: Settings management (if added)

---

## Database Migrations

### Creating Migrations
```bash
python manage.py makemigrations chat
```

### Applying Migrations
```bash
python manage.py migrate
```

### Migration Files
- `0001_initial.py`: Initial session and message models
- Future migrations will be numbered sequentially

---

## Testing

### Running Tests
```bash
python manage.py test chat
```

### Test Structure (Future)
```python
# Example test structure
class SessionModelTest(TestCase):
    def test_session_creation(self):
        # Test session model functionality
        pass
        
class ChatAPITest(APITestCase):
    def test_chat_endpoint(self):
        # Test chat API functionality
        pass
```

---

## Performance Considerations

### Database Optimization
- Indexes on foreign keys (automatic)
- Consider pagination for large message lists
- Database connection pooling for production

### Caching Opportunities
- User session lists
- Frequently accessed messages
- AI response caching for repeated queries

### API Optimization
- Implement pagination for session/message lists
- Add field selection for API responses
- Consider GraphQL for complex queries