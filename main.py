import json
import math
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware


BASE = Path(__file__).parent

DATA_FILE = BASE / "data.json"

UPLOAD_DIR = BASE / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="WastePulse 3D"
)


# =========================================================
# ADMIN SETTINGS
# =========================================================

ADMIN_USERNAME = os.getenv(
    "ADMIN_USERNAME",
    "admin"
)

ADMIN_PASSWORD = os.getenv(
    "ADMIN_PASSWORD",
    "change-this-password"
)

SESSION_SECRET = os.getenv(
    "SESSION_SECRET",
    "change-this-session-secret"
)

ENVIRONMENT = os.getenv(
    "ENVIRONMENT",
    "development"
)


# =========================================================
# SESSION
# =========================================================

app.add_middleware(

    SessionMiddleware,

    secret_key=SESSION_SECRET,

    session_cookie="wastepulse_session",

    max_age=60 * 60 * 8,

    same_site="lax",

    https_only=(
        ENVIRONMENT == "production"
    )
)


# =========================================================
# ADMIN AUTH CHECK
# =========================================================

def require_admin(request: Request):

    if not request.session.get(
        "is_admin",
        False
    ):

        raise HTTPException(
            status_code=401,
            detail="Admin login required."
        )

    return True


# =========================================================
# DEMO DATA
# =========================================================

if not DATA_FILE.exists():

    demo_reports = [

        {
            "id": "WP1001",
            "lat": 22.5726,
            "lng": 88.3639,
            "waste_type": "Mixed",
            "severity": "High",
            "status": "Resolved",
            "created_at": "2026-09-18T09:20:00",
            "image": None
        },

        {
            "id": "WP1002",
            "lat": 22.5729,
            "lng": 88.3642,
            "waste_type": "Plastic",
            "severity": "High",
            "status": "Pending",
            "created_at": "2026-09-20T18:10:00",
            "image": None
        },

        {
            "id": "WP1003",
            "lat": 22.5730,
            "lng": 88.3640,
            "waste_type": "Mixed",
            "severity": "Medium",
            "status": "Pending",
            "created_at": "2026-09-22T12:30:00",
            "image": None
        },

        {
            "id": "WP1004",
            "lat": 22.5727,
            "lng": 88.3641,
            "waste_type": "Organic",
            "severity": "High",
            "status": "Assigned",
            "created_at": "2026-09-24T08:40:00",
            "image": None
        },

        {
            "id": "WP1005",
            "lat": 22.5728,
            "lng": 88.3643,
            "waste_type": "Mixed",
            "severity": "High",
            "status": "Pending",
            "created_at": "2026-09-26T19:00:00",
            "image": None
        },

        {
            "id": "WP1006",
            "lat": 22.5727,
            "lng": 88.3642,
            "waste_type": "Construction",
            "severity": "Medium",
            "status": "Resolved",
            "created_at": "2026-09-16T14:00:00",
            "image": None
        },

        {
            "id": "WP1007",
            "lat": 22.5650,
            "lng": 88.3500,
            "waste_type": "Plastic",
            "severity": "Low",
            "status": "Resolved",
            "created_at": "2026-09-21T10:00:00",
            "image": None
        },

        {
            "id": "WP1008",
            "lat": 22.5652,
            "lng": 88.3502,
            "waste_type": "Mixed",
            "severity": "Medium",
            "status": "Pending",
            "created_at": "2026-09-25T16:30:00",
            "image": None
        }

    ]

    DATA_FILE.write_text(
        json.dumps(
            demo_reports,
            indent=2
        ),
        encoding="utf-8"
    )


# =========================================================
# DATABASE HELPERS
# =========================================================

def load_reports():

    return json.loads(
        DATA_FILE.read_text(
            encoding="utf-8"
        )
    )


def save_reports(
    reports
):

    DATA_FILE.write_text(
        json.dumps(
            reports,
            indent=2
        ),
        encoding="utf-8"
    )


# =========================================================
# HOTSPOT CALCULATION
# =========================================================

def build_hotspots(
    reports
):

    groups = []


    for report in reports:

        group = None


        for candidate in groups:

            distance = math.dist(

                (
                    report["lat"],
                    report["lng"]
                ),

                (
                    candidate["lat"],
                    candidate["lng"]
                )

            )


            if distance < 0.001:

                group = candidate

                break


        if group:

            group["reports"].append(
                report
            )


            count = len(
                group["reports"]
            )


            group["lat"] = (
                sum(
                    x["lat"]
                    for x in group["reports"]
                )
                / count
            )


            group["lng"] = (
                sum(
                    x["lng"]
                    for x in group["reports"]
                )
                / count
            )


        else:

            groups.append({

                "lat":
                    report["lat"],

                "lng":
                    report["lng"],

                "reports": [
                    report
                ]

            })


    hotspots = []


    for index, group in enumerate(
        groups,
        start=1
    ):

        items = group["reports"]


        total = len(
            items
        )


        high_count = sum(

            x["severity"] == "High"

            for x in items

        )


        unresolved = sum(

            x["status"] != "Resolved"

            for x in items

        )


        score = min(

            100,

            total * 8
            + high_count * 7
            + unresolved * 5

        )


        if score >= 80:

            level = "Critical"

        elif score >= 60:

            level = "High"

        elif score >= 30:

            level = "Moderate"

        else:

            level = "Low"


        hotspots.append({

            "id":
                f"HS{index:03d}",

            "lat":
                round(
                    group["lat"],
                    6
                ),

            "lng":
                round(
                    group["lng"],
                    6
                ),

            "reports":
                total,

            "high":
                high_count,

            "unresolved":
                unresolved,

            "score":
                score,

            "level":
                level

        })


    return sorted(

        hotspots,

        key=lambda x:
            x["score"],

        reverse=True

    )


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return FileResponse(

        BASE
        / "static"
        / "index.html"

    )


