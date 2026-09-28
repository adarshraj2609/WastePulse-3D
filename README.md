# WastePulse — Civic Intelligence Platform

WastePulse is a civic-tech web application that transforms citizen waste reports into meaningful spatial insights.

Users can submit waste reports with a photo, waste type, severity, and location. The system stores these reports and identifies recurring waste activity through hotspot analysis.

An authorized administrator can access the private Command Center, monitor reports, and mark reports as resolved.

---

## 🚀 Features

### 🌍 Public Features

* Interactive 3D city visualization
* Overview dashboard
* Citizen waste reporting
* Waste photo upload
* GPS/location support
* Waste type selection
* Severity selection
* Interactive hotspot map
* Recurring waste zone visualization
* Live public statistics
* Responsive dark-themed interface

### 🔐 Admin Features

* Secure admin login
* Session-based authentication
* Private Command Center
* Admin-only report monitoring
* Priority and hotspot analytics
* Response queue
* Mark reports as `Resolved`
* Logout functionality
* Protected backend endpoints

---

## 🧠 How WastePulse Works

```text
Citizen
   │
   │ Submit waste report
   ▼
Photo + GPS + Waste Type + Severity
   │
   ▼
FastAPI Backend
   │
   ▼
Report Storage
   │
   ▼
Hotspot Analysis
   │
   ├── Report Frequency
   ├── Severity
   ├── Unresolved Reports
   └── Location Recurrence
   │
   ▼
Public Hotspot Map
   │
   ▼
Admin Command Center
   │
   ▼
Report Resolution
```

---

## 🛠️ Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Three.js
* Leaflet.js
* OpenStreetMap
* Google Fonts

### Backend

* Python
* FastAPI
* Uvicorn
* Starlette Session Middleware
* Python Multipart
* ItsDangerous

### Storage

* JSON-based prototype data storage
* Local image uploads

### Deployment

* GitHub
* Render

---

## 📁 Project Structure

```text
WastePulse/
│
├── main.py
├── requirements.txt
├── README.md
├── .gitignore
├── data.json
│
├── uploads/
│
└── static/
    ├── index.html
    ├── style.css
    └── script.js
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/WastePulse-3D.git
```

Move into the project directory:

```bash
cd WastePulse-3D
```

---

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

---

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Run the application

```bash
python -m uvicorn main:app --reload
```

Open the application in your browser:

```text
http://127.0.0.1:8000
```

---

## 🔐 Admin Login Configuration

Admin credentials should not be stored inside the frontend.

Set the following environment variables:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword123!
SESSION_SECRET=your-long-random-secret
ENVIRONMENT=development
```

### Windows Command Prompt

```cmd
set ADMIN_USERNAME=admin
set ADMIN_PASSWORD=YourStrongPassword123!
set SESSION_SECRET=your-long-random-secret
set ENVIRONMENT=development
```

Then start the application:

```cmd
python -m uvicorn main:app --reload
```

The login page can then be opened using the 🔐 button in the header.

---

## 🔒 Admin Access Flow

Normal users can access:

```text
Overview
Report
Hotspots
```

The Command Center remains hidden until the administrator logs in.

After successful authentication:

```text
Overview
Report
Hotspots
Command
ADMIN
Logout
```

Only the authenticated administrator can access the protected report management endpoints.

The backend verifies the admin session before allowing report status changes.

---

## 📊 Command Center

The private Command Center provides:

* Total reports
* Active zones
* Critical zones
* Resolved reports
* Hotspot intensity
* Recent reports
* Response queue
* Report resolution controls

The administrator can change a report status from:

```text
Pending
     ↓
Assigned
     ↓
Resolved
```

---

## 🗺️ Hotspot Detection Concept

WastePulse uses location-based report information to identify recurring waste activity.

The hotspot concept considers factors such as:

* Number of reports
* Severity of reports
* Unresolved reports
* Repeated activity near the same location

This helps convert individual complaints into a larger spatial picture.

---

## 🌐 Deployment on Render

WastePulse can be deployed as a **Render Web Service**.

### Build Command

```bash
pip install -r requirements.txt
```

### Start Command

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Required Environment Variables

Add these in:

```text
Render
→ WastePulse Service
→ Environment
→ Environment Variables
```

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword123!
SESSION_SECRET=your-long-random-secret
ENVIRONMENT=production
```

After changing environment variables, rebuild and redeploy the service.

---

## 📱 User Flow

### Citizen

```text
Open Website
    ↓
Overview
    ↓
Report
    ↓
Upload Waste Photo
    ↓
Select Waste Type
    ↓
Select Severity
    ↓
Add GPS Location
    ↓
Submit Report
```

### Administrator

```text
Open Website
    ↓
🔐 Admin Login
    ↓
Enter Credentials
    ↓
Command Center
    ↓
Monitor Reports
    ↓
Review Response Queue
    ↓
Mark Report as Resolved
```

---

## 🎨 UI Design

WastePulse uses a dark civic-intelligence interface with:

* Green accent colors
* Glassmorphism cards
* 3D visual elements
* Interactive maps
* Responsive layouts
* Dashboard-style analytics
* Minimal modern typography

---

## 🔮 Future Improvements

Possible future upgrades include:

* AI-based waste image classification
* Automatic hotspot clustering
* PostgreSQL/PostGIS database
* Cloud image storage
* Push notifications
* Municipal team accounts
* Role-based authentication
* Complaint assignment
* Email notifications
* Real-time analytics
* Heatmap generation
* Mobile application
* Machine-learning-based priority prediction

---

## ⚠️ Prototype Note

WastePulse currently uses JSON-based storage and local file uploads for prototype development.

For a production municipal system, persistent database and cloud storage infrastructure should be used instead of local JSON/files.

---

## 🎓 Project Purpose

WastePulse is designed as a civic-tech prototype demonstrating how location-aware citizen reporting can be transformed into actionable waste-management insights.

The project combines:

```text
Web Development
+
Backend Development
+
Geospatial Visualization
+
Data Analysis
+
Civic Technology
```

---

## 👨‍💻 Author

**Adarsh Raj**

CSE Student
WastePulse — Civic Intelligence Prototype

---

## ⭐ Project

If you find this project useful, consider giving the repository a star.

```text
WastePulse
Turning waste complaints into spatial memory.
```
