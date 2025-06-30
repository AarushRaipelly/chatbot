# Frontend Code Documentation

## Project Structure

```
src/
├── App.jsx              # Main application component with routing
├── Login.jsx            # User authentication component
├── Register.jsx         # User registration component
├── ChatBox.jsx          # Main chat interface component
├── ChatMessage.jsx      # Individual message display component
├── main.jsx             # React application entry point
└── index.css            # Global styles
```

---

## Component Documentation

### File: `src/App.jsx`

#### App Component
```jsx
const App = () => {
  /*
   * Main application component that handles routing and authentication state.
   * 
   * Features:
   * - Route protection based on authentication status
   * - Automatic redirect to login for unauthenticated users
   * - Client-side routing with React Router
   * 
   * Routes:
   * - / : Protected route showing ChatBox or redirecting to login
   * - /login : Login page
   * - /register : Registration page
   */
}
```

**Key Functions:**
- `isAuthenticated()`: Checks for valid access token in localStorage
- Uses React Router for single-page application navigation
- Implements route protection pattern

**Authentication Flow:**
1. Check for access token in localStorage
2. Redirect unauthenticated users to login
3. Allow authenticated users to access chat interface

---

### File: `src/Login.jsx`

#### Login Component
```jsx
const Login = () => {
  /*
   * User authentication component with JWT token handling.
   * 
   * State Management:
   * - username: User's login identifier
   * - password: User's password input
   * 
   * Features:
   * - Form validation
   * - JWT token storage
   * - Error handling
   * - Navigation after successful login
   */
}
```

**State Variables:**
```jsx
const [username, setUsername] = useState("");  // User login input
const [password, setPassword] = useState("");  // Password input
const navigate = useNavigate();                // Router navigation hook
```

**Key Functions:**

##### `handleLogin()`
```jsx
const handleLogin = async () => {
  /*
   * Authenticates user with backend API and stores JWT tokens.
   * 
   * Process:
   * 1. Send POST request to /api/token/ with credentials
   * 2. Store access and refresh tokens in localStorage
   * 3. Navigate to main application on success
   * 4. Display error message on failure
   * 
   * Error Handling:
   * - Network errors
   * - Invalid credentials
   * - Server errors
   */
}
```

**API Integration:**
- Endpoint: `POST /api/token/`
- Stores tokens: `localStorage.setItem("access", data.access)`
- Navigation: `navigate("/")` on success

---

### File: `src/Register.jsx`

#### Register Component
```jsx
const Register = () => {
  /*
   * User registration component with form validation.
   * 
   * Features:
   * - Multi-field registration form
   * - Client-side validation
   * - Success/error message display
   * - Automatic redirect to login after registration
   */
}
```

**State Management:**
```jsx
const [formData, setFormData] = useState({
  first_name: "",
  username: "",
  email: "",
  password: "",
});
const [error, setError] = useState("");        // Error message display
const [success, setSuccess] = useState("");    // Success message display
```

**Key Functions:**

##### `handleChange(e)`
```jsx
const handleChange = (e) => {
  /*
   * Updates form data state when input fields change.
   * 
   * Uses functional state update to merge new field value
   * with existing form data object.
   */
  setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
};
```

##### `handleSubmit(e)`
```jsx
const handleSubmit = async (e) => {
  /*
   * Submits registration form to backend API.
   * 
   * Process:
   * 1. Prevent default form submission
   * 2. Clear previous error/success messages
   * 3. POST form data to /api/register/
   * 4. Handle success with confirmation message
   * 5. Redirect to login after 2 seconds
   * 6. Display error messages if registration fails
   */
}
```

**Form Validation:**
- Required fields validation via HTML5 attributes
- Email format validation
- Error display for duplicate username/email

---

### File: `src/ChatBox.jsx`

#### ChatBox Component
```jsx
const ChatBox = () => {
  /*
   * Main chat interface component with session management.
   * 
   * Features:
   * - Multi-session chat management
   * - Real-time message display
   * - AI chat integration
   * - Session CRUD operations
   * - User authentication integration
   * - Placeholder feature implementations
   */
}
```

**State Management:**
```jsx
// Core chat state
const [input, setInput] = useState("");                    // Current message input
const [sending, setSending] = useState(false);            // Message sending status
const [user, setUser] = useState(null);                   // User information
const [isAuthenticated, setIsAuthenticated] = useState(); // Auth status

// Session management
const [sessions, setSessions] = useState([]);             // User's chat sessions
const [activeSessionId, setActiveSessionId] = useState(null); // Current session
const [messages, setMessages] = useState([]);             // Current session messages
```

**Lifecycle Hooks:**

##### Initial Data Loading
```jsx
useEffect(() => {
  /*
   * Runs on component mount to load user data and sessions.
   * 
   * Actions:
   * 1. Verify authentication token exists
   * 2. Fetch user information from /api/user/
   * 3. Load user's sessions from /api/sessions/
   * 4. Set first session as active if available
   */
  const token = localStorage.getItem("access");
  if (!token) return;
  
  // Fetch user info and sessions
  fetchUserInfo();
  fetchSessions();
}, []);
```

