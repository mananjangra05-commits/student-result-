/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";


/* =========================================================
   FIREBASE CONFIGURATION

   REPLACE THESE VALUES WITH YOUR FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain:
        "YOUR_PROJECT.firebaseapp.com",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_APP_ID"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentUser = null;

let allResults = [];

let allDocuments = [];


/* =========================================================
   DOM ELEMENTS
========================================================= */

const authScreen =
    document.getElementById("authScreen");

const application =
    document.getElementById("app");

const loginBox =
    document.getElementById("loginBox");

const registerBox =
    document.getElementById("registerBox");

const authMessage =
    document.getElementById("authMessage");


/* =========================================================
   AUTH SCREEN SWITCH
========================================================= */

document
    .getElementById("showRegister")
    .addEventListener("click", () => {

        loginBox.classList.add("hidden");

        registerBox.classList.remove("hidden");

        authMessage.textContent = "";

    });


document
    .getElementById("showLogin")
    .addEventListener("click", () => {

        registerBox.classList.add("hidden");

        loginBox.classList.remove("hidden");

        authMessage.textContent = "";

    });


/* =========================================================
   REGISTER
========================================================= */

document
    .getElementById("registerForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const roll =
            document.getElementById("registerRoll").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;


        try {

            authMessage.textContent =
                "Creating account...";


            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            /* Save student profile in Firestore */

            await setDoc(
                doc(db, "students", user.uid),
                {

                    name: name,

                    roll: roll,

                    email: email,

                    phone: "",

                    course:
                        "B.Tech Computer Science",

                    semester: "5th",

                    college: "",

                    city: "",

                    about: "",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            showToast(
                "Account created successfully!"
            );


        } catch (error) {

            authMessage.textContent =
                getFirebaseError(error);

        }

    });


/* =========================================================
   LOGIN
========================================================= */

document
    .getElementById("loginForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;


        try {

            authMessage.textContent =
                "Logging in...";


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        } catch (error) {

            authMessage.textContent =
                getFirebaseError(error);

        }

    });


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            currentUser = user;

            authScreen.classList.add("hidden");

            application.classList.remove("hidden");

            await loadProfile();

            await loadResults();

            await loadDocuments();

        } else {

            currentUser = null;

            application.classList.add("hidden");

            authScreen.classList.remove("hidden");

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await signOut(auth);

        showToast("Logged out successfully.");

    });


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener("click", () => {

            const section =
                button.dataset.section;

            switchSection(section);

        });

    });


document
    .querySelectorAll("[data-go]")
    .forEach(button => {

        button.addEventListener("click", () => {

            switchSection(
                button.dataset.go
            );

        });

    });


function switchSection(sectionName) {

    document
        .querySelectorAll(".content-section")
        .forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


    const selected =
        document.getElementById(sectionName);

    if (selected) {

        selected.classList.add(
            "active-section"
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove("active");

            if (
                item.dataset.section ===
                sectionName
            ) {

                item.classList.add("active");

            }

        });


    const titles = {

        dashboard: [
            "Dashboard",
            "Welcome to your student dashboard."
        ],

        profile: [
            "My Profile",
            "Manage your personal information."
        ],

        results: [
            "Academic Results",
            "Manage your semester results."
        ],

        documents: [
            "My Documents",
            "Manage your academic documents."
        ]

    };


    document.getElementById(
        "pageTitle"
    ).textContent = titles[sectionName][0];


    document.getElementById(
        "pageSubtitle"
    ).textContent = titles[sectionName][1];


    document
        .querySelector(".sidebar")
        .classList.remove("open");

}


/* =========================================================
   MOBILE MENU
========================================================= */

