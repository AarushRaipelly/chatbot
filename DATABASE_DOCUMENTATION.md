# Database Schema Documentation

## Overview

The chatbot application uses SQLite as the development database with Django ORM for data management. The schema is designed to support multi-user chat sessions with message persistence and user authentication.

---

## Database Configuration

### Development Setup
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Production Recommendations
```python
# Production configuration (PostgreSQL recommended)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'chatbot_db',
        'USER': 'chatbot_user',
        'PASSWORD': 'secure_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

---

## Schema Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   auth_user     │         │  chat_session   │         │ chat_message    │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────┤ user_id (FK)    │◄────────┤ session_id (FK) │
│ username        │         │ id (PK)         │         │ id (PK)         │
│ email           │         │ title           │         │ role            │
│ first_name      │         │ created_at      │         │ content         │
│ password        │         └─────────────────┘         │ timestamp       │
│ date_joined     │                                     └─────────────────┘
│ last_login      │
└─────────────────┘
```

---

## Table Specifications

### 1. auth_user (Django Built-in)

**Purpose**: Stores user authentication and profile information

| Column        | Type         | Constraints                    | Description                |
|---------------|--------------|--------------------------------|----------------------------|
| id            | INTEGER      | PRIMARY KEY, AUTO_INCREMENT    | Unique user identifier     |
| username      | VARCHAR(150) | UNIQUE, NOT NULL               | User login name           |
| email         | VARCHAR(254) | UNIQUE, NOT NULL               | User email address        |
| first_name    | VARCHAR(150) | NOT NULL                       | User's first name         |
| last_name     | VARCHAR(150) | DEFAULT ''                     | User's last name          |
| password      | VARCHAR(128) | NOT NULL                       | Hashed password           |
| is_active     | BOOLEAN      | DEFAULT TRUE                   | Account active status     |
| is_staff      | BOOLEAN      | DEFAULT FALSE                  | Admin access flag         |
| is_superuser  | BOOLEAN      | DEFAULT FALSE                  | Superuser access flag     |
| date_joined   | DATETIME     | NOT NULL                       | Account creation time     |
| last_login    | DATETIME     | NULL                           | Last login timestamp      |

**Indexes:**
- Primary key on `id`
- Unique index on `username`
- Unique index on `email`

**Sample Data:**
```sql
INSERT INTO auth_user (username, email, first_name, password, is_active, date_joined) 
VALUES ('johndoe', 'john@example.com', 'John', 'pbkdf2_sha256$...', TRUE, '2025-06-30 10:00:00');
```

---

### 2. chat_session

**Purpose**: Stores individual chat sessions belonging to users

| Column     | Type         | Constraints                           | Description                    |
|------------|--------------|---------------------------------------|--------------------------------|
| id         | INTEGER      | PRIMARY KEY, AUTO_INCREMENT           | Unique session identifier      |
| user_id    | INTEGER      | FOREIGN KEY REFERENCES auth_user(id)  | Session owner                  |
| title      | VARCHAR(100) | NOT NULL, DEFAULT 'New Chat'          | Session display name           |
| created_at | DATETIME     | NOT NULL, AUTO_NOW_ADD                | Session creation timestamp     |

**Relationships:**
- **Many-to-One** with `auth_user`: Each session belongs to one user
- **One-to-Many** with `chat_message`: Each session can have multiple messages

**Constraints:**
- Foreign key constraint with CASCADE delete (deleting user deletes sessions)
- Default ordering by `created_at DESC`

**Indexes:**
- Primary key on `id`
- Foreign key index on `user_id`
- Index on `created_at` for ordering

**Sample Data:**
```sql
INSERT INTO chat_session (user_id, title, created_at) 
VALUES (1, 'Python Programming Help', '2025-06-30 10:30:00');

INSERT INTO chat_session (user_id, title, created_at) 
VALUES (1, 'New Chat', '2025-06-30 11:00:00');
```

---

### 3. chat_message

**Purpose**: Stores individual messages within chat sessions

| Column     | Type         | Constraints                              | Description                    |
|------------|--------------|------------------------------------------|--------------------------------|
| id         | INTEGER      | PRIMARY KEY, AUTO_INCREMENT              | Unique message identifier      |
| session_id | INTEGER      | FOREIGN KEY REFERENCES chat_session(id) | Parent session                 |
| role       | VARCHAR(20)  | NOT NULL                                 | 'user' or 'assistant'          |
| content    | TEXT         | NOT NULL                                 | Message text content           |
| timestamp  | DATETIME     | NOT NULL, AUTO_NOW_ADD                   | Message creation time          |

**Relationships:**
- **Many-to-One** with `chat_session`: Each message belongs to one session

**Constraints:**
- Foreign key constraint with CASCADE delete (deleting session deletes messages)
- Default ordering by `timestamp ASC`
- Role validation (should be 'user' or 'assistant')

**Indexes:**
- Primary key on `id`
- Foreign key index on `session_id`
- Index on `timestamp` for chronological ordering
- Composite index on `(session_id, timestamp)` for efficient session message queries

