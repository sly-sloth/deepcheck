# DeepCheck

An AI powered platform for conducting, evaluating, and analyzing exams using LLM-based automated grading.  
Includes a React frontend and a Flask backend with analytics, user management, and exam attempt tracking.

---

## Project Structure


exam-check-tool-revamp/
  backend/    # Flask backend (API, grading, data)
  frontend/   # React frontend (UI)
  data/       # Exam and user data (JSON)


---

## Getting Started

### 1. Clone the Repository

bash
git clone <your-repo-url>
cd exam-check-tool-revamp


---

### 2. Backend Setup

bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt


#### Add your .env file

Create a .env file in the backend/ directory with your API key(s):


# .env
GROQ_API_KEY=your_groq_api_key_here
# Add any other required environment variables here


---

### 3. Frontend Setup

bash
cd ../frontend
npm install


---

### 4. Running the Servers

#### Start the Backend (Flask API)

bash
cd backend
source .venv/bin/activate
python main.py


#### Start the Frontend (React UI)

Open a new terminal, then:

bash
cd frontend
npm start


The React app will open at [http://localhost:3000](http://localhost:3000).

---

## Notes

- The .env file is *not* included in version control. You must create it yourself in the backend folder.
- All exam/user data is stored in the data/ directory.
- For production, consider using a production-ready server for Flask and building the React app.

---

## Features

- Teacher and student dashboards
- Exam creation, attempt, and auto-evaluation
- Analytics and attempt history
- Profile management
- Secure login/signup with role-based access

---

## License

MIT