document
    .getElementById("mobileMenu")
    .addEventListener("click", () => {

        document
            .querySelector(".sidebar")
            .classList.toggle("open");

    });


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    if (!currentUser) return;


    const profileRef =
        doc(
            db,
            "students",
            currentUser.uid
        );


    const profileSnap =
        await getDoc(profileRef);


    if (!profileSnap.exists()) {

        return;

    }


    const data =
        profileSnap.data();


    document.getElementById(
        "profileName"
    ).value =
        data.name || "";


    document.getElementById(
        "profileRoll"
    ).value =
        data.roll || "";


    document.getElementById(
        "profileEmail"
    ).value =
        data.email || currentUser.email;


    document.getElementById(
        "profilePhone"
    ).value =
        data.phone || "";


    document.getElementById(
        "profileCourse"
    ).value =
        data.course ||
        "B.Tech Computer Science";


    document.getElementById(
        "profileSemester"
    ).value =
        data.semester || "5th";


    document.getElementById(
        "profileCollege"
    ).value =
        data.college || "";


    document.getElementById(
        "profileCity"
    ).value =
        data.city || "";


    document.getElementById(
        "profileAbout"
    ).value =
        data.about || "";


    updateHeader(data);

}


/* =========================================================
   UPDATE HEADER
========================================================= */

function updateHeader(data) {

    const name =
        data.name || "Student";

    const roll =
        data.roll || "-";


    document.getElementById(
        "welcomeName"
    ).textContent = name;


    document.getElementById(
        "topStudentName"
    ).textContent = name;


    document.getElementById(
        "topStudentRoll"
    ).textContent =
        `Roll No. ${roll}`;


    document.getElementById(
        "topAvatar"
    ).textContent =
        name.charAt(0).toUpperCase();

}


/* =========================================================
   SAVE PROFILE
========================================================= */

document
    .getElementById("profileForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        if (!currentUser) return;


        const profileData = {

            name:
                document.getElementById(
                    "profileName"
                ).value.trim(),

            roll:
                document.getElementById(
                    "profileRoll"
                ).value.trim(),

            email:
                currentUser.email,

            phone:
                document.getElementById(
                    "profilePhone"
                ).value.trim(),

            course:
                document.getElementById(
                    "profileCourse"
                ).value.trim(),

            semester:
                document.getElementById(
                    "profileSemester"
                ).value,

            college:
                document.getElementById(
                    "profileCollege"
                ).value.trim(),

            city:
                document.getElementById(
                    "profileCity"
                ).value.trim(),

            about:
                document.getElementById(
                    "profileAbout"
                ).value.trim(),

            updatedAt:
                serverTimestamp()

        };


        try {

            await setDoc(
                doc(
                    db,
                    "students",
                    currentUser.uid
                ),
                profileData,
                {
                    merge: true
                }
            );


            updateHeader(profileData);

            showToast(
                "Profile saved successfully!"
            );


        } catch (error) {

            showToast(
                "Unable to save profile."
            );

            console.error(error);

        }

    });


/* =========================================================
   ADD RESULT
========================================================= */

document
    .getElementById("resultForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        if (!currentUser) return;


        const semester =
            document.getElementById(
                "resultSemester"
            ).value;

        const subjectCode =
            document.getElementById(
                "subjectCode"
            ).value.trim();

        const subjectName =
            document.getElementById(
                "subjectName"
            ).value.trim();

        const maxMarks =
            Number(
                document.getElementById(
                    "maxMarks"
                ).value
            );

        const obtainedMarks =
            Number(
                document.getElementById(
                    "obtainedMarks"
                ).value
            );

        const grade =
            document.getElementById(
                "grade"
            ).value;


        if (obtainedMarks > maxMarks) {

            showToast(
                "Obtained marks cannot exceed maximum marks."
            );

            return;

        }


        const status =
            obtainedMarks >=
            maxMarks * 0.4
                ? "Pass"
                : "Fail";


        try {

            await addDoc(

                collection(
                    db,
                    "students",
                    currentUser.uid,
                    "results"
                ),

                {

                    semester,

                    subjectCode,

                    subjectName,

                    maxMarks,

                    obtainedMarks,

                    grade,

                    status,

                    createdAt:
                        serverTimestamp()

                }

            );


            document
                .getElementById("resultForm")
                .reset();


            document.getElementById(
                "maxMarks"
            ).value = 100;


            document.getElementById(
                "resultSemester"
            ).value = 5;


            await loadResults();


            showToast(
                "Result added successfully!"
            );


        } catch (error) {

            console.error(error);

            showToast(
                "Unable to add result."
            );

        }

    });


/* =========================================================
   LOAD RESULTS
========================================================= */