##### Message Loading
```jsx
useEffect(() => {
  /*
   * Loads messages when active session changes.
   * 
   * Triggers API call to fetch messages for the selected session.
   */
  if (activeSessionId) {
    fetchMessages(activeSessionId);
  }
}, [activeSessionId]);
```

**API Integration Functions:**

##### `fetchSessions()`
```jsx
const fetchSessions = async () => {
  /*
   * Retrieves all user sessions from backend API.
   * 
   * Process:
   * 1. Check for authentication token
   * 2. GET request to /api/sessions/
   * 3. Update sessions state
   * 4. Set first session as active if none selected
   * 
   * Error Handling:
   * - Token validation
   * - Network error logging
   */
}
```

##### `fetchMessages(sessionId)`
```jsx
const fetchMessages = async (sessionId) => {
  /*
   * Loads messages for a specific session.
   * 
   * Args:
   *   sessionId: ID of session to load messages from
   * 
   * Updates messages state with chronologically ordered messages.
   */
}
```

**Chat Functions:**

##### `sendMessage()`
```jsx
const sendMessage = async () => {
  /*
   * Sends user message to AI and handles response.
   * 
   * Process:
   * 1. Validate input and authentication
   * 2. Clear input field and set sending state
   * 3. POST to /api/chat/ with message and session_id
   * 4. Refresh messages and sessions after response
   * 5. Handle errors and reset sending state
   * 
   * Features:
   * - Optimistic UI updates
   * - Auto session title updates
   * - Error handling
   */
}
```

**Session Management Functions:**

##### `handleNewSession()`
```jsx
const handleNewSession = async () => {
  /*
   * Creates a new chat session.
   * 
   * Process:
   * 1. POST to /api/sessions/create/ with default title
   * 2. Set new session as active
   * 3. Clear messages for fresh start
   * 4. Refresh sessions list
   */
}
```

##### `handleEditSession(id)`
```jsx
const handleEditSession = async (id) => {
  /*
   * Updates session title via user prompt.
   * 
   * Args:
   *   id: Session ID to update
   * 
   * Process:
   * 1. Prompt user for new title
   * 2. PUT request to /api/sessions/{id}/ with new title
   * 3. Refresh sessions to show updated title
   */
}
```

##### `handleDeleteSession(id)`
```jsx
const handleDeleteSession = async (id) => {
  /*
   * Deletes a session and all its messages.
   * 
   * Args:
   *   id: Session ID to delete
   * 
   * Process:
   * 1. DELETE request to /api/sessions/{id}/delete/
   * 2. Switch to another session if deleted session was active
   * 3. Create new session if no sessions remain
   * 4. Refresh sessions list
   */
}
```

##### `handleClear()`
```jsx
const handleClear = async () => {
  /*
   * Clears current session by deleting and recreating it.
   * 
   * Process:
   * 1. Delete current session
   * 2. Create new session with "New Chat" title
   * 3. Set new session as active
   * 4. Clear messages display
   */
}
```

**Feature Placeholder Functions:**

##### `handleSora()`
```jsx
const handleSora = async () => {
  /*
   * Placeholder for Sora video generation feature.
   * 
   * Current Implementation:
   * 1. Prompt user for scene description
   * 2. Send description as chat message
   * 3. AI responds with placeholder message
   * 
   * Future Enhancement:
   * Integration with actual video generation API
   */
}
```

##### `handleGpts()`
```jsx
const handleGpts = async () => {
  /*
   * Placeholder for specialized GPT functionality.
   * 
   * Current Implementation:
   * 1. Prompt user for task description
   * 2. Send task as chat message
   * 3. AI responds with capability message
   * 
   * Future Enhancement:
   * Route to specialized AI models based on task type
   */
}
```

##### `handleLibrary()`
```jsx
const handleLibrary = async () => {
  /*
   * Placeholder for document/knowledge library feature.
   * 
   * Current Implementation:
   * Sends library request as chat message
   * 
   * Future Enhancement:
   * Integration with document search and retrieval
   */
}
```

##### `handleSearch()`
```jsx
const handleSearch = () => {
  /*
   * Searches messages in current session for specific terms.
   * 
   * Process:
   * 1. Prompt user for search query
   * 2. Filter current messages by query
   * 3. Display matches in alert dialog
   * 
   * Features:
   * - Case-insensitive search
   * - Message content matching
   * - Result count display
   */
}
```

**Authentication Functions:**

##### `handleLogout()`
```jsx
const handleLogout = () => {
  /*
   * Logs out user by clearing stored tokens.
   * 
   * Process:
   * 1. Remove access and refresh tokens from localStorage
   * 2. Update authentication state
   * 3. User redirected to login by App component
   */
}
```

---

### File: `src/ChatMessage.jsx`

#### ChatMessage Component
```jsx
const ChatMessage = ({ role, content }) => {
  /*
   * Displays individual chat messages with role-based styling.
   * 
   * Props:
   *   role: "user" or "assistant" - determines message alignment
   *   content: String - the message text to display
   * 
   * Features:
   * - Responsive message bubbles
   * - Role-based styling and positioning
   * - Content text display
   */
}
```

