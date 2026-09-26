document.addEventListener("DOMContentLoaded", function () {

    // ==================================================
    // FORM ELEMENTS
    // ==================================================

    const form = document.getElementById("applicationForm");

    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const step3 = document.getElementById("step3");

    const nextStep = document.getElementById("nextStep");
    const nextStep2 = document.getElementById("nextStep2");

    const prevStep = document.getElementById("prevStep");
    const backToStep2 = document.getElementById("backToStep2");

    const successMessage =
        document.getElementById("successMessage");

    const progressSteps =
        document.querySelectorAll(".progress-step");


    // ==================================================
    // TRACKING
    // ==================================================

    const startTime = Date.now();

    let clickCount = 0;
    let errorCount = 0;
    let backActionCount = 0;
    let helpRequestCount = 0;


    // Count clicks inside application form
    if (form) {

        form.addEventListener("click", function () {

            clickCount++;

        });

    }


    // ==================================================
    // HELPER FUNCTION
    // ==================================================

    function getValue(id) {

        const element = document.getElementById(id);

        if (!element) {
            return "";
        }

        return element.value.trim();

    }


    // ==================================================
    // SHOW STEP
    // ==================================================

    function showStep(stepNumber) {

        // Hide all steps
        if (step1) {
            step1.classList.remove("active");
        }

        if (step2) {
            step2.classList.remove("active");
        }

        if (step3) {
            step3.classList.remove("active");
        }


        // Update progress
        progressSteps.forEach(function (step, index) {

            step.classList.remove("active");

            if (index < stepNumber) {
                step.classList.add("active");
            }

        });


        // Show required step
        if (stepNumber === 1 && step1) {

            step1.classList.add("active");

        }

        if (stepNumber === 2 && step2) {

            step2.classList.add("active");

        }

        if (stepNumber === 3 && step3) {

            updateSummary();

            step3.classList.add("active");

        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // ==================================================
    // ERROR MESSAGE HELPER
    // ==================================================

    function setError(id, message) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent = message;

        }

    }


    // ==================================================
    // STEP 1 VALIDATION
    // ==================================================

    function validateStep1() {

        let valid = true;


        const name = getValue("name");
        const age = getValue("age");
        const location = getValue("location");


        // Clear previous errors
        setError("nameError", "");
        setError("ageError", "");
        setError("locationError", "");


        // Name
        if (name === "") {

            setError(
                "nameError",
                "Please enter your full name."
            );

            valid = false;

        }


        // Age
        if (age === "") {

            setError(
                "ageError",
                "Please enter your age."
            );

            valid = false;

        } else if (
            Number(age) < 1 ||
            Number(age) > 120
        ) {

            setError(
                "ageError",
                "Please enter a valid age."
            );

            valid = false;

        }


        // Location
        if (location === "") {

            setError(
                "locationError",
                "Please enter your city / district."
            );

            valid = false;

        }


        if (!valid) {

            errorCount++;

        }


        return valid;

    }


    // ==================================================
    // STEP 2 VALIDATION
    // ==================================================

    function validateStep2() {

        let valid = true;


        const category =
            getValue("category");

        const service =
            getValue("service");

        const description =
            getValue("description");


        // Clear errors
        setError("categoryError", "");
        setError("serviceError", "");
        setError("descriptionError", "");


        // Category
        if (category === "") {

            setError(
                "categoryError",
                "Please select a service category."
            );

            valid = false;

        }


        // Service
        if (service === "") {

            setError(
                "serviceError",
                "Please enter the required service."
            );

            valid = false;

        }


        // Description
        if (description === "") {

            setError(
                "descriptionError",
                "Please describe your requirement."
            );

            valid = false;

        }


        if (!valid) {

            errorCount++;

        }


        return valid;

    }


    // ==================================================
    // STEP 1 → STEP 2
    // ==================================================

    if (nextStep) {

        nextStep.addEventListener("click", function (event) {

            event.preventDefault();


            if (validateStep1()) {

                showStep(2);

            }

        });

    }


    // ==================================================
    // STEP 2 → STEP 3
    // ==================================================

    if (nextStep2) {

        nextStep2.addEventListener("click", function (event) {

            event.preventDefault();


            if (validateStep2()) {

                showStep(3);

            }

        });

    }


    // ==================================================
    // STEP 2 → STEP 1
    // ==================================================

    if (prevStep) {

        prevStep.addEventListener("click", function (event) {

            event.preventDefault();

            backActionCount++;

            showStep(1);

        });

    }


    // ==================================================
    // STEP 3 → STEP 2
    // ==================================================

    if (backToStep2) {

        backToStep2.addEventListener("click", function (event) {

            event.preventDefault();

            backActionCount++;

            showStep(2);

        });

    }


    // ==================================================
    // UPDATE REVIEW SUMMARY
    // ==================================================

    function updateSummary() {

        const summaryName =
            document.getElementById("summaryName");

        const summaryAge =
            document.getElementById("summaryAge");

        const summaryLocation =
            document.getElementById("summaryLocation");

        const summaryCategory =
            document.getElementById("summaryCategory");

        const summaryService =
            document.getElementById("summaryService");

        const summaryDescription =
            document.getElementById("summaryDescription");


        if (summaryName) {

            summaryName.textContent =
                getValue("name") || "—";

        }


        if (summaryAge) {

            summaryAge.textContent =
                getValue("age") || "—";

        }


        if (summaryLocation) {

            summaryLocation.textContent =
                getValue("location") || "—";

        }


        const categoryElement =
            document.getElementById("category");


        if (
            summaryCategory &&
            categoryElement &&
            categoryElement.selectedIndex >= 0
        ) {

            summaryCategory.textContent =
                categoryElement.options[
                    categoryElement.selectedIndex
                ].text;

        }


        if (summaryService) {

            summaryService.textContent =
                getValue("service") || "—";

        }


        if (summaryDescription) {

            summaryDescription.textContent =
                getValue("description") || "—";

        }

    }


    // ==================================================
    // DIFFICULTY ANALYSIS
    // ==================================================

    function calculateDifficulty(
        category,
        service,
        description
    ) {

        let score = 0;


        const categoryText =
            category.toLowerCase();


        // Category complexity
        if (
            categoryText.includes("document") ||
            categoryText.includes("education")
        ) {

            score += 1;

        }


        if (
            categoryText.includes("employment") ||
            categoryText.includes("job")
        ) {

            score += 2;

        }


        if (
            categoryText.includes("health") ||
            categoryText.includes("medical")
        ) {

            score += 2;

        }


        if (
            categoryText.includes("financial") ||
            categoryText.includes("finance")
        ) {

            score += 2;

        }


        if (
            categoryText.includes("government") ||
            categoryText.includes("service")
        ) {

            score += 2;

        }


        // Service complexity
        if (service.length > 30) {

            score += 1;

        }


        // Description complexity
        if (description.length > 80) {

            score += 2;

        } else if (description.length > 40) {

            score += 1;

        }


        // Final difficulty
        if (score <= 2) {

            return "LOW";

        }

        if (score <= 4) {

            return "MEDIUM";

        }

        return "HIGH";

    }


    // ==================================================
    // NEXT STEP
    // ==================================================

    function getNextStep(difficulty) {

        if (difficulty === "LOW") {

            return "Proceed with the required service.";

        }

        if (difficulty === "MEDIUM") {

            return "Review required documents and continue.";

        }

        return "Additional verification may be required.";

    }


    // ==================================================
    // RESULT MESSAGE
    // ==================================================

    function getResultMessage(difficulty) {

        if (difficulty === "LOW") {

            return "Your request appears straightforward. You can proceed with the recommended service.";

        }

        if (difficulty === "MEDIUM") {

            return "Your request may require additional details or documents. Please review the requirements carefully.";

        }

        return "Your request may require additional verification. Please check the required documents and service guidelines.";

    }


    // ==================================================
    // SHOW RESULT
    // ==================================================

    function showResult(data) {

        const resultStatus =
            document.getElementById("resultStatus");

        const resultService =
            document.getElementById("resultService");

        const resultCategory =
            document.getElementById("resultCategory");

        const resultDifficulty =
            document.getElementById("resultDifficulty");

        const resultNextStep =
            document.getElementById("resultNextStep");

        const resultMessage =
            document.getElementById("resultMessage");


        if (resultStatus) {

            resultStatus.textContent =
                data.status;

        }


        if (resultService) {

            resultService.textContent =
                data.service;

        }


        if (resultCategory) {

            resultCategory.textContent =
                data.categoryName;

        }


        if (resultDifficulty) {

            resultDifficulty.textContent =
                data.difficulty;

        }


        if (resultNextStep) {

            resultNextStep.textContent =
                data.nextStep;

        }


        if (resultMessage) {

            resultMessage.textContent =
                data.resultMessage;

        }

    }


    // ==================================================
    // FORM SUBMISSION
    // ==================================================

    if (form) {

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                // Validate Step 1
                if (!validateStep1()) {

                    showStep(1);

                    return;

                }


                // Validate Step 2
                if (!validateStep2()) {

                    showStep(2);

                    return;

                }


                // ======================================
                // GET FORM DATA
                // ======================================

                const name =
                    getValue("name");

                const age =
                    getValue("age");

                const location =
                    getValue("location");

                const service =
                    getValue("service");

                const description =
                    getValue("description");


                const categoryElement =
                    document.getElementById("category");


                let category = "";
                let categoryName = "—";


                if (categoryElement) {

                    category =
                        categoryElement.value;

                    if (
                        categoryElement.selectedIndex >= 0
                    ) {

                        categoryName =
                            categoryElement.options[
                                categoryElement.selectedIndex
                            ].text;

                    }

                }


                // ======================================
                // CALCULATE DIFFICULTY
                // ======================================

                const difficulty =
                    calculateDifficulty(
                        categoryName,
                        service,
                        description
                    );


                // ======================================
                // TASK TIME
                // ======================================

                const taskTime =
                    Math.max(
                        1,
                        Math.round(
                            (Date.now() - startTime) / 1000
                        )
                    );


                // ======================================
                // APPLICATION DATA
                // ======================================

                const applicationData = {

                    name: name,

                    age: age,

                    location: location,

                    category: category,

                    categoryName: categoryName,

                    service: service,

                    description: description,

                    difficulty: difficulty,

                    status: "Submitted",

                    taskTime: taskTime,

                    clicks: clickCount,

                    validationErrors: errorCount,

                    backActions: backActionCount,

                    helpRequests: helpRequestCount,

                    nextStep:
                        getNextStep(difficulty),

                    resultMessage:
                        getResultMessage(difficulty),

                    submittedAt:
                        new Date().toLocaleString()

                };


                // ======================================
                // SAVE DATA (localStorage first — this is
                // what dashboard.html actually reads from,
                // so it must always happen)
                // ======================================

                localStorage.setItem(
                    "adlaaApplication",
                    JSON.stringify(applicationData)
                );


                // ======================================
                // OPTIONALLY ALSO SEND TO API (if you
                // have a backend). Dashboard does not
                // depend on this succeeding.
                // ======================================

                fetch('/api/applications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(applicationData)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Application saved successfully:', data);
                })
                .catch(error => {
                    console.error('Error saving application to API (localStorage copy already saved):', error);
                });


                // ======================================
                // SHOW RESULT
                // ======================================

                showResult(applicationData);


                // Hide form
                form.style.display = "none";


                // Hide progress
                const progress =
                    document.querySelector(
                        ".progress-container"
                    );


                if (progress) {

                    progress.style.display =
                        "none";

                }


                // Hide header
                const formHeader =
                    document.querySelector(
                        ".form-header"
                    );


                if (formHeader) {

                    formHeader.style.display =
                        "none";

                }


                // Show success/result
                if (successMessage) {

                    successMessage.style.display =
                        "block";

                    successMessage.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
        );

    }


    // ==================================================
    // INITIAL STEP
    // ==================================================

    if (step1) {

        step1.classList.add("active");

    }

});