async function loadResults() {

    if (!currentUser) return;


    const resultsRef =
        collection(
            db,
            "students",
            currentUser.uid,
            "results"
        );


    const snapshot =
        await getDocs(resultsRef);


    allResults = [];


    snapshot.forEach(item => {

        allResults.push({

            id: item.id,

            ...item.data()

        });

    });


    renderResults();

    updateResultSummary();

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults() {

    const tbody =
        document.getElementById(
            "resultsTableBody"
        );


    const filter =
        document.getElementById(
            "semesterFilter"
        ).value;


    tbody.innerHTML = "";


    let filteredResults =
        [...allResults];


    if (filter !== "all") {

        filteredResults =
            filteredResults.filter(
                result =>
                    String(result.semester) ===
                    String(filter)
            );

    }


    if (filteredResults.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="8">

                    <div class="empty-state">

                        <i class="fa-solid fa-book-open"></i>

                        <p>No result found.</p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    filteredResults.forEach(result => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                Semester ${escapeHTML(result.semester)}
            </td>

            <td>
                <strong>
                    ${escapeHTML(result.subjectCode)}
                </strong>
            </td>

            <td>
                ${escapeHTML(result.subjectName)}
            </td>

            <td>
                ${result.maxMarks}
            </td>

            <td>
                <strong>
                    ${result.obtainedMarks}
                </strong>
            </td>

            <td>
                ${escapeHTML(result.grade)}
            </td>

            <td>

                <span class="status ${
                    result.status === "Pass"
                        ? "pass"
                        : "fail"
                }">

                    ${result.status}

                </span>

            </td>

            <td>

                <button
                    class="delete-btn"
                    data-result-id="${result.id}">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>

        `;


        tbody.appendChild(row);

    });


    document
        .querySelectorAll("[data-result-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteResult(
                    button.dataset.resultId
                )
            );

        });


    renderDashboardResults();

}


/* =========================================================
   DELETE RESULT
========================================================= */

async function deleteResult(id) {

    if (
        !confirm(
            "Delete this result?"
        )
    ) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                "students",
                currentUser.uid,
                "results",
                id
            )

        );


        await loadResults();


        showToast(
            "Result deleted."
        );


    } catch (error) {

        console.error(error);

        showToast(
            "Unable to delete result."
        );

    }

}


/* =========================================================
   RESULT SUMMARY
========================================================= */

function updateResultSummary() {

    let total =
        0;

    let obtained =
        0;


    allResults.forEach(result => {

        total +=
            Number(result.maxMarks || 0);

        obtained +=
            Number(result.obtainedMarks || 0);

    });


    const percentage =
        total > 0
            ? (obtained / total) * 100
            : 0;


    const cgpa =
        percentage / 10;


    document.getElementById(
        "totalMarks"
    ).textContent =
        `${obtained} / ${total}`;


    document.getElementById(
        "resultPercentage"
    ).textContent =
        `${percentage.toFixed(2)}%`;


    document.getElementById(
        "resultCGPA"
    ).textContent =
        cgpa.toFixed(2);


    document.getElementById(
        "dashboardPercentage"
    ).textContent =
        `${percentage.toFixed(2)}%`;


    document.getElementById(
        "dashboardCGPA"
    ).textContent =
        cgpa.toFixed(2);


    document.getElementById(
        "totalSubjects"
    ).textContent =
        allResults.length;

}


/* =========================================================
   FILTER RESULTS
========================================================= */

document
    .getElementById("semesterFilter")
    .addEventListener(
        "change",
        renderResults
    );


/* =========================================================
   DOCUMENT UPLOAD
========================================================= */

document
    .getElementById("documentForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        if (!currentUser) return;


        const file =
            document.getElementById(
                "documentFile"
            ).files[0];


        const category =
            document.getElementById(
                "documentCategory"
            ).value;


        if (!file) {

            showToast(
                "Please select a file."
            );

            return;

        }


        /* 5 MB limit */

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            showToast(
                "File size must be less than 5 MB."
            );

            return;

        }


        const uploadButton =
            document.getElementById(
                "uploadBtn"
            );


        try {

            uploadButton.disabled = true;

            uploadButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Uploading...
            `;


            /* Create Firestore document first */

            const documentRef =
                await addDoc(

                    collection(
                        db,
                        "students",
                        currentUser.uid,
                        "documents"
                    ),

                    {

                        fileName:
                            file.name,

                        category,

                        fileType:
                            file.type,

                        fileSize:
                            file.size,

                        createdAt:
                            serverTimestamp()

                    }

                );


            /* Storage location */

            const storagePath =
                `students/${currentUser.uid}/documents/${documentRef.id}-${file.name}`;


            const storageRef =
                ref(
                    storage,
                    storagePath
                );


            /* Upload actual file */

            await uploadBytes(
                storageRef,
                file
            );


            /* Get downloadable URL */

            const downloadURL =
                await getDownloadURL(
                    storageRef
                );


            /* Update Firestore */

            await setDoc(

                documentRef,

                {

                    storagePath,

                    downloadURL

                },

                {
                    merge: true
                }

            );


            document
                .getElementById(
                    "documentForm"
                )
                .reset();


            await loadDocuments();


            showToast(
                "Document uploaded successfully!"
            );


        } catch (error) {

            console.error(error);

            showToast(
                "Document upload failed."
            );

        }


        uploadButton.disabled = false;

        uploadButton.innerHTML = `
            <i class="fa-solid fa-upload"></i>
            Upload Document
        `;

    });


