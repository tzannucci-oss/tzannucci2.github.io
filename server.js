import 'dotenv/config';

import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/*
    Hopefully this doesn't look that bad.
    I formatted the strQuery's to look better from a developer standpoint
*/

const dbResumeForge = new sqlite3.Database('./database.db');

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
const model = "gemini-3-flash-preview";

// REGISTER
app.post('/api/users/register', async (req, res) => {
    const strEmail = req.body.email.toLowerCase();
    const strFirstName = req.body.firstName;
    const strLastName = req.body.lastName;
    const strPassword = req.body.password;

    if (!strEmail || !strFirstName || !strLastName || !strPassword) {
        return res.json({ Outcome: false, Error: 'All fields are required.' });
    }

    const strHash = await bcrypt.hash(strPassword, 10);

    const strQuery = `
        INSERT INTO tblUsers (Email, FirstName, LastName, PasswordHash)
        VALUES (?, ?, ?, ?)
    `;

    dbResumeForge.run(strQuery, [strEmail, strFirstName, strLastName, strHash], function (err) {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true });
    });
});

// LOGIN
app.post('/api/users/login', (req, res) => {
    const strEmail = req.body.email.toLowerCase();
    const strPassword = req.body.password;

    const strQuery = `SELECT * FROM tblUsers WHERE Email = ?`;

    dbResumeForge.get(strQuery, [strEmail], async (err, objUser) => {
        if (err || !objUser) {
            return res.json({ Outcome: false, Error: 'Invalid login.' });
        }

        const blnMatch = await bcrypt.compare(strPassword, objUser.PasswordHash);

        if (!blnMatch) {
            return res.json({ Outcome: false, Error: 'Invalid login.' });
        }

        res.json({
            Outcome: true,
            User: {
                UserID: objUser.UserID,
                FirstName: objUser.FirstName,
                LastName: objUser.LastName,
                Email: objUser.Email
            }
        });
    });
});

// SAVE GEMINI KEY
app.post('/api/settings/gemini-key', (req, res) => {
    const intUserID = req.body.userID;
    const strGeminiApiKey = req.body.geminiApiKey;

    const strQuery = `
        INSERT INTO tblSettings (UserID, GeminiApiKey)
        VALUES (?, ?)
    `;

    dbResumeForge.run(strQuery, [intUserID, strGeminiApiKey], function (err) {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true });
    });
});

// JOBS
app.post('/api/jobs', (req, res) => {
    const intUserID = req.body.userID;
    const strJobTitle = req.body.jobTitle;
    const strCompanyName = req.body.companyName;
    const strStartDate = req.body.startDate;
    const strEndDate = req.body.endDate;

    const strQuery = `
        INSERT INTO tblJobs (UserID, JobTitle, CompanyName, StartDate, EndDate)
        VALUES (?, ?, ?, ?, ?)
    `;

    dbResumeForge.run(strQuery, [
        intUserID,
        strJobTitle,
        strCompanyName,
        strStartDate,
        strEndDate
    ], function (err) {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, JobID: this.lastID });
    });
});

app.get('/api/jobs/:userID', (req, res) => {
    const intUserID = req.params.userID;
    const strQuery = `
        SELECT JobID, JobTitle, CompanyName, StartDate, EndDate
        FROM tblJobs
        WHERE UserID = ?
        ORDER BY JobID DESC
    `;

    dbResumeForge.all(strQuery, [intUserID], (err, arrJobs) => {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, Jobs: arrJobs });
    });
});

// JOB DETAILS
app.post('/api/job-details', (req, res) => {
    const intJobID = req.body.jobID;
    const strDetailedText = req.body.detailText;

    const strQuery = `
        INSERT INTO tblJobDetails (JobID, DetailText)
        VALUES (?, ?)
    `;

    dbResumeForge.run(strQuery, [intJobID, strDetailedText], function (err) {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, DetailID: this.lastID });
    });
});

app.get('/api/job-details/:jobID', (req, res) => {
    const intJobID = req.params.jobID;
    const strQuery = `
        SELECT DetailID, JobID, DetailText
        FROM tblJobDetails
        WHERE JobID = ?
        ORDER BY DetailID DESC
    `;

    dbResumeForge.all(strQuery, [intJobID], (err, arrDetails) => {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, Details: arrDetails });
    });
});

// SKILL CATEGORIES
app.post('/api/skill-categories', (req, res) => {
    const intUserID = req.body.userID;
    const strCategoryName = req.body.categoryName;
    const strQuery = `
        INSERT INTO tblSkillCategories (UserID, CategoryName)
        VALUES (?, ?)
    `;

    dbResumeForge.run(strQuery, [intUserID, strCategoryName], function (err) {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, CategoryID: this.lastID });
    });
});

app.get('/api/skill-categories/:userID', (req, res) => {
    const intUserID = req.params.userID;
    const strQuery = `
        SELECT CategoryID, CategoryName
        FROM tblSkillCategories
        WHERE UserID = ?
        ORDER BY CategoryName
    `;

    dbResumeForge.all(strQuery, [intUserID], (err, arrCategories) => {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, Categories: arrCategories });
    });
});

// SKILLS
app.post('/api/skills', (req, res) => {
    const intCategoryID = req.body.categoryID;
    const strSkillName = req.body.skillName;

    const strQuery = `
        INSERT INTO tblSkills (CategoryID, SkillName)
        VALUES (?, ?)
    `;

    dbResumeForge.run(strQuery, [intCategoryID, strSkillName], function (err) {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, SkillID: this.lastID });
    });
});

