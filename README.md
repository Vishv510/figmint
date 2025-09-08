# figmint

A real-time collaborative drawing application where multiple users can draw, edit, and erase shapes on a shared canvas. The app uses WebSockets for live communication between clients and Prisma ORM for database interactions.

## 🚀 Project Overview

This application allows users to collaborate on a drawing canvas in real-time. Users can create, edit, and delete various shapes like rectangles, circles, arrows, diamonds, freehand sketches, and text. The app syncs changes instantly across all connected clients.

### ✅ Features
- Real-time collaboration with WebSockets.
- Persistent shapes stored in the database using Prisma.
- Support for multiple shapes:
  - Rectangle
  - Circle
  - Line
  - Arrow
  - Diamond
  - Freehand drawing
  - Text annotations
- Erase functionality that completely removes shapes.
- Undo/Redo history.
- User roles and tracking using Prisma's `Collaboration` model.
- Efficient broadcast system ensuring updates are sent only to relevant clients.

---

## 📂 Project Structure

```bash
/excalidraw-clone
├── backend
│   ├── prisma
│   ├── ws.js
│   ├── .env
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── utils
│   │   └── App.jsx
├── README.md

⚙️ Technologies Used

Frontend:

React

Canvas API

WebSocket for live data transfer

Backend:

Node.js

WebSocket server (ws package)

Prisma ORM

SQLite / PostgreSQL / MySQL (configurable in .env)

📦 Installation Guide
Prerequisites

Node.js (v14 or later)

npm or yarn

Database setup (SQLite recommended for development)

1. Clone the repository
git clone https://github.com/your-username/excalidraw-clone.git
cd excalidraw-clone

2. Setup backend
cd backend
npm install


Create a .env file with the following content:

PORT=8080
DATABASE_URL="file:./dev.db" # or your chosen database connection


Run Prisma migrations:

npx prisma generate
npx prisma migrate dev --name init


Start the WebSocket server:

node ws.js

3. Setup frontend
cd ../frontend
npm install
npm start


Open http://localhost:3000
 in your browser.

// undo-redo fuction not work properly