/* =========================================================
   LOAD DOCUMENTS
========================================================= */

async function loadDocuments() {

    if (!currentUser) return;


    const documentsRef =
        collection(
            db,
            "students",
            currentUser.uid,
            "documents"
        );


    const snapshot =
        await getDocs(
            documentsRef
        );


    allDocuments = [];


    snapshot.forEach(item => {

        allDocuments.push({

            id: item.id,

            ...item.data()

        });

    });


    renderDocuments();

    renderRecentDocuments();


    document.getElementById(
        "totalDocuments"
    ).textContent =
        allDocuments.length;

}


/* =========================================================
   RENDER DOCUMENTS
========================================================= */

function renderDocuments() {

    const container =
        document.getElementById(
            "documentsGrid"
        );


    const search =
        document.getElementById(
            "documentSearch"
        ).value
        .toLowerCase();


    container.innerHTML = "";


    const filtered =
        allDocuments.filter(document =>

            document.fileName
                ?.toLowerCase()
                .includes(search)

            ||

            document.category
                ?.toLowerCase()
                .includes(search)

        );


    if (filtered.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-folder-open"></i>

                <p>
                    No documents found.
                </p>

            </div>

        `;

        return;

    }


    filtered.forEach(document => {

        const card =
            document.createElement("div");


        card.className =
            "document-card";


        card.innerHTML = `

            <div class="document-top">

                <div class="document-icon">

                    <i class="${getFileIcon(
                        document.fileName
                    )}"></i>

                </div>

                <span class="status pass">

                    ${escapeHTML(
                        document.category
                    )}

                </span>

            </div>


            <h4>
                ${escapeHTML(
                    document.fileName
                )}
            </h4>


            <p>
                ${formatFileSize(
                    document.fileSize
                )}
            </p>


            <div class="document-actions">

                <a
                    href="${document.downloadURL}"
                    target="_blank"
                    class="view-document">

                    <i class="fa-solid fa-eye"></i>
                    View

                </a>


                <button
                    class="delete-document"
                    data-document-id="${document.id}">

                    <i class="fa-solid fa-trash"></i>
                    Delete

                </button>

            </div>

        `;


        container.appendChild(card);

    });


    document
        .querySelectorAll(
            "[data-document-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteDocument(
                    button.dataset.documentId
                )
            );

        });

}


/* =========================================================
   SEARCH DOCUMENTS
========================================================= */

document
    .getElementById("documentSearch")
    .addEventListener(
        "input",
        renderDocuments
    );


/* =========================================================
   DELETE DOCUMENT
========================================================= */

async function deleteDocument(id) {

    const documentData =
        allDocuments.find(
            item => item.id === id
        );


    if (!documentData) return;


    if (
        !confirm(
            "Delete this document permanently?"
        )
    ) {

        return;

    }


    try {

        /* Delete Storage file */

        if (documentData.storagePath) {

            const fileRef =
                ref(
                    storage,
                    documentData.storagePath
                );

            try {

                await deleteObject(
                    fileRef
                );

            } catch (storageError) {

                console.log(
                    "Storage file already missing."
                );

            }

        }


        /* Delete Firestore record */

        await deleteDoc(

            doc(
                db,
                "students",
                currentUser.uid,
                "documents",
                id
            )

        );


        await loadDocuments();


        showToast(
            "Document deleted."
        );


    } catch (error) {

        console.error(error);

        showToast(
            "Unable to delete document."
        );

    }

}


/* =========================================================
   RECENT DOCUMENTS
========================================================= */

function renderRecentDocuments() {

    const container =
        document.getElementById(
            "recentDocuments"
        );


    container.innerHTML = "";


    const recent =
        allDocuments.slice(0, 4);


    if (recent.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-folder-open"></i>

                <p>No documents uploaded.</p>

            </div>

        `;

        return;

    }


    recent.forEach(document => {

        const item =
            document.createElement("div");


        item.style.display = "flex";

        item.style.alignItems = "center";

        item.style.gap = "12px";

        item.style.padding = "10px 0";

        item.style.borderBottom =
            "1px solid #f0f0f5";


        item.innerHTML = `

            <div class="document-icon">

                <i class="${getFileIcon(
                    document.fileName
                )}"></i>

            </div>

            <div style="flex:1">

                <strong style="
                    display:block;
                    font-size:12px;
                    color:#303044;
                ">

                    ${escapeHTML(
                        document.fileName
                    )}

                </strong>

                <small style="
                    color:#85859a;
                ">

                    ${escapeHTML(
                        document.category
                    )}

                </small>

            </div>

        `;


        container.appendChild(item);

    });

}


