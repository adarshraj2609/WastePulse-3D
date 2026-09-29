const $ = (query) => document.querySelector(query);

let map = null;
let markersLayer = null;

let globeScene = null;
let globeCamera = null;
let globeRenderer = null;
let globeGroup = null;
let glowPoints = null;

const hotspotColors = {
    Critical: "#f05e5e",
    High: "#ef8641",
    Moderate: "#e0b34d",
    Low: "#59b874"
};


/* =====================================
   START APP
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    const year = $("#year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }


    document.querySelectorAll("[data-page]").forEach(button => {

        button.addEventListener("click", event => {

            event.preventDefault();

            showPage(button.dataset.page);

        });

    });


    setupCursor();

    setupTilt();

    setupModeButton();

    setupImagePreview();

    setupGPS();

    setupReportForm();

    init3DGlobe();

    loadHome();


    if (window.location.hash) {

        showPage(
            window.location.hash.replace("#", "")
        );

    }

});


/* =====================================
   PAGE NAVIGATION
===================================== */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.classList.remove("active");

        });


    const page =
        document.getElementById(pageId) || $("#home");


    if (!page) {
        return;
    }


    page.classList.add("active");


    document
        .querySelectorAll(
            `.nav-link[data-page="${page.id}"]`
        )
        .forEach(link => {

            link.classList.add("active");

        });


    window.location.hash = page.id;


    if (page.id === "home") {

        loadHome();

    }


    if (page.id === "hotspots") {

        setTimeout(
            loadMap,
            100
        );

    }


    if (page.id === "command") {

        loadCommand();

    }

}


/* =====================================
   CURSOR GLOW
===================================== */

function setupCursor() {

    const glow = $(".cursor-glow");

    if (!glow) {
        return;
    }


    window.addEventListener(
        "pointermove",
        event => {

            glow.style.left =
                `${event.clientX}px`;

            glow.style.top =
                `${event.clientY}px`;

        }
    );

}


/* =====================================
   3D CARD TILT
===================================== */

function setupTilt() {

    document
        .querySelectorAll(".tilt")
        .forEach(card => {

            card.addEventListener(
                "pointermove",
                event => {

                    const rect =
                        card.getBoundingClientRect();


                    const x =
                        (
                            (event.clientX - rect.left)
                            / rect.width
                            - 0.5
                        ) * 10;


                    const y =
                        (
                            (event.clientY - rect.top)
                            / rect.height
                            - 0.5
                        ) * -10;


                    card.style.transform =
                        `perspective(800px)
                         rotateX(${y}deg)
                         rotateY(${x}deg)
                         translateY(-2px)`;

                }
            );


            card.addEventListener(
                "pointerleave",
                () => {

                    card.style.transform = "";

                }
            );

        });

}


/* =====================================
   MODE BUTTON
===================================== */

function setupModeButton() {

    const button = $("#modeBtn");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "bright"
            );


            button.textContent =
                document.body.classList.contains("bright")
                    ? "☼"
                    : "✦";

        }
    );

}


/* =====================================
   IMAGE PREVIEW
===================================== */

function setupImagePreview() {

    const input = $("#photoInput");

    const image = $("#previewImage");

    const preview = $("#previewBox");


    if (!input || !image || !preview) {
        return;
    }


    input.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            image.src =
                URL.createObjectURL(file);


            preview.classList.remove(
                "hidden"
            );

        }
    );

}


/* =====================================
   GPS
===================================== */

function setupGPS() {

    const button = $("#gpsBtn");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            if (!navigator.geolocation) {

                showToast(
                    "GPS is not supported in this browser."
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                position => {

                    const lat =
                        position.coords.latitude.toFixed(6);


                    const lng =
                        position.coords.longitude.toFixed(6);


                    if ($("#lat")) {
                        $("#lat").value = lat;
                    }


                    if ($("#lng")) {
                        $("#lng").value = lng;
                    }


                    if ($("#locationText")) {

                        $("#locationText")
                            .textContent =
                            `${lat}, ${lng}`;

                    }


                    showToast(
                        "Current location captured."
                    );

                },


                () => {

                    showToast(
                        "Location permission denied."
                    );

                }

            );

        }
    );

}