app.get('/api/skills/:userID', (req, res) => {
    const intUserID = req.params.userID;

    const strQuery = `
        SELECT tblSkills.SkillID, tblSkills.SkillName, tblSkillCategories.CategoryName
        FROM tblSkills
        INNER JOIN tblSkillCategories ON tblSkills.CategoryID = tblSkillCategories.CategoryID
        WHERE tblSkillCategories.UserID = ?
        ORDER BY tblSkillCategories.CategoryName, tblSkills.SkillName
    `;

    dbResumeForge.all(strQuery, [intUserID], (err, arrSkills) => {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, Skills: arrSkills });
    });
});

// CERTIFICATIONS
app.post('/api/certifications', (req, res) => {
    const intUserID = req.body.userID;
    const strCertificationName = req.body.certificationName;
    const strOrganization = req.body.organization;
    const strDateEarned = req.body.dateEarned;

    const strQuery = `
        INSERT INTO tblCertifications (UserID, CertificationName, Organization, DateEarned)
        VALUES (?, ?, ?, ?)
    `;

    dbResumeForge.run(strQuery, [
        intUserID,
        strCertificationName,
        strOrganization,
        strDateEarned
    ], function (err) {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, CertificationID: this.lastID });
    });
});

app.get('/api/certifications/:userID', (req, res) => {
    const intUserID = req.params.userID;

    const strQuery = `
        SELECT CertificationID, CertificationName, Organization, DateEarned
        FROM tblCertifications
        WHERE UserID = ?
        ORDER BY CertificationID DESC
    `;

    dbResumeForge.all(strQuery, [intUserID], (err, arrCertifications) => {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, Certifications: arrCertifications });
    });
});

// AWARDS
app.post('/api/awards', (req, res) => {
    const intUserID = req.body.userID;
    const strAwardName = req.body.awardName;
    const strAwardingOrganization = req.body.awardingOrganization;
    const strDateEarned = req.body.dateEarned;
    const strQuery = `
        INSERT INTO tblAwards (UserID, AwardName, AwardingOrganization, DateEarned)
        VALUES (?, ?, ?, ?)
    `;

    dbResumeForge.run(strQuery, [
        intUserID,
        strAwardName,
        strAwardingOrganization,
        strDateEarned
    ], function (err) {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, AwardID: this.lastID });
    });
});

app.get('/api/awards/:userID', (req, res) => {
    const intUserID = req.params.userID;
    const strQuery = `
        SELECT AwardID, AwardName, AwardingOrganization, DateEarned
        FROM tblAwards
        WHERE UserID = ?
        ORDER BY AwardID DESC
    `;

    dbResumeForge.all(strQuery, [intUserID], (err, arrAwards) => {
        if (err) {return res.json({ Outcome: false, Error: err.message })};
        res.json({ Outcome: true, Awards: arrAwards });
    });
});

// GENERATE RESUME
app.post('/api/ai/generate-resume', async (req, res) => {
    try {
        const intUserID = req.body.userID;
        const strTargetJob = req.body.targetJobDescription;
        const arrJobs = req.body.jobs;
        const arrJobDetails = req.body.jobDetails;
        const arrSkills = req.body.skills;
        const arrCertifications = req.body.certifications;
        const arrAwards = req.body.awards;

        //the prompt kinda looks stupid but it works
        const strPrompt = `
            Create a professional one-page resume for a student.

            Return ONLY the resume text.

            Rules:
            - Do not invent fake jobs, schools, dates, awards, certifications, or degrees.
            - Use placeholders like [Add Phone], [Add Date], or [Add Company] if needed.
            - Use strong action verbs.
            - Tailor the resume to the target job description.

            Use this structure:

            Name / Contact Placeholder

            Professional Summary

            Skills

            Experience

            Education

            Certifications

            Awards

            ---------------------------------------

            Target Job Description:
            ${strTargetJob}

            Selected Jobs:
            ${JSON.stringify(arrJobs, null, 2)}

            Selected Job Responsibilities:
            ${JSON.stringify(arrJobDetails, null, 2)}

            Selected Skills:
            ${JSON.stringify(arrSkills, null, 2)}

            Selected Certifications:
            ${JSON.stringify(arrCertifications, null, 2)}

            Selected Awards:
            ${JSON.stringify(arrAwards, null, 2)}
            `;

        const objResponse = await genAI.models.generateContent({
            model: model,
            contents: strPrompt
        });

        const strGeneratedResume = objResponse.text;

        const strInsertQuery = `
            INSERT INTO tblResumes
            (UserID, JobDescription, Skills, Experience, Education, CertificationsAwards, GeneratedResume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        dbResumeForge.run(
            strInsertQuery,
            [
                intUserID,
                strTargetJob,
                JSON.stringify(arrSkills),
                JSON.stringify(arrJobs),
                '',
                JSON.stringify(arrCertifications) + JSON.stringify(arrAwards),
                strGeneratedResume
            ],
            function (err) {
                if (err) return res.json({ Outcome: false, Error: err.message });

                res.json({
                    Outcome: true,
                    ResumeID: this.lastID,
                    ResumeText: strGeneratedResume
                });
            }
        );

    } catch (err) {
        res.status(500).json({ Outcome: false, Error: err.message });
    }
});

// GET SAVED RESUMES
app.get('/api/resumes/:userID', (req, res) => {
    const intUserID = req.params.userID;
    const strQuery = `
        SELECT ResumeID, GeneratedResume, CreatedDateTime
        FROM tblResumes
        WHERE UserID = ?
        ORDER BY ResumeID DESC
    `;

    dbResumeForge.all(strQuery, [intUserID], (err, arrResumes) => {
        if (err) return res.json({ Outcome: false, Error: err.message });
        res.json({ Outcome: true, Resumes: arrResumes });
    });
});

app.listen(port, () => {
    console.log(`ResumeForge running on http://localhost:${port}`);
});