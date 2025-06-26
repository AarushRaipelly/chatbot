# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

```
my-chatbot
├─ chatbot_backend
│  ├─ .env
│  ├─ api
│  │  ├─ admin.py
│  │  ├─ apps.py
│  │  ├─ migrations
│  │  ├─ models.py
│  │  ├─ tests.py
│  │  ├─ urls.py
│  │  ├─ views.py
│  │  ├─ __init__.py
│  │  └─ __pycache__
│  ├─ chat
│  │  ├─ admin.py
│  │  ├─ apps.py
│  │  ├─ migrations
│  │  ├─ models.py
│  │  ├─ serializer.py
│  │  ├─ tests.py
│  │  ├─ urls.py
│  │  ├─ views.py
│  │  ├─ __init__.py
│  │  └─ __pycache__
│  ├─ chatbot_backend
│  │  ├─ asgi.py
│  │  ├─ settings.py
│  │  ├─ urls.py
│  │  ├─ wsgi.py
│  │  ├─ __init__.py
│  │  └─ __pycache__
│  ├─ db.sqlite3
│  └─ manage.py
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
├─ README.md
├─ src
│  ├─ App.jsx
│  ├─ ChatBox.jsx
│  ├─ ChatMessage.jsx
│  ├─ index.css
│  ├─ Login.jsx
│  ├─ main.jsx
│  └─ Register.jsx
├─ tailwind.config.js
└─ vite.config.js

```