**Styling Logic:**
```jsx
const isUser = role === "user";

// Conditional styling based on message role
const alignment = isUser ? "justify-end" : "justify-start";
const styling = isUser ? "bg-white text-black" : "bg-white text-black";
```

**Component Structure:**
- Flexbox container for alignment
- Message bubble with padding and styling
- Content text display
- Responsive design with max-width constraints

---

### File: `src/main.jsx`

#### Application Entry Point
```jsx
/*
 * React application entry point and initialization.
 * 
 * Responsibilities:
 * - Mount React application to DOM
 * - Import global styles
 * - Configure React StrictMode for development
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## State Management Patterns

### Authentication State
```jsx
// Authentication check function
const isAuthenticated = () => !!localStorage.getItem("access");

// State management
const [isAuthenticated, setIsAuthenticated] = useState(() => {
  return !!localStorage.getItem("access");
});
```

### Session State Management
```jsx
// Session data structure
const sessionStructure = {
  id: Number,           // Unique session identifier
  title: String,        // Display name for session
  created_at: String,   // ISO timestamp
  user: Number,         // User ID (foreign key)
  messages: Array       // Associated messages
};

// Message data structure
const messageStructure = {
  id: Number,           // Unique message identifier
  role: String,         // "user" or "assistant"
  content: String,      // Message text
  timestamp: String,    // ISO timestamp
  session: Number       // Session ID (foreign key)
};
```

### Form State Patterns
```jsx
// Controlled input pattern
const [input, setInput] = useState("");

// Object state pattern for forms
const [formData, setFormData] = useState({
  field1: "",
  field2: "",
  // ...
});

// Dynamic form updates
const handleChange = (e) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
};
```

---

## API Integration Patterns

### Authenticated Requests
```jsx
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem("access");
  
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};
```

### Error Handling Pattern
```jsx
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  // Handle success
  
} catch (error) {
  console.error('API Error:', error);
  // Handle error (show user message, etc.)
}
```

### Loading State Pattern
```jsx
const [loading, setLoading] = useState(false);

const performAction = async () => {
  setLoading(true);
  try {
    // Async operation
    await apiCall();
  } finally {
    setLoading(false);
  }
};
```

---

## Styling and UI

### CSS Framework
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: Consistent dark color scheme

### Color Scheme
```css
/* Primary background colors */
--bg-primary: #343541;     /* Main chat area */
--bg-secondary: #202123;   /* Sidebar */
--bg-tertiary: #40414f;    /* Input fields */

/* Text colors */
--text-primary: #ffffff;   /* Main text */
--text-secondary: #d1d5db; /* Secondary text */
--text-muted: #9ca3af;     /* Muted text */
```

### Component Styling Patterns
```jsx
// Consistent button styling
const buttonClasses = "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded";

// Input field styling
const inputClasses = "bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2";

// Layout containers
const containerClasses = "flex h-screen text-white bg-[#343541]";
```

---

## Performance Considerations

### React Performance
- **Functional Components**: Using hooks for state management
- **useEffect Dependencies**: Proper dependency arrays to prevent unnecessary renders
- **Key Props**: Unique keys for list items (messages, sessions)

### API Performance
- **Debouncing**: Consider for search functionality
- **Caching**: Browser caches API responses temporarily
- **Optimistic Updates**: UI updates before API confirmation

### Memory Management
- **Cleanup**: useEffect cleanup for subscriptions
- **State Size**: Reasonable limits on message history
- **Token Refresh**: Automatic token refresh (future enhancement)

---

## Security Considerations

### Token Management
- **Storage**: JWT tokens in localStorage (consider httpOnly cookies for production)
- **Expiration**: Handle token expiration gracefully
- **Cleanup**: Remove tokens on logout

### Input Validation
- **Client-side**: Basic validation for user experience
- **Server-side**: Primary validation happens on backend
- **XSS Prevention**: React's built-in XSS protection

### API Security
- **Authentication**: All API calls include authentication headers
- **HTTPS**: Use HTTPS in production
- **CORS**: Proper CORS configuration

---

## Future Enhancements

### Functionality
- **Real-time Updates**: WebSocket integration for live chat
- **File Upload**: Support for document and image uploads
- **Message Search**: Advanced search with filtering
- **Typing Indicators**: Show when AI is generating response

### Performance
- **Pagination**: Implement message pagination for large sessions
- **Lazy Loading**: Load sessions and messages on demand
- **Caching**: Implement proper caching strategy
- **Offline Support**: Service worker for offline functionality

### UI/UX
- **Themes**: Multiple theme support
- **Accessibility**: ARIA labels and keyboard navigation
- **Mobile**: Improved mobile experience
- **Animations**: Smooth transitions and loading states

### Security
- **Token Refresh**: Automatic token refresh
- **Session Timeout**: Auto-logout after inactivity
- **Rate Limiting**: Client-side rate limiting
- **Input Sanitization**: Enhanced input validation