/* =====================================
   REPORT FORM
===================================== */

function setupReportForm() {

    const form = $("#reportForm");

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const formData =
                new FormData(form);


            try {

                const response =
                    await fetch(
                        "/api/reports",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Unable to submit report."
                    );

                }


                if ($("#reportMessage")) {

                    $("#reportMessage")
                        .textContent =
                        data.message;

                }


                showToast(
                    `${data.report.id} submitted successfully.`
                );


                form.reset();


                if ($("#lat")) {
                    $("#lat").value =
                        "22.5726";
                }


                if ($("#lng")) {
                    $("#lng").value =
                        "88.3639";
                }


                if ($("#locationText")) {

                    $("#locationText")
                        .textContent =
                        "Demo coordinates loaded";

                }


                if ($("#previewBox")) {

                    $("#previewBox")
                        .classList
                        .add("hidden");

                }


                await loadHome();


            }
            catch (error) {

                if ($("#reportMessage")) {

                    $("#reportMessage")
                        .textContent =
                        error.message;

                }


                showToast(
                    error.message
                );

            }

        }
    );


    const refreshButton =
        $("#refreshHotspots");


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                loadMap();

                showToast(
                    "Hotspot data refreshed."
                );

            }
        );

    }

}


/* =====================================
   API HELPER
===================================== */

async function fetchJSON(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            options
        );


    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let data;


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        data =
            await response.json();

    }
    else {

        data =
            await response.text();

    }


    if (!response.ok) {

        const message =
            typeof data === "object" &&
            data !== null

                ? (
                    data.detail ||
                    data.error ||
                    "API request failed."
                )

                : "API request failed.";


        throw new Error(message);

    }


    return data;

}


/* =====================================
   HOME STATS
===================================== */

async function loadHome() {

    try {

        const [
            reports,
            hotspots
        ] = await Promise.all([

            fetchJSON(
                "/api/reports"
            ),

            fetchJSON(
                "/api/hotspots"
            )

        ]);


        if ($("#heroTotal")) {

            $("#heroTotal")
                .textContent =
                reports.length;

        }


        if ($("#heroActive")) {

            $("#heroActive")
                .textContent =
                hotspots.filter(
                    item =>
                        item.unresolved > 0
                ).length;

        }


        if ($("#heroCritical")) {

            $("#heroCritical")
                .textContent =
                hotspots.filter(
                    item =>
                        item.level === "Critical"
                ).length;

        }

    }
    catch (error) {

        console.error(
            "Home stats error:",
            error
        );


        if ($("#heroTotal")) {
            $("#heroTotal").textContent = "—";
        }


        if ($("#heroActive")) {
            $("#heroActive").textContent = "—";
        }


        if ($("#heroCritical")) {
            $("#heroCritical").textContent = "—";
        }

    }

}


/* =====================================
   THREE.JS 3D GLOBE
===================================== */

