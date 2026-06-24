import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth/mammoth.browser';
import './FileUpload.css';

const FileUpload = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  /* ------------------------------------------------------------------
     TEXT EXTRACTION
     PDF: reconstruct true lines by grouping text items on the same row
     (pdf.js otherwise returns a flat token stream that destroys layout).
     DOCX: mammoth -> raw text (preserves paragraph breaks).
  ------------------------------------------------------------------ */
  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const allLines = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const rows = {};
      textContent.items.forEach((item) => {
        if (!item.str) return;
        const y = Math.round(item.transform[5]);
        const key = Math.round(y / 3) * 3; // bucket close baselines together
        if (!rows[key]) rows[key] = [];
        rows[key].push({ x: item.transform[4], str: item.str });
      });

      Object.keys(rows)
        .map(Number)
        .sort((a, b) => b - a) // top of page first (larger y)
        .forEach((key) => {
          const line = rows[key]
            .sort((a, b) => a.x - b.x)
            .map((t) => t.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (line) allLines.push(line);
        });
    }
    return allLines.join('\n');
  };

  const extractTextFromDOCX = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess(false);
    setFileName(file.name);

    try {
      let text = '';
      const name = file.name.toLowerCase();

      if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
        text = await extractTextFromPDF(file);
      } else if (name.endsWith('.docx')) {
        text = await extractTextFromDOCX(file);
      } else if (name.endsWith('.txt')) {
        text = await file.text();
      } else if (name.endsWith('.doc')) {
        throw new Error(
          'Legacy .doc files are not supported. Please save as .docx or .pdf and re-upload.'
        );
      } else {
        text = await file.text();
      }

      if (!text || !text.trim()) {
        throw new Error('No readable text found in this file.');
      }

      const parsedData = parseResume(text);
      onUpload(parsedData);
      setSuccess(true);
    } catch (err) {
      setError(
        err.message ||
          'Error reading file. Please try again. Make sure the file is valid.'
      );
      setSuccess(false);
      console.error('File upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  /* ------------------------------------------------------------------
     SHARED HELPERS
  ------------------------------------------------------------------ */
  const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
  const DATE_TOKEN = `(?:${MONTH}\\s*'?\\d{2,4}|\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|(?:19|20)\\d{2})`;
  const DATE_RANGE = new RegExp(
    `${DATE_TOKEN}\\s*(?:[-–—]|to)\\s*(?:${DATE_TOKEN}|present|current|till\\s*date|now|date)`,
    'i'
  );

  const BULLET = /^[•\-*‣◦·▪●○»]/;
  const ACRONYMS = /\b(It|Hr|Qa|Ai|Ml|Ui|Ux|Api|Rpo|Gcc|Sql|Aws|Devops|Ci\/cd|Crm|Itil|Sla|Eks|Ecs|Rfb|Itsm|Tcp)\b/g;

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\b(Of|And|The|For|In|To|As)\b/g, (m) => m.toLowerCase())
      .replace(ACRONYMS, (m) => m.toUpperCase());

  const ROLE_KEYWORDS =
    /\b(engineer|developer|analyst|architect|manager|designer|consultant|specialist|recruiter|acquisition|lead|administrator|scientist|tester|qa|devops|programmer|director|officer|executive|associate|support|intern|internship|trainee|coordinator)\b/i;

  // A line that opens a job: contains a real date range, isn't a bullet.
  const extractDuration = (line) => {
    const paren = line.match(/\(([^)]*\d[^)]*)\)/);
    if (paren && DATE_RANGE.test(paren[1])) return paren[1].trim();
    const range = line.match(DATE_RANGE);
    return range ? range[0].trim() : '';
  };

  const isExperienceHeader = (line) =>
    !BULLET.test(line) && !!extractDuration(line) && line.length < 160;

  /* ------------------------------------------------------------------
     SECTION SPLITTING
     Detect labelled headers AND implicit experience blocks (a date-range
     line with no "Experience" header above it, as in many real resumes).
     Returns an ordered `tagged` list plus a `sections` map.
  ------------------------------------------------------------------ */
  const SECTION_HEADERS = {
    summary: /^(profile\s*summary|professional\s*summary|career\s*summary|summary|profile|overview|about(?:\s*me)?|objective)\s*:?$/i,
    experience: /^(work\s*experience|professional\s*experience|experience|employment(?:\s*history)?|work\s*history|career\s*history)\s*:?$/i,
    education: /^(education(?:\s*&?\s*training)?|academic(?:\s*details)?|qualifications?|educational\s*qualifications?)\s*:?$/i,
    skills: /^(key\s*skills|technical\s*skills|core\s*skills|it\s*skills|professional\s*skills|skills?(?:\s*&\s*expertise)?|skill\s*set)\s*:?$/i,
    projects: /^(projects?|key\s*projects|notable\s*projects|project\s*details)\s*:?$/i,
    languages: /^(languages?(?:\s*known)?)\s*:?$/i,
    technologies: /^(tools?\s*&?\s*technologies|technologies|technical\s*(?:hiring\s*)?expertise|tech\s*stack)\s*:?$/i,
    domain: /^(domain|industry|domains?)\s*:?$/i,
    additional: /^(additional\s*details?|other\s*details?|miscellaneous|personal\s*details?)\s*:?$/i,
  };

  // Sections whose content must never be mistaken for a job block.
  const NON_EXPERIENCE = new Set([
    'education',
    'skills',
    'projects',
    'languages',
    'technologies',
    'additional',
  ]);

  const splitIntoSections = (lines) => {
    const sections = { _preamble: [] };
    const tagged = [];
    let current = '_preamble';

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      let matched = null;
      for (const [key, re] of Object.entries(SECTION_HEADERS)) {
        if (re.test(line)) {
          matched = key;
          break;
        }
      }

      if (matched) {
        current = matched;
        if (!sections[current]) sections[current] = [];
        return;
      }

      // Implicit experience: a date-range line appearing before any explicit
      // "Experience" header flips us into the experience block.
      if (
        isExperienceHeader(line) &&
        !NON_EXPERIENCE.has(current) &&
        current !== 'experience'
      ) {
        current = 'experience';
      }

      if (!sections[current]) sections[current] = [];
      sections[current].push(line);
      tagged.push({ section: current, line });
    });

    return { sections, tagged };
  };

  const parseResume = (text) => {
    const lines = text
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter((l) => l.length > 0);

    const { sections, tagged } = splitIntoSections(lines);
    const preamble = sections._preamble || [];

    const expResult = extractExperience(tagged);
    const skills = extractSkills(sections.skills, text);

    const technologies =
      (sections.technologies || []).join(', ') || expResult.technologies;
    const domain = (sections.domain || []).join(', ') || expResult.domain;

    return {
      fullName: extractName(preamble),
      position: extractPosition(preamble, sections, text),
      yearsExperience: extractYears(text),
      focusAreas: '',
      overview: extractOverview(sections.summary, lines),
      experience: expResult.experiences,
      education: extractEducation(sections.education || []),
      projects: extractProjects(sections.projects || []),
      skills,
      languages: extractLanguages(sections.languages, text),
      domain,
      technologies,
      managerialExperience: '',
    };
  };

  /* ----------------------------- field extractors ----------------------------- */

  const extractName = (preamble) => {
    for (let i = 0; i < Math.min(5, preamble.length); i++) {
      const line = preamble[i].replace(/^name\s*[:-]\s*/i, '').trim();
      const words = line.split(/\s+/);
      if (
        line.length >= 3 &&
        line.length <= 45 &&
        !line.includes('@') &&
        !/\d/.test(line) &&
        !/resume|curriculum|vitae|\bcv\b|email|phone|mobile|contact/i.test(line) &&
        words.length >= 1 &&
        words.length <= 5 &&
        !ROLE_KEYWORDS.test(line)
      ) {
        return line === line.toUpperCase() ? toTitleCase(line) : line;
      }
    }
    return preamble[0] ? toTitleCase(preamble[0].replace(/^name\s*[:-]\s*/i, '')) : '';
  };

  const extractPosition = (preamble, sections, text) => {
    // 1) A top-of-document line that reads like a job title.
    for (let i = 0; i < Math.min(5, preamble.length); i++) {
      const line = preamble[i];
      if (
        ROLE_KEYWORDS.test(line) &&
        !line.includes('@') &&
        line.length <= 70 &&
        !/\d{4}/.test(line)
      ) {
        return line === line.toUpperCase() ? toTitleCase(line) : line;
      }
    }
    // 2) Explicit "Designation: ..." style.
    const explicit = text.match(
      /(?:Position|Title|Designation|Current\s*Role)\s*[:-]\s*([^\n]+)/i
    );
    if (explicit) return explicit[1].trim();
    // 3) The most recent job's role, if we found one.
    return '';
  };

  const extractYears = (text) => {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(\+)?\s*(?:years?|yrs)/i);
    if (!match) return '';
    const plus = match[2] || !match[1].includes('.') ? '+' : '';
    return `${match[1]}${plus} years of Industry Experience`;
  };

  const extractOverview = (summaryLines, allLines) => {
    if (summaryLines && summaryLines.length) {
      return summaryLines
        .map((l) => l.replace(BULLET, '').trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    const candidate = allLines.find((l) => l.length > 80);
    return candidate ? candidate.trim() : '';
  };

  // Split a cleaned header into {company, position} using role keywords.
  const splitCompanyRole = (header) => {
    const parts = header.split(/\s+[–—-]\s+|\s+\|\s+|\s+at\s+/i);
    if (parts.length >= 2) {
      const roleIdx = parts.findIndex((p) => ROLE_KEYWORDS.test(p));
      const nonRoleIdx = parts.findIndex((p) => !ROLE_KEYWORDS.test(p));
      // Only split when exactly one side looks like a role.
      if (roleIdx !== -1 && nonRoleIdx !== -1 && roleIdx !== nonRoleIdx) {
        return {
          position: parts[roleIdx].trim(),
          company: parts
            .filter((_, i) => i !== roleIdx)
            .join(' – ')
            .trim(),
        };
      }
    }
    return { company: header, position: '' };
  };

  const extractExperience = (tagged) => {
    const experiences = [];
    const domains = new Set();
    const techs = new Set();
    let cur = null;

    const finalize = (exp) => {
      if (!exp) return;
      const desc = [];
      if (exp._client) desc.push(`Client: ${exp._client}.`);
      desc.push(...exp._desc);
      exp.description = desc.join(' ').replace(/\s+/g, ' ').trim();
      delete exp._desc;
      delete exp._client;
    };

    tagged.forEach(({ section, line }) => {
      if (isExperienceHeader(line) && section === 'experience') {
        finalize(cur);
        const duration = extractDuration(line);
        let header = line.replace(duration, '');
        header = header
          .replace(/\(\s*[–—-]?\s*\)/g, '')
          .replace(/[–—-]\s*$/, '')
          .replace(/^['‘’"]\s*/, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        const { company, position } = splitCompanyRole(header);
        cur = {
          company: company || header || 'Company',
          position,
          duration,
          description: '',
          link: '',
          responsibilities: [],
          _desc: [],
          _client: '',
        };
        experiences.push(cur);
        return;
      }

      if (section !== 'experience') {
        // Left the experience block.
        finalize(cur);
        cur = null;
        return;
      }

      if (!cur) return;

      const label = line.match(
        /^(domain|client|technologies?|programming\s*languages?|environment|tools?|database|language)\s*[:-]\s*(.*)$/i
      );
      if (label) {
        const key = label[1].toLowerCase();
        const val = label[2].trim();
        if (!val) return;
        if (key.startsWith('domain')) domains.add(val);
        else if (key.startsWith('client')) cur._client = val;
        else
          val
            .split(/[,/]| and /i)
            .map((t) => t.trim())
            .filter((t) => t.length > 1)
            .forEach((t) => techs.add(t));
        return;
      }

      if (/^roles?\s*&?\s*responsibilit/i.test(line)) return; // sub-heading
      cur._desc.push(line.replace(BULLET, '').trim());
    });

    finalize(cur);

    return {
      experiences: experiences.slice(0, 8),
      domain: Array.from(domains).join(', '),
      technologies: dedupeJoin(Array.from(techs)),
    };
  };

  const dedupeJoin = (arr) => {
    const seen = new Set();
    const out = [];
    arr.forEach((t) => {
      const k = t.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(t);
      }
    });
    return out.join(', ');
  };

  const extractEducation = (eduLines) => {
    const education = [];
    eduLines.forEach((line) => {
      if (line.length < 3) return;
      const clean = line.replace(BULLET, '').trim();
      if (clean.length < 3) return;
      const yearMatch = clean.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? yearMatch[0] : '';
      let rest = clean
        .replace(/\b(19|20)\d{2}\b/g, '')
        .replace(/[-–—,]\s*$/, '')
        .trim();
      const parts = rest.split(/\s*[,–—]\s*/);
      const degree = parts[0] ? parts[0].trim() : rest;
      const institution = parts.length > 1 ? parts.slice(1).join(', ').trim() : '';
      if (degree) education.push({ year, degree, institution });
    });
    return education;
  };

  const extractProjects = (projLines) => {
    const projects = [];
    let current = null;

    projLines.forEach((line) => {
      const headerMatch = line.match(/^project\s*\d*\s*[-–:]?\s*(.*)/i);
      const isBullet = BULLET.test(line);

      if (headerMatch && !isBullet) {
        if (current) projects.push(current);
        const duration = extractDuration(line);
        let nm = headerMatch[1] || line;
        if (duration) nm = nm.replace(duration, '').replace(/[-–—]\s*$/, '').trim();
        current = {
          name: nm || line,
          duration,
          tools: '',
          teamSize: '',
          role: '',
          link: '',
          description: '',
          responsibilities: [],
        };
      } else if (current) {
        if (/^tools?\s*&?\s*tech/i.test(line)) {
          current.tools = line.replace(/^tools?\s*&?\s*technologies?\s*:?\s*/i, '');
        } else if (/^team\s*size/i.test(line)) {
          current.teamSize = line.replace(/^team\s*size\s*:?\s*/i, '');
        } else if (/^role/i.test(line)) {
          current.role = line.replace(/^role\s*:?\s*/i, '');
        } else if (/^(project\s*)?link/i.test(line)) {
          current.link = line.replace(/^(project\s*)?link\s*:?\s*/i, '');
        } else if (isBullet) {
          current.responsibilities.push(line.replace(BULLET, '').trim());
        } else {
          current.description = (current.description + ' ' + line).trim();
        }
      } else if (isBullet || line.length > 8) {
        projects.push({
          name: line.replace(BULLET, '').trim(),
          duration: '',
          tools: '',
          teamSize: '',
          role: '',
          link: '',
          description: '',
          responsibilities: [],
        });
      }
    });

    if (current) projects.push(current);
    return projects.slice(0, 6);
  };

  const KNOWN_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go',
    'Rust', 'Kotlin', 'React', 'ReactJS', 'Angular', 'Vue.js', 'Node.js', 'HTML',
    'CSS', 'jQuery', 'Spring', 'Spring Boot', '.NET Core', '.NET', 'SQL',
    'SQL Server', 'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'Redis', 'Docker',
    'Kubernetes', 'AWS', 'Azure', 'Git', 'Jira', 'Jenkins', 'Unix', 'Linux',
    'Shell Scripting', 'Selenium', 'Pytest', 'ITIL', 'ServiceNow', 'Autosys',
    'Splunk', 'Dynatrace', 'Workday', 'Salesforce', 'CI/CD', 'Agile',
  ];

  const SKILL_LABEL = /^(database|operating\s*system|tools?|languages?|programming\s*languages?|technologies?|skills?|platforms?|frameworks?|methodolog(?:y|ies))\s*[:-]\s*/i;

  const extractSkills = (skillLines, text) => {
    const skills = [];
    const seen = new Set();
    const add = (raw) => {
      const s = raw.replace(BULLET, '').replace(/\.$/, '').trim();
      const key = s.toLowerCase();
      if (s.length >= 2 && s.length <= 40 && !seen.has(key)) {
        seen.add(key);
        skills.push({ name: s, rating: 4 });
      }
    };

    if (skillLines && skillLines.length) {
      skillLines.forEach((line) => {
        const cleaned = line.replace(SKILL_LABEL, '');
        cleaned.split(/[,•\n]|·/).forEach(add);
      });
    }

    if (skills.length < 4) {
      KNOWN_SKILLS.forEach((skill) => {
        if (text.toLowerCase().includes(skill.toLowerCase())) add(skill);
      });
    }

    return skills.slice(0, 16);
  };

  const extractLanguages = (langLines, text) => {
    if (langLines && langLines.length) {
      return langLines
        .join(', ')
        .replace(/^languages?(?:\s*known)?\s*[:-]?\s*/i, '')
        .trim();
    }
    // Fallback: a line that STARTS with "Languages:" (so "Programming
    // languages:" is never mistaken for spoken languages).
    const line = text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => /^languages?(?:\s*known)?\s*[:-]/i.test(l));
    if (!line) return '';
    return line.replace(/^languages?(?:\s*known)?\s*[:-]\s*/i, '').trim();
  };

  return (
    <div className="file-upload-container">
      <div className="upload-box">
        <h2>Upload Your Resume</h2>
        <div className="upload-area">
          <input
            type="file"
            id="file-input"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            disabled={uploading}
            className="file-input"
          />
          <label htmlFor="file-input" className="upload-label">
            <div className="upload-icon">📄</div>
            <h3>Choose a file or drag and drop</h3>
            <p>Supported formats: PDF, DOCX, TXT</p>
            {fileName && <p className="file-name">Selected: {fileName}</p>}
          </label>
        </div>

        {uploading && (
          <div className="loading">
            <p>Parsing your resume...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="success-message">
            <p>✅ Resume uploaded successfully! Redirecting to preview...</p>
          </div>
        )}

        <div className="info-box">
          <h3>What happens next?</h3>
          <ul>
            <li>Works with most resume layouts — PDF or Word (.docx)</li>
            <li>Details are mapped into the InfoBeans profile template</li>
            <li>Review, edit and score skills before downloading</li>
            <li>Download a branded PDF that matches the InfoBeans format</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