**Sample Data:**
```sql
INSERT INTO chat_message (session_id, role, content, timestamp) 
VALUES (1, 'user', 'How do I create a list in Python?', '2025-06-30 10:31:00');

INSERT INTO chat_message (session_id, role, content, timestamp) 
VALUES (1, 'assistant', 'You can create a list in Python using square brackets: my_list = [1, 2, 3]', '2025-06-30 10:31:05');
```

---

## Relationships and Constraints

### Referential Integrity

#### User → Session Relationship
```sql
-- Foreign key constraint
ALTER TABLE chat_session 
ADD CONSTRAINT fk_session_user 
FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE;
```

#### Session → Message Relationship
```sql
-- Foreign key constraint
ALTER TABLE chat_message 
ADD CONSTRAINT fk_message_session 
FOREIGN KEY (session_id) REFERENCES chat_session(id) ON DELETE CASCADE;
```

### Data Integrity Rules

1. **User Isolation**: Users can only access their own sessions and messages
2. **Cascade Deletion**: Deleting a user removes all sessions and messages
3. **Message Ordering**: Messages maintain chronological order within sessions
4. **Role Validation**: Message roles must be 'user' or 'assistant'

---

## Query Patterns

### Common Queries

#### 1. Get User's Sessions with Message Count
```sql
SELECT 
    s.id,
    s.title,
    s.created_at,
    COUNT(m.id) as message_count
FROM chat_session s
LEFT JOIN chat_message m ON s.id = m.session_id
WHERE s.user_id = ?
GROUP BY s.id, s.title, s.created_at
ORDER BY s.created_at DESC;
```

#### 2. Get Session Messages in Chronological Order
```sql
SELECT 
    id,
    role,
    content,
    timestamp
FROM chat_message
WHERE session_id = ?
ORDER BY timestamp ASC;
```

#### 3. Get Recent Activity for User
```sql
SELECT 
    s.title,
    m.content,
    m.timestamp,
    m.role
FROM chat_session s
JOIN chat_message m ON s.id = m.session_id
WHERE s.user_id = ?
ORDER BY m.timestamp DESC
LIMIT 10;
```

#### 4. Search Messages Across User's Sessions
```sql
SELECT 
    s.title as session_title,
    m.content,
    m.role,
    m.timestamp
FROM chat_message m
JOIN chat_session s ON m.session_id = s.id
WHERE s.user_id = ? 
AND m.content LIKE ?
ORDER BY m.timestamp DESC;
```

### Performance Optimization Queries

#### 1. Session Summary with Latest Message
```sql
SELECT 
    s.id,
    s.title,
    s.created_at,
    latest.content as last_message,
    latest.timestamp as last_activity
FROM chat_session s
LEFT JOIN (
    SELECT DISTINCT 
        session_id,
        FIRST_VALUE(content) OVER (PARTITION BY session_id ORDER BY timestamp DESC) as content,
        FIRST_VALUE(timestamp) OVER (PARTITION BY session_id ORDER BY timestamp DESC) as timestamp
    FROM chat_message
) latest ON s.id = latest.session_id
WHERE s.user_id = ?
ORDER BY COALESCE(latest.timestamp, s.created_at) DESC;
```

---

## Database Migrations

### Initial Migration (0001_initial.py)

```python
# Generated migration file
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    
    operations = [
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(default='New Chat', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(max_length=20)),
                ('content', models.TextField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='chat.session')),
            ],
            options={
                'ordering': ['timestamp'],
            },
        ),
    ]
```

### Running Migrations

```bash
# Create migration files
python manage.py makemigrations chat

# Apply migrations
python manage.py migrate

# View migration status
python manage.py showmigrations

# Reverse migration (if needed)
python manage.py migrate chat 0001
```

---

## Data Management

### Backup and Restore

#### SQLite Backup
```bash
# Create backup
sqlite3 db.sqlite3 ".backup backup_$(date +%Y%m%d_%H%M%S).db"

# Restore from backup
cp backup_20250630_120000.db db.sqlite3
```

#### Django Data Dump/Load
```bash
# Export data
python manage.py dumpdata chat.Session chat.Message > chat_data.json

# Import data
python manage.py loaddata chat_data.json

# Export specific user data
python manage.py dumpdata chat.Session chat.Message --indent 2 > user_sessions.json
```

### Data Cleanup

#### Remove Old Sessions
```sql
-- Delete sessions older than 90 days with no messages
DELETE FROM chat_session 
WHERE created_at < datetime('now', '-90 days')
AND id NOT IN (SELECT DISTINCT session_id FROM chat_message);
```

#### Archive Old Messages
```sql
-- Move old messages to archive table (if implemented)
INSERT INTO chat_message_archive 
SELECT * FROM chat_message 
WHERE timestamp < datetime('now', '-365 days');

DELETE FROM chat_message 
WHERE timestamp < datetime('now', '-365 days');
```

---

## Performance Considerations

### Indexing Strategy

#### Current Indexes
```sql
-- Automatically created by Django
CREATE INDEX chat_session_user_id_idx ON chat_session(user_id);
CREATE INDEX chat_message_session_id_idx ON chat_message(session_id);
```

