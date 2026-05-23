# 🚀 DevPulse – Internal Tech Issue & Feature Tracker

DevPulse is a backend REST API built using Node.js, Express, TypeScript, and PostgreSQL.  
It allows teams to report bugs, request features, and manage issue workflows with role-based access control.

---

## 🌐 Live URL
https://devpulse-assignment2.vercel.app/


---

## ⚙️ Tech Stack

- Node.js (LTS)
- Express.js
- TypeScript
- PostgreSQL (NeonDB)
- pg (native PostgreSQL driver)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- dotenv (environment config)

---

## ✨ Features

### 👤 Authentication
- User registration (signup)
- User login
- JWT-based authentication
- Password hashing using bcrypt

### 🧾 Issues System
- Create bug or feature request
- View all issues
- View single issue
- Update issue (role-based access)
- Delete issue (maintainer only)

### 🔐 Role System
- Contributor
- Maintainer

### 🔒 Security
- JWT protected routes
- Password encryption
- Role-based authorization

---