import os
import json
import uuid
import hashlib
import secrets
import threading

from pathlib import Path
from typing import List
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
# from models import db, Exam, Question

from ml_models import ExamML
from agent.main import evaluate, evaluate_attempt

load_dotenv()
# MYSQL_ROOT_PASSWORD = os.getenv("MYSQL_ROOT_PASSWORD")
EVALUATION_FILE_PATH = (Path(__file__).resolve().parent.parent / "data/exam_evaluation.json").resolve()


with open("exam_marking_schema.json", "r") as file:
    json_data = json.load(file)
    EXAM_MARKING_SCHEME = json_data.get("exam_marking_schema", [])


def create_evaluation_file(exam_ml: ExamML,
                           questions_data,
                           exam_marking_scheme:List[List[List]]):
    if not (exam_ml.number_of_questions == len(questions_data) == len(exam_marking_scheme)):
        raise ValueError(
            f"Number of questions ({len(questions_data)}) does not match marking scheme ({len(exam_marking_scheme)})."
        )
    exam_obj = {
        "subject": exam_ml.course_name,
        "number-of-questions": exam_ml.number_of_questions,
        "questions-schema": []
    }

    for i in range(exam_ml.number_of_questions):
        question_data = questions_data[i]

        question = question_data.get("text")
        total_marks = question_data.get("marks")
        relevant_theory = question_data.get("related_theory")
        student_answer = question_data.get("student_answer")
        marking_scheme = exam_marking_scheme[i]

        questions_obj = {
            "question": question,
            "schema": marking_scheme,
            "total-score": total_marks,
            "relevant-theory": relevant_theory,
            "student-answer": student_answer
        }

        exam_obj["questions-schema"].append(questions_obj)

    # Ensure the parent directory exists before writing the file
    os.makedirs(os.path.dirname(EVALUATION_FILE_PATH), exist_ok=True)
    with open(EVALUATION_FILE_PATH, "w") as file:
        json.dump(exam_obj, file)


def run_evaluation_script():
    evaluate()


app = Flask(__name__)
# Update CORS config to allow credentials and specify frontend origins
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
# NOTE: Always use the same hostname (localhost or 127.0.0.1) in both frontend and backend URLs for cookies to work.
# app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://root:{MYSQL_ROOT_PASSWORD}@localhost/btp'
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# db.init_app(app)

# with app.app_context():
#     db.create_all()

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
EXAMS_FILE = os.path.join(DATA_DIR, 'exams.json')
ATTEMPTS_FILE = os.path.join(DATA_DIR, 'attempts.json')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
SESSIONS = {}  # token: user_id
QUESTION_BANK_FILE = os.path.join(DATA_DIR, 'question_bank.json')

# Helper functions for reading/writing exams

def read_exams():
    if not os.path.exists(EXAMS_FILE):
        return []
    with open(EXAMS_FILE, 'r') as f:
        return json.load(f)

def write_exams(exams):
    with open(EXAMS_FILE, 'w') as f:
        json.dump(exams, f, indent=2)

@app.route('/exams', methods=['GET'])
def get_exams():
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user or user['role'] != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 401
    exams = read_exams()
    # Only return exams created by this teacher
    teacher_exams = [e for e in exams if e.get('teacher') == user['username']]
    return jsonify(teacher_exams), 200

@app.route('/exams/<exam_id>', methods=['GET'])
def get_exam(exam_id):
    exams = read_exams()
    exam = next((e for e in exams if e['id'] == exam_id), None)
    if not exam:
        return jsonify({'error': 'Exam not found'}), 404
    return jsonify(exam), 200

@app.route('/exams', methods=['POST'])
def create_exam():
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user or user['role'] != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    exam = {
        'id': str(uuid.uuid4()),
        'title': data.get('title'),
        'duration': data.get('duration'),
        'description': data.get('description'),
        'instructions': data.get('instructions', ''),
        'questions': data.get('questions', []),
        'teacher': user['username'],
    }
    exams = read_exams()
    exams.append(exam)
    write_exams(exams)
    return jsonify({'message': 'Exam created', 'id': exam['id']}), 201

@app.route('/exams/<exam_id>', methods=['PUT'])
def update_exam(exam_id):
    data = request.get_json()
    exams = read_exams()
    idx = next((i for i, e in enumerate(exams) if e['id'] == exam_id), None)
    if idx is None:
        return jsonify({'error': 'Exam not found'}), 404
    exams[idx].update({
        'title': data.get('title', exams[idx]['title']),
        'description': data.get('description', exams[idx]['description']),
        'duration': data.get('duration', exams[idx]['duration']),
        'instructions': data.get('instructions', exams[idx].get('instructions', '')),
        'questions': data.get('questions', exams[idx]['questions']),
    })
    write_exams(exams)
    return jsonify({'message': 'Exam updated'}), 200