function init3DGlobe() {

    const container =
        $("#globe");


    if (
        !container ||
        !window.THREE
    ) {

        return;

    }


    const width =
        container.clientWidth;


    const height =
        container.clientHeight;


    if (
        width === 0 ||
        height === 0
    ) {

        return;

    }


    globeScene =
        new THREE.Scene();


    globeCamera =
        new THREE.PerspectiveCamera(
            42,
            width / height,
            0.1,
            100
        );


    globeCamera.position.z =
        3.2;


    globeRenderer =
        new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });


    globeRenderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );


    globeRenderer.setSize(
        width,
        height
    );


    globeRenderer.setClearColor(
        0x000000,
        0
    );


    container.appendChild(
        globeRenderer.domElement
    );


    /* MAIN GLOBE */

    const globeGeometry =
        new THREE.SphereGeometry(
            1.05,
            64,
            64
        );


    const globeMaterial =
        new THREE.MeshPhongMaterial({

            color: 0x163e2b,

            emissive: 0x062012,

            shininess: 80,

            transparent: true,

            opacity: 0.9

        });


    const globe =
        new THREE.Mesh(
            globeGeometry,
            globeMaterial
        );


    /* WIREFRAME */

    const wire =
        new THREE.LineSegments(

            new THREE.WireframeGeometry(

                new THREE.SphereGeometry(
                    1.07,
                    28,
                    18
                )

            ),

            new THREE.LineBasicMaterial({

                color: 0x6bdc8a,

                transparent: true,

                opacity: 0.10

            })

        );


    /* ATMOSPHERE */

    const atmosphere =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                1.12,
                48,
                48
            ),

            new THREE.MeshBasicMaterial({

                color: 0x77e994,

                transparent: true,

                opacity: 0.045,

                side: THREE.BackSide

            })

        );


    /* LIGHTS */

    const light1 =
        new THREE.PointLight(
            0x9be7ad,
            3,
            8
        );


    light1.position.set(
        2,
        1.5,
        3
    );


    const light2 =
        new THREE.PointLight(
            0x4bb86c,
            1.6,
            6
        );


    light2.position.set(
        -3,
        -2,
        1
    );


    globeScene.add(
        light1,
        light2
    );


    /* PARTICLES */

    const particleCount =
        850;


    const positions =
        new Float32Array(
            particleCount * 3
        );


    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        const u =
            Math.random();


        const v =
            Math.random();


        const theta =
            2 *
            Math.PI *
            u;


        const phi =
            Math.acos(
                2 * v - 1
            );


        const radius =
            1.12 +
            Math.random() *
            0.05;


        positions[i * 3] =
            radius *
            Math.sin(phi) *
            Math.cos(theta);


        positions[i * 3 + 1] =
            radius *
            Math.cos(phi);


        positions[i * 3 + 2] =
            radius *
            Math.sin(phi) *
            Math.sin(theta);

    }


    const particleGeometry =
        new THREE.BufferGeometry();


    particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    const particleMaterial =
        new THREE.PointsMaterial({

            color: 0x9be7ad,

            size: 0.012,

            transparent: true,

            opacity: 0.55

        });


    glowPoints =
        new THREE.Points(
            particleGeometry,
            particleMaterial
        );


    globeGroup =
        new THREE.Group();


    globeGroup.add(
        globe,
        wire,
        atmosphere,
        glowPoints
    );


    globeScene.add(
        globeGroup
    );


    /* HOTSPOT NODES */

    const hotspotCoords = [

        {
            x: 0.53,
            y: 0.28,
            z: 0.82
        },

        {
            x: -0.25,
            y: 0.15,
            z: 0.96
        },

        {
            x: 0.02,
            y: -0.38,
            z: 0.93
        },

        {
            x: -0.52,
            y: -0.17,
            z: 0.82
        }

    ];


    hotspotCoords.forEach(
        point => {

            const marker =
                new THREE.Mesh(

                    new THREE.SphereGeometry(
                        0.038,
                        18,
                        18
                    ),

                    new THREE.MeshBasicMaterial({
                        color: 0xd7ff9b
                    })

                );


            marker.position.set(
                point.x,
                point.y,
                point.z
            );


            globeGroup.add(
                marker
            );

        }
    );


    window.addEventListener(
        "resize",
        resizeGlobe
    );


    animateGlobe();

}


/* =====================================
   RESIZE GLOBE
===================================== */

function resizeGlobe() {

    if (
        !globeRenderer ||
        !globeCamera ||
        !$("#globe")
    ) {

        return;

    }


    const container =
        $("#globe");


    globeCamera.aspect =
        container.clientWidth /
        container.clientHeight;


    globeCamera.updateProjectionMatrix();


    globeRenderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

}


/* =====================================
   GLOBE ANIMATION
===================================== */

function animateGlobe() {

    requestAnimationFrame(
        animateGlobe
    );


    if (
        !globeRenderer ||
        !globeScene ||
        !globeCamera ||
        !globeGroup ||
        !glowPoints
    ) {

        return;

    }


    globeGroup.rotation.y +=
        0.0028;


    glowPoints.rotation.y -=
        0.0008;


    globeRenderer.render(
        globeScene,
        globeCamera
    );

}


/* =====================================
   LEAFLET HOTSPOT MAP
===================================== */

