from fastapi import FastAPI, Form, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from datetime import datetime
import json
import math
import uuid
import shutil

BASE = Path(__file__).parent
DATA_FILE = BASE / "data.json"
UPLOAD_DIR = BASE / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="WastePulse 3D")


# ---------------------------------------------------------
# CREATE DEMO DATA FIRST TIME
# ---------------------------------------------------------

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
        json.dumps(demo_reports, indent=2),
        encoding="utf-8"
    )


# ---------------------------------------------------------
# DATABASE HELPERS
# ---------------------------------------------------------

def load_reports():
    return json.loads(
        DATA_FILE.read_text(encoding="utf-8")
    )


def save_reports(reports):
    DATA_FILE.write_text(
        json.dumps(reports, indent=2),
        encoding="utf-8"
    )


# ---------------------------------------------------------
# HOTSPOT DETECTION
# ---------------------------------------------------------

def build_hotspots(reports):

    groups = []

    for report in reports:

        group = None

        for candidate in groups:

            distance = math.dist(
                (report["lat"], report["lng"]),
                (candidate["lat"], candidate["lng"])
            )

            # approximately nearby reports
            if distance < 0.001:
                group = candidate
                break

        if group:

            group["reports"].append(report)

            count = len(group["reports"])

            group["lat"] = (
                sum(x["lat"] for x in group["reports"])
                / count
            )

            group["lng"] = (
                sum(x["lng"] for x in group["reports"])
                / count
            )

        else:

            groups.append({
                "lat": report["lat"],
                "lng": report["lng"],
                "reports": [report]
            })


    hotspots = []

    for index, group in enumerate(groups, start=1):

        items = group["reports"]

        total = len(items)

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

            "id": f"HS{index:03d}",

            "lat": round(
                group["lat"],
                6
            ),

            "lng": round(
                group["lng"],
                6
            ),

            "reports": total,

            "high": high_count,

            "unresolved": unresolved,

            "score": score,

            "level": level
        })


    return sorted(
        hotspots,
        key=lambda x: x["score"],
        reverse=True
    )


# ---------------------------------------------------------
# FRONTEND
# ---------------------------------------------------------

@app.get("/")
def home():

    return FileResponse(
        BASE / "static" / "index.html"
    )


# ---------------------------------------------------------
# GET REPORTS
# ---------------------------------------------------------

@app.get("/api/reports")
def get_reports():

    return load_reports()


# ---------------------------------------------------------
# GET HOTSPOTS
# ---------------------------------------------------------

@app.get("/api/hotspots")
def get_hotspots():

    return build_hotspots(
        load_reports()
    )


# ---------------------------------------------------------
# CREATE REPORT
# ---------------------------------------------------------

@app.post("/api/reports")
async def create_report(

    lat: float = Form(...),

    lng: float = Form(...),

    waste_type: str = Form(...),

    severity: str = Form(...),

    file: UploadFile | None = File(None)
):

    reports = load_reports()

    report_id = (
        "WP"
        + str(uuid.uuid4().int)[:6]
    )


    image_name = None


    if file and file.filename:

        extension = (
            Path(file.filename).suffix.lower()
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

        "id": report_id,

        "lat": lat,

        "lng": lng,

        "waste_type": waste_type,

        "severity": severity,

        "status": "Pending",

        "created_at":
            datetime.now().isoformat(
                timespec="seconds"
            ),

        "image": image_name
    }


    reports.insert(
        0,
        new_report
    )


    save_reports(reports)


    return {

        "message":
            "Waste report submitted successfully.",

        "report": new_report
    }


# ---------------------------------------------------------
# UPDATE REPORT STATUS
# ---------------------------------------------------------

@app.patch("/api/reports/{report_id}")
def update_report(

    report_id: str,

    status: str = Form(...)
):

    reports = load_reports()


    for report in reports:

        if report["id"] == report_id:

            report["status"] = status

            save_reports(reports)

            return report


    return {
        "error":
            "Report not found"
    }


# ---------------------------------------------------------
# SERVE UPLOADED IMAGES
# ---------------------------------------------------------

@app.get("/uploads/{filename}")
def get_upload(filename: str):

    return FileResponse(
        UPLOAD_DIR / filename
    )


# ---------------------------------------------------------
# STATIC FILES
# ---------------------------------------------------------

app.mount(
    "/static",
    StaticFiles(
        directory=BASE / "static"
    ),
    name="static"
)