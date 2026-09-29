const $ = (query) =>
    document.querySelector(query);


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


document.addEventListener(
    "DOMContentLoaded",
    () => {

        $("#year").textContent =
            new Date().getFullYear();


        // NAVIGATION

        document
            .querySelectorAll("[data-page]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        showPage(
                            button.dataset.page
                        );

                    }
                );

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
                window.location.hash
                    .replace("#", "")
            );

        }

    }
);


/* =====================================
   PAGE NAVIGATION
===================================== */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active"
            );

        });


    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.classList.remove(
                "active"
            );

        });


    const page =
        document.getElementById(
            pageId
        ) || $("#home");


    page.classList.add(
        "active"
    );


    document
        .querySelectorAll(
            `.nav-link[data-page="${page.id}"]`
        )
        .forEach(link => {

            link.classList.add(
                "active"
            );

        });


    window.location.hash =
        page.id;


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
   CURSOR
===================================== */

function setupCursor() {

    const glow =
        $(".cursor-glow");


    window.addEventListener(
        "pointermove",
        event => {

            glow.style.left =
                event.clientX + "px";

            glow.style.top =
                event.clientY + "px";

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

                    card.style.transform =
                        "";

                }
            );

        });

}


/* =====================================
   MODE BUTTON
===================================== */

function setupModeButton() {

    $("#modeBtn").addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "bright"
            );


            $("#modeBtn").textContent =
                document.body.classList.contains(
                    "bright"
                )
                    ? "☼"
                    : "✦";

        }
    );

}


/* =====================================
   IMAGE PREVIEW
===================================== */

function setupImagePreview() {

    $("#photoInput").addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) return;


            const imageURL =
                URL.createObjectURL(
                    file
                );


            $("#previewImage").src =
                imageURL;


            $("#previewBox")
                .classList
                .remove("hidden");

        }
    );

}


/* =====================================
   GPS
===================================== */

function setupGPS() {

    $("#gpsBtn").addEventListener(
        "click",
        () => {

            if (!navigator.geolocation) {

                showToast(
                    "GPS is not supported."
                );

                return;

            }


            navigator.geolocation.getCurrentPosition(

                position => {

                    const lat =
                        position.coords.latitude
                            .toFixed(6);

                    const lng =
                        position.coords.longitude
                            .toFixed(6);


                    $("#lat").value =
                        lat;

                    $("#lng").value =
                        lng;


                    $("#locationText")
                        .textContent =
                        `${lat}, ${lng}`;


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
   FORM SUBMIT
===================================== */

function setupReportForm() {

    $("#reportForm")
        .addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const formData =
                    new FormData(
                        event.target
                    );


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


                    $("#reportMessage")
                        .textContent =
                        data.message;


                    showToast(
                        "Report added."
                    );


                    event.target.reset();


                    $("#lat").value =
                        "22.5726";


                    $("#lng").value =
                        "88.3639";


                    $("#locationText")
                        .textContent =
                        "Demo coordinates loaded";


                    $("#previewBox")
                        .classList
                        .add("hidden");


                    loadHome();


                } catch (error) {

                    $("#reportMessage")
                        .textContent =
                        error.message;


                    showToast(
                        error.message
                    );

                }

            }
        );


    $("#refreshHotspots")
        .addEventListener(
            "click",
            () => {

                loadMap();

                showToast(
                    "Hotspot data refreshed."
                );

            }
        );

}


/* =====================================
   API
===================================== */

async function fetchJSON(url) {

    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "API request failed."
        );

    }


    return response.json();

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


        $("#heroTotal")
            .textContent =
            reports.length;


        $("#heroActive")
            .textContent =
            hotspots.filter(
                item =>
                    item.unresolved > 0
            ).length;


        $("#heroCritical")
            .textContent =
            hotspots.filter(
                item =>
                    item.level === "Critical"
            ).length;


    } catch {

        $("#heroTotal")
            .textContent = "—";


        $("#heroActive")
            .textContent = "—";


        $("#heroCritical")
            .textContent = "—";

    }

}


/* =====================================
   THREE.JS GLOBE
===================================== */

function init3DGlobe() {

    if (
        !window.THREE ||
        !$("#globe")
    ) {

        return;

    }


    const container =
        $("#globe");


    const width =
        container.clientWidth;


    const height =
        container.clientHeight;


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


    // MAIN GLOBE

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


    // WIREFRAME

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


    // ATMOSPHERE

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


    // LIGHTS

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


    // PARTICLES

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


    // HOTSPOT NODES

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
   RESIZE
===================================== */

function resizeGlobe() {

    if (
        !globeRenderer ||
        !globeCamera
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
        !globeCamera
    ) {

        return;

    }


    globeGroup.rotation.y += 0.0028;

    glowPoints.rotation.y -= 0.0008;


    globeRenderer.render(
        globeScene,
        globeCamera
    );

}


/* =====================================
   LEAFLET MAP
===================================== */

async function loadMap() {

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
        ).addTo(map);


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

                        color: "#dcefe0",

                        weight: 1,

                        fillColor:
                            hotspotColors[
                                hotspot.level
                            ],

                        fillOpacity: 0.85

                    }
                );


            marker.bindPopup(`

                <div
                    style="
                        min-width:170px;
                        font-family:Arial;
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


/* =====================================
   HOTSPOT LIST
===================================== */

function renderHotspotList(
    hotspots
) {

    const max =
        Math.max(
            ...hotspots.map(
                item => item.score
            ),
            1
        );


    $("#hotspotList")
        .innerHTML =
        hotspots
            .map(
                hotspot => `

                    <article class="hot-item">

                        <div class="hot-top">

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


                        <div class="meter">

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


                        <div class="hot-meta">

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


    $("#kpiTotal").textContent =
        reports.length;


    $("#kpiActive").textContent =
        active;


    $("#kpiCritical").textContent =
        critical;


    $("#kpiResolved").textContent =
        resolved;


    $("#queueCount").textContent =
        `${pending} pending`;


    const maxScore =
        Math.max(
            ...hotspots.map(
                item =>
                    item.score
            ),
            1
        );


    $("#bars").innerHTML =
        hotspots
            .slice(0, 6)
            .map(
                hotspot => `

                    <div class="bar">

                        <div class="bar-top">

                            <span>
                                ${hotspot.id}
                                -
                                ${hotspot.level}
                            </span>

                            <b>
                                ${hotspot.score}
                            </b>

                        </div>


                        <div class="track">

                            <div
                                class="fill"
                                style="
                                    width:
                                    ${
                                        hotspot.score /
                                        maxScore *
                                        100
                                    }%
                                "
                            ></div>

                        </div>

                    </div>

                `
            )
            .join("");


    $("#recent").innerHTML =
        reports
            .slice(0, 7)
            .map(
                report => `

                    <div class="stream-row">

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


                        <span class="status">
                            ${report.status}
                        </span>

                    </div>

                `
            )
            .join("");


    $("#actions").innerHTML = `

        <div class="action-row head">

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


        ${
            reports
                .filter(
                    report =>
                        report.status !== "Resolved"
                )
                .slice(0, 8)
                .map(
                    report => `

                        <div class="action-row">

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
                                ${report.status}
                            </span>

                        </div>

                    `
                )
                .join("")
        }

    `;

}


/* =====================================
   TOAST
===================================== */

function showToast(message) {

    const toast =
        $("#toast");


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