async function loadMap() {

    const mapElement =
        $("#leafletMap");


    if (
        !mapElement ||
        !window.L
    ) {

        return;

    }


    try {

        const hotspots =
            await fetchJSON(
                "/api/hotspots"
            );


        if (!map) {

            map =
                L.map(
                    "leafletMap",
                    {
                        zoomControl: true
                    }
                )
                .setView(
                    [
                        22.5728,
                        88.3641
                    ],
                    14
                );


            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    attribution:
                        "&copy; OpenStreetMap contributors"
                }
            )
            .addTo(map);


            markersLayer =
                L.layerGroup()
                    .addTo(map);

        }


        markersLayer.clearLayers();


        hotspots.forEach(
            hotspot => {

                const marker =
                    L.circleMarker(
                        [
                            hotspot.lat,
                            hotspot.lng
                        ],
                        {

                            radius:
                                10 +
                                Math.min(
                                    hotspot.score / 18,
                                    8
                                ),

                            color:
                                "#dcefe0",

                            weight: 1,

                            fillColor:
                                hotspotColors[
                                    hotspot.level
                                ] ||
                                hotspotColors.Low,

                            fillOpacity:
                                0.85

                        }
                    );


                marker.bindPopup(`

                    <div
                        style="
                            min-width:170px;
                            font-family:Arial,sans-serif;
                        "
                    >

                        <strong>

                            ${hotspot.id}
                            -
                            ${hotspot.level}

                        </strong>

                        <br><br>

                        Reports:
                        ${hotspot.reports}

                        <br>

                        Unresolved:
                        ${hotspot.unresolved}

                        <br>

                        Priority:
                        ${hotspot.score}/100

                    </div>

                `);


                marker.addTo(
                    markersLayer
                );

            }
        );


        renderHotspotList(
            hotspots
        );

    }
    catch (error) {

        console.error(
            "Map error:",
            error
        );


        showToast(
            error.message
        );

    }

}


/* =====================================
   HOTSPOT LIST
===================================== */

function renderHotspotList(
    hotspots
) {

    const list =
        $("#hotspotList");


    if (!list) {
        return;
    }


    const max =
        Math.max(
            ...hotspots.map(
                item =>
                    item.score
            ),
            1
        );


    list.innerHTML =
        hotspots
            .map(
                hotspot => `

                    <article class="hot-item">

                        <div
                            class="hot-top"
                        >

                            <strong>
                                ${hotspot.id}
                            </strong>


                            <span
                                class="
                                    badge
                                    ${hotspot.level}
                                "
                            >

                                ${hotspot.level}

                            </span>

                        </div>


                        <div
                            class="meter"
                        >

                            <i
                                style="
                                    width:
                                    ${
                                        (
                                            hotspot.score /
                                            max
                                        ) * 100
                                    }%
                                "
                            ></i>

                        </div>


                        <div
                            class="hot-meta"
                        >

                            <span>

                                ${hotspot.reports}
                                reports

                            </span>


                            <span>

                                ${hotspot.unresolved}
                                unresolved

                            </span>


                            <b>

                                ${hotspot.score}/100

                            </b>

                        </div>


                    </article>

                `
            )
            .join("");

}


/* =====================================
   COMMAND CENTER
===================================== */

async function loadCommand() {

    try {

        const [
            reports,
            hotspots
        ] = await Promise.all([

            fetchJSON(
                "/api/reports"
            ),

            fetchJSON(
                "/api/hotspots"
            )

        ]);


        const active =
            hotspots.filter(
                item =>
                    item.unresolved > 0
            ).length;


        const critical =
            hotspots.filter(
                item =>
                    item.level === "Critical"
            ).length;


        const resolved =
            reports.filter(
                item =>
                    item.status === "Resolved"
            ).length;


        const pending =
            reports.filter(
                item =>
                    item.status !== "Resolved"
            ).length;


        if ($("#kpiTotal")) {

            $("#kpiTotal")
                .textContent =
                reports.length;

        }


        if ($("#kpiActive")) {

            $("#kpiActive")
                .textContent =
                active;

        }


        if ($("#kpiCritical")) {

            $("#kpiCritical")
                .textContent =
                critical;

        }


        if ($("#kpiResolved")) {

            $("#kpiResolved")
                .textContent =
                resolved;

        }


        if ($("#queueCount")) {

            $("#queueCount")
                .textContent =
                `${pending} pending`;

        }


        renderPriorityBars(
            hotspots
        );


        renderRecentReports(
            reports
        );


        renderResponseQueue(
            reports
        );

    }
    catch (error) {

        console.error(
            "Command center error:",
            error
        );


        showToast(
            error.message
        );

    }

}