/* =========================================================
   DASHBOARD RESULTS
========================================================= */

function renderDashboardResults() {

    const container =
        document.getElementById(
            "dashboardResults"
        );


    container.innerHTML = "";


    const recent =
        allResults.slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-chart-column"></i>

                <p>No result records available.</p>

            </div>

        `;

        return;

    }


    recent.forEach(result => {

        const item =
            document.createElement("div");


        item.style.display = "flex";

        item.style.justifyContent =
            "space-between";

        item.style.alignItems = "center";

        item.style.padding = "13px 0";

        item.style.borderBottom =
            "1px solid #f0f0f5";


        item.innerHTML = `

            <div>

                <strong style="
                    display:block;
                    color:#303044;
                    font-size:13px;
                ">

                    ${escapeHTML(
                        result.subjectName
                    )}

                </strong>

                <small style="
                    color:#85859a;
                ">

                    ${escapeHTML(
                        result.subjectCode
                    )}
                    • Semester
                    ${escapeHTML(
                        result.semester
                    )}

                </small>

            </div>

            <div style="text-align:right">

                <strong style="
                    display:block;
                    color:#303044;
                ">

                    ${result.obtainedMarks}/
                    ${result.maxMarks}

                </strong>

                <small style="
                    color:#18a875;
                ">

                    ${result.grade}

                </small>

            </div>

        `;


        container.appendChild(item);

    });

}


/* =========================================================
   PRINT RESULT
========================================================= */

document
    .getElementById("printResultBtn")
    .addEventListener("click", () => {

        window.print();

    });


/* =========================================================
   FILE ICON
========================================================= */

function getFileIcon(fileName) {

    const extension =
        fileName
            ?.split(".")
            .pop()
            .toLowerCase();


    if (extension === "pdf") {

        return "fa-solid fa-file-pdf";

    }

    if (
        extension === "doc" ||
        extension === "docx"
    ) {

        return "fa-solid fa-file-word";

    }

    if (
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "png"
    ) {

        return "fa-solid fa-file-image";

    }

    return "fa-solid fa-file";

}


/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(bytes) {

    if (!bytes) return "Unknown size";


    if (bytes < 1024) {

        return `${bytes} B`;

    }


    if (bytes < 1024 * 1024) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;

    }


    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    document.getElementById(
        "toastMessage"
    ).textContent =
        message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3000);

}


/* =========================================================
   FIREBASE ERROR MESSAGE
========================================================= */

function getFirebaseError(error) {

    switch (error.code) {

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/invalid-email":
            return "Please enter a valid email.";

        case "auth/weak-password":
            return "Password must contain at least 6 characters.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        default:
            return error.message;

    }

}


/* =========================================================
   SECURITY: ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (value === undefined ||
        value === null) {

        return "";

    }


    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}