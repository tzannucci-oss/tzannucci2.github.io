(() => {
    'use strict';
    /*
        Disclaimer 
        I used jQuery $() throughout this project to practice using it for future projects. 
        It is very similiar to using document.querySelector for selecting elements, 
        however jQuery provides more built-in methods for DOM manipulation, events, and animations.
        .slideUp and .slideDown was used in class
        .hide hides matching elements
        .prepend puts the newest elemnet at the top of the DOM list
        .html Get the HTML contents of the first element in the set of matched elements or set the HTML contents of every matched element.
        .text Get the combined text contents of each element in the set of matched elements, including their descendants, or set the text contents of the matched elements.
        .append opposite of .prepend
    */


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // for testing emails for being correct
    let intResumeCount = 0;

    //love arrays
    let arrJobs = [];
    let arrJobDetails = [];
    let arrSkills = [];
    let arrCertifications = [];
    let arrAwards = [];

    //jquery for sliding various pages. Basically from Login -> Register , Register -> Login, Dashboard -> Login
    $('#btnRegister').click(() => {
        $('#divLogin').slideUp(() => $('#divRegister').slideDown());
    });

    $('#btnCancel').click(() => {
        $('#divRegister').slideUp(() => $('#divLogin').slideDown());
    });

    $('#btnLogout').click(() => {
        localStorage.removeItem('objUser'); //localStorage and removeItem are both built into javascript. removeItem is a built-in method to delete a key/value pair 
        $('#resumeCount').text('0 Resumes'); //required so that new users don't see the total count of resumes
        $('#divDashboard').slideUp(() => $('#divLogin').show());
    });

    $('#btnSpecialThanks').click(()=>{
        Swal.fire({
            title: "Special Thanks to these libraries for making this all possible",
            text: "SweetAlert2, Jquery, Bootstrap, Google Gemini, dotenv, express, sqlite3 + dbrowser, cors, bcrypt, and Prof. Burchfield",
        });
    })

    //function that gets a user from local storage and converts if from json into an object
    function getUser() {
        return JSON.parse(localStorage.getItem('objUser'));
    }

    //function that just shows us the dash board with a warm welcome of the object users first name
    function showDashboard(objUser) {
        $('#divLogin').slideUp(() => {
            $('#divRegister').slideUp(() => {
                $('#divDashboard').slideDown(() => {
                    $('#lblWelcome').text(`Welcome, ${objUser.FirstName}!`);
                    loadAllResumeData();
                    loadResumes();
                });
            });
        });
    }

    //function that adds the Resume cards at the bottom of the dashboard
    function addResumeCard(objResume) {
        $('#emptyState').hide();

        //takes stored date string that looks like this 2026-05-02T14:30:00.000Z into a js object
        //then with toLocaleDateString(); turns that date object into a readable date string like 5/2/2026
        const strDate = new Date(objResume.CreatedDateTime).toLocaleDateString(); 
        
        //Actual card that is added + the ID and Date created
        const strCard = `
            <article class="card shadow-sm border-0 rounded-4">
                <div class="card-body p-4">
                    <div class="bg-white border rounded-4 p-4 p-md-5 shadow-sm">
                        <div class="text-center border-bottom pb-3 mb-4">
                            <h4 class="fw-bold text-uppercase mb-1">Generated Resume #${objResume.ResumeID}</h4>
                            <p class="text-muted small mb-0">Created via Resume Forge AI • ${strDate}</p>
                        </div>

                        <pre class="resume-text mb-0" style="white-space: pre-wrap; font-family: Georgia, 'Times New Roman', serif; font-size: 1rem; line-height: 1.6;">${objResume.GeneratedResume}</pre>
                    </div>

                    <button class="btn btn-outline-primary btn-sm btnCopyResume mt-3" type="button">
                        Copy Resume Text
                    </button>
                </div>
            </article>
        `;

        $('#resumeList').prepend(strCard); //puts the newest resume card at the top of the DOM list 
        intResumeCount++;
        $('#resumeCount').text(`${intResumeCount} Resumes`);
    }

    //function to load the resumes from previous creation
    async function loadResumes() {
        const objUser = getUser(); //finds user

        if (!objUser) return; //simple for if no user STOP

        intResumeCount = 0;

        //shown before you create your first resume aka a placeholder
        $('#resumeList').html(`
            <div id="emptyState" class="text-center py-5 bg-white rounded-4 border border-2 border-secondary-subtle">
                <p class="text-muted fw-semibold mb-0">No resumes yet. Generate one above.</p>
            </div>
        `);

        const res = await fetch(`/api/resumes/${objUser.UserID}`);
        const data = await res.json();

        //If successful reverse the resumes and add each one to the page
        if (data.Outcome) {
            data.Resumes.reverse().forEach(objResume => {
                addResumeCard(objResume);
            });
        }
    }

    //function for loading resume data that was stored previously
    async function loadAllResumeData() {
        const objUser = getUser();

        if (!objUser) return;

        //function calls for all of the data
        await loadJobs();
        await loadSkillCategories();
        await loadSkills();
        await loadCertifications();
        await loadAwards();
    }

    //function for loading jobs 
    async function loadJobs() {
        const objUser = getUser();
        const res = await fetch(`/api/jobs/${objUser.UserID}`);
        const data = await res.json();

        if (!data.Outcome) return;

        arrJobDetails = [];

        
        arrJobs = data.Jobs;

        $('#selJobForDetail').html(''); //clears everything so there is no duplicate data
        $('#divJobSelections').html('');
        $('#divJobDetailSelections').html('');

        arrJobs.forEach(objJob => {
            $('#selJobForDetail').append(`
                <option value="${objJob.JobID}">${objJob.JobTitle} - ${objJob.CompanyName}</option>
            `);

            $('#divJobSelections').append(`
                <div class="form-check">
                    <input class="form-check-input chkJob" type="checkbox" value="${objJob.JobID}" id="job${objJob.JobID}">
                    <label class="form-check-label" for="job${objJob.JobID}">${objJob.JobTitle} - ${objJob.CompanyName}</label>
                </div>
            `);

            loadJobDetails(objJob.JobID); //function call
        });
    }

    //function that loads job details 
    /*
        Loads all job responsibilities for a given JobID from the backend,
        stores them in an array, and creates checkbox elements
        so the user can select which responsibilities to include in the resume.
    */
    async function loadJobDetails(intJobID) {
        const res = await fetch(`/api/job-details/${intJobID}`);
        const data = await res.json();

        if (!data.Outcome) return;

        data.Details.forEach(objDetail => {
            arrJobDetails.push(objDetail);

            $('#divJobDetailSelections').append(`
                <div class="form-check">
                    <input class="form-check-input chkJobDetail" type="checkbox" value="${objDetail.DetailID}" id="detail${objDetail.DetailID}">
                    <label class="form-check-label" for="detail${objDetail.DetailID}">
                        ${objDetail.DetailText}
                    </label>
                </div>
            `);
        });
    }
    
    //IMPORTANT: any function after this point starting with load basically has the same premise just different parts of the dash 

    async function loadSkillCategories() {
        const objUser = getUser();
        const res = await fetch(`/api/skill-categories/${objUser.UserID}`);
        const data = await res.json();

        if (!data.Outcome) return;

        $('#selSkillCategory').html('');

        data.Categories.forEach(objCategory => {
            $('#selSkillCategory').append(`
                <option value="${objCategory.CategoryID}">${objCategory.CategoryName}</option>
            `);
        });
    }

    async function loadSkills() {
        const objUser = getUser();
        const res = await fetch(`/api/skills/${objUser.UserID}`);
        const data = await res.json();

        if (!data.Outcome) return;

        arrSkills = data.Skills;

        $('#divSkillSelections').html('');

        arrSkills.forEach(objSkill => {
            $('#divSkillSelections').append(`
                <div class="form-check">
                    <input class="form-check-input chkSkill" type="checkbox" value="${objSkill.SkillID}" id="skill${objSkill.SkillID}">
                    <label class="form-check-label" for="skill${objSkill.SkillID}">
                        ${objSkill.CategoryName}: ${objSkill.SkillName}
                    </label>
                </div>
            `);
        });
    }



    async function loadCertifications() {
        const objUser = getUser();
        const res = await fetch(`/api/certifications/${objUser.UserID}`);
        const data = await res.json();

        if (!data.Outcome) return;

        arrCertifications = data.Certifications;

        $('#divCertificationSelections').html('');

        arrCertifications.forEach(objCertification => {
            $('#divCertificationSelections').append(`
                <div class="form-check">
                    <input class="form-check-input chkCertification" type="checkbox" value="${objCertification.CertificationID}" id="cert${objCertification.CertificationID}">
                    <label class="form-check-label" for="cert${objCertification.CertificationID}">
                        ${objCertification.CertificationName}
                    </label>
                </div>
            `);
        });
    }

    async function loadAwards() {
        const objUser = getUser();
        const res = await fetch(`/api/awards/${objUser.UserID}`);
        const data = await res.json();

        if (!data.Outcome) return;

        arrAwards = data.Awards;

        $('#divAwardSelections').html('');

        arrAwards.forEach(objAward => {
            $('#divAwardSelections').append(`
                <div class="form-check">
                    <input class="form-check-input chkAward" type="checkbox" value="${objAward.AwardID}" id="award${objAward.AwardID}">
                    <label class="form-check-label" for="award${objAward.AwardID}">
                        ${objAward.AwardName}
                    </label>
                </div>
            `);
        });
    }

    $('#frmRegister').submit(async function (event) {
        event.preventDefault();

        const strEmail = document.querySelector('#txtRegisterEmail').value.trim().toLowerCase();
        const strPassword = document.querySelector('#txtRegisterPassword').value;
        const strFirstName = document.querySelector('#txtFirstName').value.trim();
        const strLastName = document.querySelector('#txtLastName').value.trim();

        //may be redundant but we like that it tells them exactly what they are missing or inputted in incorrectly

        let blnError = false;
        let strMessage = '';

        if (!emailRegex.test(strEmail)) {
            blnError = true;
            strMessage += '<p>You must enter a valid email.</p>';
        }

        if (strPassword.length < 8) {
            blnError = true;
            strMessage += '<p>Password must be at least 8 characters.</p>';
        }

        if (strFirstName.length < 1) {
            blnError = true;
            strMessage += '<p>You must enter a first name.</p>';
        }

        if (strLastName.length < 1) {
            blnError = true;
            strMessage += '<p>You must enter a last name.</p>';
        }

        if (blnError) {
            Swal.fire({ title: 'Oh Nooo', html: strMessage, icon: 'error' });
            return;
        }

        //object
        const objData = {
            firstName: strFirstName,
            lastName: strLastName,
            email: strEmail,
            password: strPassword
        };

        const res = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objData)
        });

        const data = await res.json();

        if (data.Outcome) {
            Swal.fire('Success', 'Account created!', 'success');
            $('#divRegister').hide();
            $('#divLogin').show();
        } else {
            Swal.fire('Error', data.Error, 'error');
        }
    });

    $('#frmLogin').submit(async function (event) {
        event.preventDefault();

        const objData = {
            email: document.querySelector('#txtLoginEmail').value.trim().toLowerCase(),
            password: document.querySelector('#txtLoginPassword').value
        };

        const res = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objData)
        });

        const data = await res.json();

        if (data.Outcome) {
            localStorage.setItem('objUser', JSON.stringify(data.User));
            showDashboard(data.User);
        } else {
            Swal.fire('Error', data.Error, 'error');
        }
    });


    //Sends the user's Gemini API key to the server to be saved in the database
    $('#btnSaveGeminiKey').click(async () => {
        const objUser = getUser();

        const res = await fetch('/api/settings/gemini-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: objUser.UserID,
                geminiApiKey: $('#txtGeminiApiKey').val()
            })
        });

        const data = await res.json();

        if (data.Outcome) {
            Swal.fire('Saved', 'API key saved.', 'success');
        } else {
            Swal.fire('Error', data.Error, 'error');
        }
    });

    //Sends new job data to the server to be saved for the current user
    $('#btnAddJob').click(async () => {
        const objUser = getUser();

        const res = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: objUser.UserID,
                jobTitle: $('#txtJobTitle').val(),
                companyName: $('#txtCompanyName').val(),
                startDate: $('#txtStartDate').val(),
                endDate: $('#txtEndDate').val()
            })
        });

        const data = await res.json();

        if (data.Outcome) {
            Swal.fire('Saved', 'Job added.', 'success');
            loadJobs();
        }
    });

    // Sends a new job responsibility/detail to the backend and refreshes the job details list
    $('#btnAddJobDetail').click(async () => {
        const res = await fetch('/api/job-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobID: $('#selJobForDetail').val(),
                detailText: $('#txtJobDetail').val()
            })
        });

        const data = await res.json();

        if (data.Outcome) {
            Swal.fire('Saved', 'Responsibility added.', 'success');
            $('#divJobDetailSelections').html('');
            arrJobDetails = [];
            loadJobs();
        }
    });

    //Sends a new skill category to the backend and reloads the category list on success
    $('#btnAddSkillCategory').click(async () => {
        const objUser = getUser();

        const res = await fetch('/api/skill-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: objUser.UserID,
                categoryName: $('#txtSkillCategory').val()
            })
        });

        const data = await res.json();

        if (data.Outcome) {
            Swal.fire('Saved', 'Skill category added.', 'success');
            loadSkillCategories();
        }
    });

    // Sends a new skill to the backend and reloads the skills list on success
    $('#btnAddSkill').click(async () => {
        const res = await fetch('/api/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                categoryID: $('#selSkillCategory').val(),
                skillName: $('#txtSkillName').val()
            })
        });

        const data = await res.json();

        if (data.Outcome) {
            Swal.fire('Saved', 'Skill added.', 'success');
            loadSkills();
        }
    });

    // Sends a new certification to the backend and reloads the certifications list on success
    $('#btnAddCertification').click(async () => {
        const objUser = getUser();

        const res = await fetch('/api/certifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: objUser.UserID,
                certificationName: $('#txtCertificationName').val(),
                organization: $('#txtCertificationOrganization').val(),
                dateEarned: $('#txtCertificationDate').val()
            })
        });

        const data = await res.json();

        if (data.Outcome) {
            Swal.fire('Saved', 'Certification added.', 'success');
            loadCertifications();
        }
    });

    // Sends a new award to the backend and reloads the awards list on success
    $('#btnAddAward').click(async () => {
        const objUser = getUser();

        const res = await fetch('/api/awards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: objUser.UserID,
                awardName: $('#txtAwardName').val(),
                awardingOrganization: $('#txtAwardOrganization').val(),
                dateEarned: $('#txtAwardDate').val()
            })
        });

        const data = await res.json();

        if (data.Outcome) {
            Swal.fire('Saved', 'Award added.', 'success');
            loadAwards();
        }
    });

    //This is a big one
    // Gathers selected jobs, details, skills, certifications, and awards,
    // sends them along with the target job description to the backend AI API,
    // then displays the generated resume when complete 

    $('#btnGenerateResume').click(async () => {
        const objUser = getUser();
        // IMPORTANT!!!! Used AI for the const belows check AI usage
        // .chkJob:checked → selects checked checkboxes
        // .map() → loops through each selected checkbox
        // .val() → gets the value (JobID)
        // Number() → converts string to number
        // .get() → converts jQuery object into a normal array  

        const arrSelectedJobIDs = $('.chkJob:checked').map(function () {
            return Number($(this).val());
        }).get();

        const arrSelectedDetailIDs = $('.chkJobDetail:checked').map(function () {
            return Number($(this).val());
        }).get();

        const arrSelectedSkillIDs = $('.chkSkill:checked').map(function () {
            return Number($(this).val());
        }).get();

        const arrSelectedCertificationIDs = $('.chkCertification:checked').map(function () {
            return Number($(this).val());
        }).get();

        const arrSelectedAwardIDs = $('.chkAward:checked').map(function () {
            return Number($(this).val());
        }).get();

        const arrSelectedJobs = arrJobs.filter(objJob => arrSelectedJobIDs.includes(objJob.JobID));
        const arrSelectedDetails = arrJobDetails.filter(objDetail => arrSelectedDetailIDs.includes(objDetail.DetailID));
        const arrSelectedSkills = arrSkills.filter(objSkill => arrSelectedSkillIDs.includes(objSkill.SkillID));
        const arrSelectedCertifications = arrCertifications.filter(objCertification => arrSelectedCertificationIDs.includes(objCertification.CertificationID));
        const arrSelectedAwards = arrAwards.filter(objAward => arrSelectedAwardIDs.includes(objAward.AwardID));

        Swal.fire({
            title: 'Generating Resume...',
            text: 'Please wait while Gemini creates your resume.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const res = await fetch('/api/ai/generate-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: objUser.UserID,
                targetJobDescription: $('#txtTargetJobDescription').val(),
                jobs: arrSelectedJobs,
                jobDetails: arrSelectedDetails,
                skills: arrSelectedSkills,
                certifications: arrSelectedCertifications,
                awards: arrSelectedAwards
            })
        });

        const data = await res.json();
        Swal.close();

        if (data.Outcome) {
            addResumeCard({
                ResumeID: data.ResumeID,
                GeneratedResume: data.ResumeText,
                CreatedDateTime: new Date().toISOString() //// Gets the current date/time and converts it to a standardized ISO string for storage
            });

            Swal.fire('Success', 'Resume generated!', 'success');
        } else {
            Swal.fire('Error', data.Error, 'error');
        }
    });

    //IMPORTANT HAD TO ASK AI HOW TO DO THIS CHECK AI USAGE
    $(document).on('click', '.btnCopyResume', function () {
        const strResumeText = $(this).closest('.card').find('.resume-text').text();

        navigator.clipboard.writeText(strResumeText).then(() => {
            Swal.fire('Copied', 'Resume text copied.', 'success');
        });
    });

    const objStoredUser = getUser();

    if (objStoredUser) {
        showDashboard(objStoredUser);
    }

})();