@app.route('/exams/<exam_id>', methods=['DELETE'])
def delete_exam(exam_id):
    exams = read_exams()
    new_exams = [e for e in exams if e['id'] != exam_id]
    if len(new_exams) == len(exams):
        return jsonify({'error': 'Exam not found'}), 404
    write_exams(new_exams)
    return jsonify({'message': 'Exam deleted'}), 200

# Helper functions for reading/writing attempts

def read_attempts():
    if not os.path.exists(ATTEMPTS_FILE):
        return []
    with open(ATTEMPTS_FILE, 'r') as f:
        return json.load(f)

def write_attempts(attempts):
    with open(ATTEMPTS_FILE, 'w') as f:
        json.dump(attempts, f, indent=2)

@app.route('/student/exams', methods=['GET'])
def student_get_exams():
    exams = read_exams()
    return jsonify(exams), 200

@app.route('/student/attempts', methods=['POST'])
def start_attempt():
    data = request.get_json()
    exam_id = data.get('exam_id')
    student_id = data.get('student_id', 'anonymous')
    exams = read_exams()
    exam = next((e for e in exams if e['id'] == exam_id), None)
    if not exam:
        return jsonify({'error': 'Exam not found'}), 404
    import time
    attempt = {
        'attempt_id': str(uuid.uuid4()),
        'exam_id': exam_id,
        'student_id': student_id,
        'start_time': int(time.time()),
        'answers': {},
        'submitted': False,
        'end_time': None
    }
    attempts = read_attempts()
    attempts.append(attempt)
    write_attempts(attempts)
    return jsonify({'attempt_id': attempt['attempt_id'], 'exam': exam, 'start_time': attempt['start_time']}), 201

@app.route('/student/attempts/<attempt_id>', methods=['GET'])
def get_attempt(attempt_id):
    attempts = read_attempts()
    attempt = next((a for a in attempts if a['attempt_id'] == attempt_id), None)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    return jsonify(attempt), 200

@app.route('/student/attempts/<attempt_id>/remaining_time', methods=['GET'])
def get_remaining_time(attempt_id):
    import time
    attempts = read_attempts()
    attempt = next((a for a in attempts if a['attempt_id'] == attempt_id), None)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    if attempt.get('submitted'):
        return jsonify({'remaining_time': 0, 'expired': True}), 200
    exams = read_exams()
    exam = next((e for e in exams if e['id'] == attempt['exam_id']), None)
    if not exam:
        return jsonify({'error': 'Exam not found'}), 404
    duration = int(exam.get('duration', 0))
    start_time = int(attempt.get('start_time', 0))
    now = int(time.time())
    end_time = start_time + duration * 60
    remaining = max(0, end_time - now)
    expired = now >= end_time
    return jsonify({'remaining_time': remaining, 'expired': expired}), 200

@app.route('/student/submit', methods=['POST'])
def submit_attempt():
    data = request.get_json()
    attempt_id = data.get('attempt_id')
    answers = data.get('answers', {})
    attempts = read_attempts()
    attempt = next((a for a in attempts if a['attempt_id'] == attempt_id), None)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    if attempt['submitted']:
        return jsonify({'error': 'Already submitted'}), 400
    import time
    exams = read_exams()
    exam = next((e for e in exams if e['id'] == attempt['exam_id']), None)
    if not exam:
        return jsonify({'error': 'Exam not found for evaluation'}), 404
    duration = int(exam.get('duration', 0))
    start_time = int(attempt.get('start_time', 0))
    now = int(time.time())
    end_time = start_time + duration * 60
    if now > end_time:
        attempt['submitted'] = True
        attempt['end_time'] = end_time
        write_attempts(attempts)
        return jsonify({'error': 'Time is up. Exam auto-submitted.'}), 400
    attempt['answers'] = answers
    attempt['submitted'] = True
    attempt['end_time'] = now
    questions = exam.get('questions', [])
    # Initialize evaluation_status
    attempt['evaluation_status'] = {
        'overall': 'in_progress',
        'questions': [
            {'status': 'pending', 'step': ''} for _ in questions
        ]
    }
    write_attempts(attempts)
    def status_updater(idx, status, step):
        attempt['evaluation_status']['questions'][idx]['status'] = status
        attempt['evaluation_status']['questions'][idx]['step'] = step
        write_attempts(attempts)
    def background_evaluate():
        try:
            result = evaluate_attempt(exam, answers, status_callback=status_updater)
            attempt['evaluation_result'] = result
            attempt['evaluation_status']['overall'] = 'done'
        except Exception as e:
            attempt['evaluation_status']['overall'] = 'error'
        write_attempts(attempts)
    threading.Thread(target=background_evaluate).start()
    return jsonify({'message': 'Attempt submitted', 'attempt_id': attempt_id}), 200