#### Recommended Additional Indexes
```sql
-- For timestamp-based queries
CREATE INDEX chat_message_timestamp_idx ON chat_message(timestamp);

-- For content search
CREATE INDEX chat_message_content_idx ON chat_message(content) WHERE length(content) > 0;

-- Composite index for efficient session message queries
CREATE INDEX chat_message_session_timestamp_idx ON chat_message(session_id, timestamp);

-- For user activity queries
CREATE INDEX chat_session_user_created_idx ON chat_session(user_id, created_at);
```

### Query Optimization

#### 1. Pagination for Large Result Sets
```python
# Django pagination example
from django.core.paginator import Paginator

messages = Message.objects.filter(session_id=session_id).order_by('timestamp')
paginator = Paginator(messages, 50)  # 50 messages per page
page_messages = paginator.get_page(page_number)
```

#### 2. Select Related for Foreign Keys
```python
# Efficient session loading with user data
sessions = Session.objects.select_related('user').filter(user=request.user)

# Efficient message loading with session data
messages = Message.objects.select_related('session').filter(session_id=session_id)
```

#### 3. Prefetch Related for Reverse Foreign Keys
```python
# Load sessions with their messages in one query
sessions = Session.objects.prefetch_related('messages').filter(user=request.user)
```

---

## Security Considerations

### Data Access Control

#### Row-Level Security
```python
# Ensure users can only access their own data
user_sessions = Session.objects.filter(user=request.user)
session_messages = Message.objects.filter(session__user=request.user)
```

#### Input Validation
```python
# Validate message role
if role not in ['user', 'assistant']:
    raise ValidationError('Invalid message role')

# Validate content length
if len(content) > 10000:  # Example limit
    raise ValidationError('Message too long')
```

### Data Encryption

#### Sensitive Data Protection
```python
# Consider encrypting sensitive message content
from cryptography.fernet import Fernet

def encrypt_content(content):
    key = settings.ENCRYPTION_KEY
    f = Fernet(key)
    return f.encrypt(content.encode()).decode()

def decrypt_content(encrypted_content):
    key = settings.ENCRYPTION_KEY
    f = Fernet(key)
    return f.decrypt(encrypted_content.encode()).decode()
```

---

## Monitoring and Maintenance

### Database Health Checks

#### Table Size Monitoring
```sql
-- Check table sizes (SQLite)
SELECT 
    name,
    COUNT(*) as row_count
FROM sqlite_master 
WHERE type='table' 
AND name LIKE 'chat_%';

-- Get actual table sizes
.tables
.schema chat_session
.schema chat_message
```

#### Data Growth Analysis
```sql
-- Messages per day
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as message_count
FROM chat_message
WHERE timestamp >= datetime('now', '-30 days')
GROUP BY DATE(timestamp)
ORDER BY date;

-- Active users per day
SELECT 
    DATE(m.timestamp) as date,
    COUNT(DISTINCT s.user_id) as active_users
FROM chat_message m
JOIN chat_session s ON m.session_id = s.id
WHERE m.timestamp >= datetime('now', '-30 days')
GROUP BY DATE(m.timestamp)
ORDER BY date;
```

### Maintenance Tasks

#### Regular Cleanup
```python
# Django management command for cleanup
from django.core.management.base import BaseCommand
from datetime import datetime, timedelta
from chat.models import Session, Message

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Delete empty sessions older than 30 days
        empty_sessions = Session.objects.filter(
            created_at__lt=datetime.now() - timedelta(days=30),
            messages__isnull=True
        )
        deleted_count = empty_sessions.count()
        empty_sessions.delete()
        
        self.stdout.write(f'Deleted {deleted_count} empty sessions')
```

#### Database Optimization
```bash
# SQLite optimization
sqlite3 db.sqlite3 "VACUUM;"
sqlite3 db.sqlite3 "REINDEX;"
sqlite3 db.sqlite3 "ANALYZE;"
```

---

## Future Enhancements

### Schema Extensions

#### 1. Message Attachments
```sql
CREATE TABLE chat_attachment (
    id INTEGER PRIMARY KEY,
    message_id INTEGER REFERENCES chat_message(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size INTEGER,
    file_path VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Session Sharing
```sql
CREATE TABLE chat_session_share (
    id INTEGER PRIMARY KEY,
    session_id INTEGER REFERENCES chat_session(id) ON DELETE CASCADE,
    shared_with_user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    permission_level VARCHAR(20), -- 'read', 'write'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Message Reactions
```sql
CREATE TABLE chat_message_reaction (
    id INTEGER PRIMARY KEY,
    message_id INTEGER REFERENCES chat_message(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20), -- 'like', 'dislike', 'helpful'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, reaction_type)
);
```

### Performance Improvements

1. **Database Sharding**: Split data across multiple databases by user
2. **Read Replicas**: Separate read and write operations
3. **Caching Layer**: Redis for frequently accessed sessions
4. **Full-Text Search**: Implement proper search indexing
5. **Archive Strategy**: Move old data to separate archive tables