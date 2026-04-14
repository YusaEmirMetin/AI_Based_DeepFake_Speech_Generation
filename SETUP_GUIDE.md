# DFSG - Complete Setup Guide

## 🎯 Project Architecture

```
DFSG (DeepFake Speech Generator)
├── Frontend (React + Vite) → Port 5173
├── Backend (Spring Boot) → Port 8080
├── AI Engine (FastAPI) → Port 8000
└── Streamlit App → Port 8501
```

---

## ✅ Prerequisites Check

### 1. Java 21
```bash
java -version
```

### 2. Node.js & npm
```bash
node -v
npm -v
```

### 3. Python 3.10+
```bash
python3 --version
```

### 4. PostgreSQL
```bash
which psql
```

---

## 📦 Installation & Startup

### Step 1: Database Setup
```bash
# Create PostgreSQL database
createdb dfsg_db

# If needed, reset the database:
# dropdb dfsg_db
# createdb dfsg_db
```

### Step 2: Backend Setup (Spring Boot)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
✅ Backend will run on: http://localhost:8080

### Step 3: AI Engine Setup (FastAPI)
```bash
cd ai-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
✅ AI Engine will run on: http://localhost:8000

### Step 4: Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend will run on: http://localhost:5173

### Step 5: Streamlit App (Optional)
```bash
cd ..
python3 -m venv streamlit-env
source streamlit-env/bin/activate
pip install -r requirements.txt
streamlit run DFSG.py
```
✅ Streamlit will run on: http://localhost:8501

---

## 🔧 Configuration

### Backend Properties
`backend/src/main/resources/application.properties`:
```properties
Database: localhost:5432/dfsg_db
Username: postgres
Password: postgres
JWT Secret: configured
Frontend CORS: http://localhost:5173
```

### Frontend - API Base URL
Verify that the frontend is configured to call backend on `http://localhost:8080`

### AI Engine - CORS
Already enabled for local development

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React Dashboard |
| Backend API | http://localhost:8080 | Spring Boot REST API |
| AI Engine | http://localhost:8000 | FastAPI TTS Microservice |
| AI Engine Docs | http://localhost:8000/docs | Swagger API Docs |
| Streamlit | http://localhost:8501 | Streamlit TTS Interface |

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
psql -U postgres -d dfsg_db -c "SELECT 1"
```

### Port Already in Use
```bash
# Find and kill process on port
lsof -i :8080  # Backend
lsof -i :8000  # AI Engine
lsof -i :5173  # Frontend
```

### Model Download Issue (AI Engine)
First run will download XTTSv2 model (~2GB). Be patient and ensure you have:
- Stable internet connection
- ~3GB free disk space
- GPU recommended (but CPU works, slower)

---

## 📝 Development Notes

- **Frontend**: Uses React Router for navigation (LoginPage, RegisterPage, Dashboard)
- **Backend**: Spring Security with JWT Authentication
- **AI Engine**: FastAPI with CORS enabled for all origins
- **Database**: PostgreSQL with Hibernate ORM

---

## 🆘 Quick Commands Reference

```bash
# Terminal 1: Backend
cd backend && mvn spring-boot:run

# Terminal 2: AI Engine
cd ai-engine
source venv/bin/activate
python main.py

# Terminal 3: Frontend
cd frontend
npm run dev

# Terminal 4: Streamlit (optional)
source streamlit-env/bin/activate
streamlit run DFSG.py
```

---

Enjoy! 🎉