@app.route('/student/attempts/<attempt_id>/status', methods=['GET'])
def get_attempt_status(attempt_id):
    attempts = read_attempts()
    attempt = next((a for a in attempts if a['attempt_id'] == attempt_id), None)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    status = attempt.get('evaluation_status')
    if not status:
        return jsonify({'error': 'Status not available'}), 404
    return jsonify(status), 200

@app.route('/student/attempts/<attempt_id>/result', methods=['GET'])
def get_attempt_result(attempt_id):
    attempts = read_attempts()
    attempt = next((a for a in attempts if a['attempt_id'] == attempt_id), None)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    result = attempt.get('evaluation_result')
    if not result:
        return jsonify({'error': 'Result not available'}), 404
    return jsonify(result), 200

@app.route('/student/attempts', methods=['GET'])
def get_student_attempts():
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Missing username'}), 400
    attempts = read_attempts()
    user_attempts = [a for a in attempts if a.get('student_id') == username]
    return jsonify(user_attempts), 200

def read_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def write_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    return hash_password(password) == password_hash

def generate_token():
    return secrets.token_hex(32)

def get_user_by_token(token):
    print(f"DEBUG: Looking up token: {token}")
    user_id = SESSIONS.get(token)
    print(f"DEBUG: Found user_id: {user_id}")
    if not user_id:
        return None
    users = read_users()
    user = next((u for u in users if u['id'] == user_id), None)
    print(f"DEBUG: Found user: {user}")
    return user

@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')  # 'teacher', 'student', or 'admin'
    name = data.get('name', '')
    branch = data.get('branch', '')
    rollNo = data.get('rollNo', '')
    department = data.get('department', '')
    degree = data.get('degree', '')
    semester = data.get('semester', '')
    designation = data.get('designation', '')
    if not username or not password or role not in ['teacher', 'student', 'admin']:
        return jsonify({'error': 'Invalid input'}), 400
    users = read_users()
    if any(u['username'] == username for u in users):
        return jsonify({'error': 'Username already exists'}), 400
    user = {
        'id': str(uuid.uuid4()),
        'username': username,
        'password_hash': hash_password(password),
        'role': role,
        'name': name,
        'branch': branch,
        'rollNo': rollNo,
        'department': department,
        'degree': degree,
        'semester': semester,
    }
    if role == 'teacher':
        user['designation'] = designation
    users.append(user)
    write_users(users)
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    users = read_users()
    user = next((u for u in users if u['username'] == username), None)
    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid credentials'}), 401
    token = generate_token()
    SESSIONS[token] = user['id']
    resp = make_response(jsonify({
        'token': token,
        'role': user['role'],
        'username': user['username'],
        'name': user.get('name', ''),
        'branch': user.get('branch', ''),
        'rollNo': user.get('rollNo', ''),
        'department': user.get('department', ''),
        'degree': user.get('degree', ''),
        'semester': user.get('semester', ''),
        'designation': user.get('designation', ''),
    }))
    resp.set_cookie('token', token, httponly=True)
    return resp, 200

@app.route('/auth/me', methods=['GET'])
def get_me():
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({
        'username': user['username'],
        'role': user['role'],
        'name': user.get('name', ''),
        'branch': user.get('branch', ''),
        'rollNo': user.get('rollNo', ''),
        'department': user.get('department', ''),
        'degree': user.get('degree', ''),
        'semester': user.get('semester', ''),
        'designation': user.get('designation', ''),
    }), 200

def read_question_bank():
    if not os.path.exists(QUESTION_BANK_FILE):
        return []
    with open(QUESTION_BANK_FILE, 'r') as f:
        return json.load(f)

def write_question_bank(questions):
    with open(QUESTION_BANK_FILE, 'w') as f:
        json.dump(questions, f, indent=2)

@app.route('/question-bank', methods=['GET'])
def get_question_bank():
    return jsonify(read_question_bank()), 200

@app.route('/question-bank', methods=['POST'])
def add_question_to_bank():
    data = request.get_json()
    questions = read_question_bank()
    q = data.copy()
    q['id'] = str(uuid.uuid4())
    questions.append(q)
    write_question_bank(questions)
    return jsonify({'message': 'Question added to bank', 'id': q['id']}), 201

