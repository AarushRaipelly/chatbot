# Chatbot API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
All protected endpoints require JWT authentication using Bearer tokens.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Authentication Endpoints

### 1. User Registration
**POST** `/api/register/`

Register a new user account.

**Request Body:**
```json
{
  "first_name": "John",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or user already exists
```json
{
  "error": "Username already exists"
}
```

---

### 2. Login (Get JWT Token)
**POST** `/api/token/`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

### 3. Refresh Token
**POST** `/api/token/refresh/`

Refresh an expired access token.

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## User Endpoints

### 4. Get User Info
**GET** `/api/user/`

Get authenticated user's information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "first_name": "John",
  "last_name": ""
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Chat Session Endpoints

### 5. Get User Sessions
**GET** `/api/sessions/`

Retrieve all chat sessions for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "New Chat",
    "created_at": "2025-06-30T10:30:00Z",
    "user": 1,
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "Hello",
        "timestamp": "2025-06-30T10:31:00Z",
        "session": 1
      },
      {
        "id": 2,
        "role": "assistant", 
        "content": "Hi there! How can I help you?",
        "timestamp": "2025-06-30T10:31:05Z",
        "session": 1
      }
    ]
  }
]
```

---

### 6. Create New Session
**POST** `/api/sessions/create/`

Create a new chat session for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "My Custom Chat"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "title": "My Custom Chat",
  "created_at": "2025-06-30T11:00:00Z",
  "user": 1,
  "messages": []
}
```

---

### 7. Update Session
**PUT** `/api/sessions/<session_id>/`

Update a session's title.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Session Title"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Updated Session Title",
  "created_at": "2025-06-30T10:30:00Z",
  "user": 1,
  "messages": [...]
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Session not found"
}
```

---

### 8. Delete Session
**DELETE** `/api/sessions/<session_id>/delete/`

Delete a specific session and all its messages.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204 No Content):**
```json
{
  "message": "Session deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Session not found"
}
```

---

### 9. Get Session Messages
**GET** `/api/sessions/<session_id>/messages/`

Retrieve all messages for a specific session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "role": "user",
    "content": "Hello",
    "timestamp": "2025-06-30T10:31:00Z",
    "session": 1
  },
  {
    "id": 2,
    "role": "assistant",
    "content": "Hi there! How can I help you?",
    "timestamp": "2025-06-30T10:31:05Z",
    "session": 1
  }
]
```

---

## Chat Endpoints

### 10. Send Chat Message
**POST** `/api/chat/`

Send a message to the AI and save the conversation.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What is the weather like today?",
  "session_id": 1
}
```

**Response (200 OK):**
```json
{
  "response": "I don't have access to real-time weather data, but I can help you with other questions!"
}
```

**Error Responses:**
- `400 Bad Request`: Missing message or session_id
```json
{
  "error": "Message is required"
}
```

- `404 Not Found`: Session doesn't exist or doesn't belong to user
```json
{
  "error": "Session not found"
}
```

- `500 Internal Server Error`: AI service error
```json
{
  "error": "AI service temporarily unavailable"
}
```

---

## Error Handling

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Resource deleted successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Common Error Response Format
```json
{
  "error": "Error description"
}
```

---

## Rate Limiting
Currently no rate limiting is implemented. Consider adding rate limiting for production use.

---

## Data Models

### User
- `id`: Integer (Primary Key)
- `username`: String (Unique)
- `email`: String (Unique)
- `first_name`: String
- `password`: String (Hashed)

### Session
- `id`: Integer (Primary Key)
- `user`: ForeignKey to User
- `title`: String (max 100 chars)
- `created_at`: DateTime

### Message
- `id`: Integer (Primary Key)
- `session`: ForeignKey to Session
- `role`: String ("user" or "assistant")
- `content`: Text
- `timestamp`: DateTime

---

## Example Usage

### Complete Authentication Flow
```javascript
// 1. Register user
const registerResponse = await fetch('/api/register/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: 'John',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'securepassword123'
  })
});

// 2. Login and get tokens
const loginResponse = await fetch('/api/token/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'securepassword123'
  })
});
const { access, refresh } = await loginResponse.json();

// 3. Create session
const sessionResponse = await fetch('/api/sessions/create/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access}`
  },
  body: JSON.stringify({ title: 'My Chat' })
});
const session = await sessionResponse.json();

// 4. Send message
const chatResponse = await fetch('/api/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access}`
  },
  body: JSON.stringify({
    message: 'Hello!',
    session_id: session.id
  })
});
const { response } = await chatResponse.json();
```