# =========================================================
# PUBLIC STATS
# =========================================================

@app.get(
    "/api/public/stats"
)
def public_stats():

    reports = load_reports()

    hotspots = build_hotspots(
        reports
    )


    return {

        "total_reports":
            len(reports),

        "active_zones":
            sum(
                h["unresolved"] > 0
                for h in hotspots
            ),

        "critical_zones":
            sum(
                h["level"] == "Critical"
                for h in hotspots
            )

    }


# =========================================================
# PUBLIC HOTSPOTS
# =========================================================

@app.get(
    "/api/public/hotspots"
)
def public_hotspots():

    return build_hotspots(
        load_reports()
    )


# =========================================================
# PUBLIC REPORT
# =========================================================

@app.post(
    "/api/reports"
)
async def create_report(

    lat: float = Form(...),

    lng: float = Form(...),

    waste_type: str = Form(...),

    severity: str = Form(...),

    file:
        UploadFile | None =
        File(None)

):

    reports = load_reports()


    report_id = (

        "WP"
        + str(
            uuid.uuid4().int
        )[:6]

    )


    image_name = None


    if file and file.filename:

        extension = (
            Path(
                file.filename
            ).suffix.lower()

            or ".jpg"

        )


        image_name = (
            report_id
            + extension
        )


        with open(

            UPLOAD_DIR / image_name,

            "wb"

        ) as output:

            shutil.copyfileobj(
                file.file,
                output
            )


    new_report = {

        "id":
            report_id,

        "lat":
            lat,

        "lng":
            lng,

        "waste_type":
            waste_type,

        "severity":
            severity,

        "status":
            "Pending",

        "created_at":
            datetime.now().isoformat(
                timespec="seconds"
            ),

        "image":
            image_name

    }


    reports.insert(
        0,
        new_report
    )


    save_reports(
        reports
    )


    return {

        "success":
            True,

        "message":
            "Waste report submitted successfully.",

        "report":
            new_report

    }


# =========================================================
# ADMIN LOGIN
# =========================================================

@app.post(
    "/api/admin/login"
)
def admin_login(

    request: Request,

    username:
        str = Form(...),

    password:
        str = Form(...)

):

    if (

        username !=
        ADMIN_USERNAME

        or

        password !=
        ADMIN_PASSWORD

    ):

        raise HTTPException(

            status_code=401,

            detail=
                "Invalid admin username or password."

        )


    request.session[
        "is_admin"
    ] = True


    return {

        "success":
            True,

        "message":
            "Admin login successful."

    }


# =========================================================
# CHECK ADMIN LOGIN
# =========================================================

@app.get(
    "/api/admin/me"
)
def admin_me(
    request: Request
):

    return {

        "authenticated":
            bool(
                request.session.get(
                    "is_admin",
                    False
                )
            )

    }


# =========================================================
# ADMIN LOGOUT
# =========================================================

@app.post(
    "/api/admin/logout"
)
def admin_logout(
    request: Request
):

    request.session.clear()


    return {

        "success":
            True

    }


# =========================================================
# ADMIN REPORTS
# =========================================================

@app.get(
    "/api/admin/reports"
)
def admin_reports(
    _: bool = Depends(
        require_admin
    )
):

    return load_reports()


# =========================================================
# ADMIN HOTSPOTS
# =========================================================

@app.get(
    "/api/admin/hotspots"
)
def admin_hotspots(
    _: bool = Depends(
        require_admin
    )
):

    return build_hotspots(
        load_reports()
    )


# =========================================================
# ADMIN ONLY:
# RESOLVE / UPDATE REPORT
# =========================================================

@app.patch(
    "/api/reports/{report_id}"
)
def update_report(

    report_id: str,

    status: str = Form(...),

    _: bool = Depends(
        require_admin
    )

):

    allowed_statuses = {

        "Pending",

        "Assigned",

        "Resolved"

    }


    if status not in allowed_statuses:

        raise HTTPException(

            status_code=400,

            detail=
                "Invalid status."

        )


    reports = load_reports()


    for report in reports:

        if report["id"] == report_id:

            report["status"] = status


            save_reports(
                reports
            )


            return {

                "success":
                    True,

                "report":
                    report

            }


    raise HTTPException(

        status_code=404,

        detail=
            "Report not found."

    )


# =========================================================
# UPLOADS
# =========================================================

@app.get(
    "/uploads/{filename}"
)
def get_upload(
    filename: str
):

    return FileResponse(

        UPLOAD_DIR /
        filename

    )


# =========================================================
# STATIC
# =========================================================

app.mount(

    "/static",

    StaticFiles(
        directory=
            BASE / "static"
    ),

    name="static"

)