/* =====================================
   PRIORITY BARS
===================================== */

function renderPriorityBars(
    hotspots
) {

    const container =
        $("#bars");


    if (!container) {
        return;
    }


    const maxScore =
        Math.max(
            ...hotspots.map(
                item =>
                    item.score
            ),
            1
        );


    container.innerHTML =
        hotspots
            .slice(0, 6)
            .map(
                hotspot => `

                    <div
                        class="bar"
                    >

                        <div
                            class="bar-top"
                        >

                            <span>

                                ${hotspot.id}
                                -
                                ${hotspot.level}

                            </span>


                            <b>

                                ${hotspot.score}

                            </b>

                        </div>


                        <div
                            class="track"
                        >

                            <div
                                class="fill"
                                style="
                                    width:
                                    ${
                                        (
                                            hotspot.score /
                                            maxScore
                                        ) * 100
                                    }%
                                "
                            ></div>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =====================================
   RECENT REPORTS
===================================== */

function renderRecentReports(
    reports
) {

    const container =
        $("#recent");


    if (!container) {
        return;
    }


    container.innerHTML =
        reports
            .slice(0, 7)
            .map(
                report => `

                    <div
                        class="stream-row"
                    >

                        <div>

                            <strong>

                                ${report.id}

                            </strong>


                            <small>

                                ${report.waste_type}
                                •
                                ${report.severity}

                            </small>

                        </div>


                        <span
                            class="status"
                        >

                            ${report.status}

                        </span>

                    </div>

                `
            )
            .join("");

}


/* =====================================
   RESPONSE QUEUE
===================================== */

function renderResponseQueue(
    reports
) {

    const container =
        $("#actions");


    if (!container) {
        return;
    }


    const pendingReports =
        reports
            .filter(
                report =>
                    report.status !== "Resolved"
            )
            .slice(0, 8);


    const rows =
        pendingReports
            .map(
                report => `

                    <div
                        class="action-row"
                    >

                        <b>

                            ${report.id}

                        </b>


                        <span>

                            ${report.waste_type}

                        </span>


                        <span>

                            ${report.severity}

                        </span>


                        <span>

                            <button
                                class="resolve-btn"
                                onclick="
                                    resolveReport(
                                        '${report.id}'
                                    )
                                "
                            >

                                Mark Resolved

                            </button>

                        </span>

                    </div>

                `
            )
            .join("");


    const emptyMessage =
        pendingReports.length === 0

            ? `

                <div
                    class="empty-queue"
                >

                    ✓ All reports are resolved

                </div>

              `

            : "";


    container.innerHTML = `

        <div
            class="action-row head"
        >

            <span>
                REPORT
            </span>

            <span>
                TYPE
            </span>

            <span>
                SEVERITY
            </span>

            <span>
                STATUS
            </span>

        </div>


        ${rows}

        ${emptyMessage}

    `;

}


/* =====================================
   RESOLVE REPORT
===================================== */

async function resolveReport(
    reportId
) {

    const formData =
        new FormData();


    formData.append(
        "status",
        "Resolved"
    );


    try {

        const response =
            await fetch(
                `/api/reports/${reportId}`,
                {
                    method: "PATCH",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to update report."
            );

        }


        showToast(
            `${reportId} marked as resolved.`
        );


        await loadCommand();

        await loadHome();


        if (map) {

            await loadMap();

        }

    }
    catch (error) {

        console.error(
            "Resolve error:",
            error
        );


        showToast(
            error.message
        );

    }

}


/* =====================================
   TOAST
===================================== */

function showToast(
    message
) {

    const toast =
        $("#toast");


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}