@app.route('/question-bank/<question_id>', methods=['DELETE'])
def delete_question_from_bank(question_id):
    questions = read_question_bank()
    new_questions = [q for q in questions if q.get('id') != question_id]
    if len(new_questions) == len(questions):
        return jsonify({'error': 'Question not found'}), 404
    write_question_bank(new_questions)
    return jsonify({'message': 'Question deleted from bank'}), 200

@app.route('/teacher/exams/<exam_id>/analytics', methods=['GET'])
def get_exam_analytics(exam_id):
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user or user['role'] != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 401
    exams = read_exams()
    exam = next((e for e in exams if e['id'] == exam_id), None)
    if not exam:
        return jsonify({'error': 'Exam not found'}), 404
    if exam.get('teacher') != user['username']:
        return jsonify({'error': 'Forbidden'}), 403
    attempts = read_attempts()
    exam_attempts = [a for a in attempts if a.get('exam_id') == exam_id and a.get('submitted') and a.get('evaluation_result')]
    num_questions = len(exam.get('questions', []))
    analytics = []
    for q_idx in range(num_questions):
        question_text = exam['questions'][q_idx].get('text', f'Q{q_idx+1}')
        total_marks = float(exam['questions'][q_idx].get('marks', 1))
        scores = []
        full_marks_count = 0
        for att in exam_attempts:
            result = att['evaluation_result']['results'][q_idx]
            score = float(result.get('total_score_gained', 0))
            scores.append(score)
            if score >= total_marks:
                full_marks_count += 1
        total_attempts = len(scores)
        avg_score = sum(scores) / total_attempts if total_attempts > 0 else 0
        percent_full_marks = (full_marks_count / total_attempts * 100) if total_attempts > 0 else 0
        analytics.append({
            'question': question_text,
            'total_attempts': total_attempts,
            'average_score': avg_score,
            'percent_full_marks': percent_full_marks,
            'total_marks': total_marks
        })
    return jsonify({'exam_id': exam_id, 'title': exam.get('title'), 'analytics': analytics}), 200

# Optionally, add a function to auto-submit expired attempts (can be called periodically or on access)
def auto_submit_expired_attempts():
    import time
    attempts = read_attempts()
    exams = read_exams()
    now = int(time.time())
    changed = False
    for attempt in attempts:
        if not attempt.get('submitted'):
            exam = next((e for e in exams if e['id'] == attempt['exam_id']), None)
            if not exam:
                continue
            duration = int(exam.get('duration', 0))
            start_time = int(attempt.get('start_time', 0))
            end_time = start_time + duration * 60
            if now > end_time:
                attempt['submitted'] = True
                attempt['end_time'] = end_time
                changed = True
    if changed:
        write_attempts(attempts)

@app.route('/admin/users', methods=['GET'])
def admin_list_users():
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    users = read_users()
    return jsonify(users), 200

@app.route('/admin/users/<user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    users = read_users()
    users = [u for u in users if u['id'] != user_id]
    write_users(users)
    return jsonify({'message': 'User deleted'}), 200

@app.route('/admin/users/<user_id>/role', methods=['PUT'])
def admin_change_user_role(user_id):
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    new_role = data.get('role')
    if new_role not in ['student', 'teacher', 'admin']:
        return jsonify({'error': 'Invalid role'}), 400
    users = read_users()
    for u in users:
        if u['id'] == user_id:
            u['role'] = new_role
    write_users(users)
    return jsonify({'message': 'Role updated'}), 200

@app.route('/admin/exams', methods=['GET'])
def admin_list_exams():
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    exams = read_exams()
    return jsonify(exams), 200

@app.route('/admin/attempts', methods=['GET'])
def admin_list_attempts():
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    attempts = read_attempts()
    return jsonify(attempts), 200

@app.route('/auth/update_profile', methods=['PUT'])
def update_profile():
    token = request.cookies.get('token') or request.headers.get('Authorization')
    user = get_user_by_token(token)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    users = read_users()
    for u in users:
        if u['id'] == user['id']:
            u['name'] = data.get('name', u.get('name', ''))
            u['branch'] = data.get('branch', u.get('branch', ''))
            u['rollNo'] = data.get('rollNo', u.get('rollNo', ''))
            u['department'] = data.get('department', u.get('department', ''))
            u['degree'] = data.get('degree', u.get('degree', ''))
            u['semester'] = data.get('semester', u.get('semester', ''))
            if u['role'] == 'teacher':
                u['designation'] = data.get('designation', u.get('designation', ''))
    write_users(users)
    return jsonify({'message': 'Profile updated successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
