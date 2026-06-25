import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Footer,
  PageNumber,
} from 'docx';
import './ResumePreview.css';

const ResumePreview = ({ data, isEmbedded = false }) => {
  const resumeRef = useRef();
  const [busy, setBusy] = useState('');

  const safeName = () =>
    (data.fullName || 'InfoBeans_Profile').trim().replace(/\s+/g, '_');

  const renderCanvas = () =>
    html2canvas(resumeRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Slice the rendered profile into A4-page-height pieces, but only ever cut
  // in the GAPS between content blocks (in either column) so no text/section
  // is split across a page boundary.
  const buildSlices = async () => {
    const element = resumeRef.current;
    const canvas = await renderCanvas();
    const pxPerMm = canvas.width / 210;
    const pageHpx = 297 * pxPerMm;

    const ratio = canvas.height / element.scrollHeight; // DOM px -> canvas px
    const baseTop = element.getBoundingClientRect().top;
    const blocks = [];
    element
      .querySelectorAll(
        '.experience-item, .education-item, .project-item, .overview-text, ' +
          '.section-title, .sidebar-title, .skill-item, .sidebar-content, ' +
          '.resume-header, .resume-footer, .responsibilities-list li, .project-meta'
      )
      .forEach((n) => {
        const r = n.getBoundingClientRect();
        blocks.push({ top: (r.top - baseTop) * ratio, bottom: (r.bottom - baseTop) * ratio });
      });
    const insideAny = (y) => blocks.some((b) => y > b.top + 1 && y < b.bottom - 1);
    const candidates = Array.from(new Set(blocks.map((b) => Math.round(b.bottom)))).sort(
      (a, b) => a - b
    );

    const slices = [];
    let top = 0;
    let guard = 0;
    while (top < canvas.height - 2 && guard < 40) {
      const start = top;
      const limit = start + pageHpx;
      let cut;
      if (limit >= canvas.height) {
        cut = canvas.height;
      } else {
        cut = candidates
          .filter((y) => y > start + pageHpx * 0.25 && y <= limit && !insideAny(y))
          .pop();
        if (!cut) cut = limit; // no safe gap in window -> hard cut (rare)
      }
      const sliceH = Math.round(cut - start);
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = sliceH;
      const ctx = tmp.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tmp.width, sliceH);
      ctx.drawImage(canvas, 0, start, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      slices.push({ dataUrl: tmp.toDataURL('image/png'), wPx: canvas.width, hPx: sliceH });
      top = cut;
      guard += 1;
    }
    return { slices, pxPerMm };
  };

  const generatePDF = async () => {
    setBusy('pdf');
    try {
      const { slices, pxPerMm } = await buildSlices();
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      slices.forEach((s, i) => {
        if (i > 0) pdf.addPage();
        pdf.addImage(s.dataUrl, 'PNG', 0, 0, 210, s.hPx / pxPerMm);
      });
      pdf.save(`${safeName()}_Profile.pdf`);
    } finally {
      setBusy('');
    }
  };

  // A fully editable Word doc that mirrors the on-screen profile: two-column
  // table layout, brand colours, Lexend font — real text, not an image.
  const generateDOCX = async () => {
    setBusy('docx');
    try {
      const RED = 'EA1B3D';
      const DARK = '231F20';
      const GRAY = '373742';
      const LIGHT = '8A8A90';
      const F = 'Lexend';

      const run = (text, o = {}) => new TextRun({ text, font: F, ...o });
      const para = (children, o = {}) =>
        new Paragraph({ children: Array.isArray(children) ? children : [children], ...o });
      const title = (text) =>
        new Paragraph({ spacing: { before: 200, after: 90 }, children: [run(text, { color: RED, size: 26 })] });
      const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
      const noBorders = {
        top: nb, bottom: nb, left: nb, right: nb, insideHorizontal: nb, insideVertical: nb,
      };

      // ---- main column ----
      const main = [];
      if (data.overview) {
        main.push(title('Overview'));
        main.push(para(run(data.overview, { size: 20, color: GRAY }), { spacing: { after: 80 }, alignment: AlignmentType.LEFT }));
      }
      if (data.experience && data.experience.some((e) => e.company)) {
        main.push(title('Experience'));
        data.experience.forEach((e) => {
          if (!e.company) return;
          main.push(para(run(e.company, { bold: true, color: DARK, size: 22 })));
          if (e.position) main.push(para(run(e.position, { color: LIGHT, size: 19 })));
          if (e.duration) main.push(para(run(e.duration, { italics: true, color: LIGHT, size: 18 })));
          if (e.description) main.push(para(run(e.description, { size: 20, color: GRAY }), { spacing: { after: 150 } }));
          else main.push(para([], { spacing: { after: 80 } }));
        });
      }
      if (data.education && data.education.some((e) => e.degree || e.year)) {
        main.push(title('Education & Training'));
        data.education.forEach((e) => {
          if (!e.degree && !e.year) return;
          if (e.year) main.push(para(run(e.year, { color: DARK, size: 20 })));
          if (e.degree) main.push(para(run(e.degree, { bold: true, color: DARK, size: 20 })));
          if (e.institution) main.push(para(run(e.institution, { color: LIGHT, size: 18 }), { spacing: { after: 120 } }));
          else main.push(para([], { spacing: { after: 60 } }));
        });
      }
      if (data.projects && data.projects.some((p) => p.name)) {
        main.push(title('Projects'));
        data.projects.forEach((p) => {
          if (!p.name) return;
          main.push(para(run(p.name + (p.duration ? ` - ${p.duration}` : ''), { bold: true, color: DARK, size: 22, underline: {} })));
          const kv = (label, val) => {
            if (!val) return;
            main.push(para([run(label, { bold: true, color: DARK, size: 19 })]));
            main.push(para(run(val, { size: 20, color: GRAY })));
          };
          kv('Tools & Technologies', p.tools);
          kv('Team Size', p.teamSize);
          kv('Role', p.role);
          kv('Project Link', p.link);
          if (p.description) main.push(para(run(p.description, { size: 20, color: GRAY })));
          if (p.responsibilities && p.responsibilities.length) {
            main.push(para(run('Responsibilities and Achievements', { bold: true, color: DARK, size: 19 })));
            p.responsibilities.forEach((r) =>
              main.push(para(run(`•  ${r}`, { size: 20, color: GRAY })))
            );
          }
          main.push(para([], { spacing: { after: 120 } }));
        });
      }

      // ---- sidebar column ----
      const side = [];
      if (data.skills && data.skills.some((s) => s.name)) {
        side.push(title('Skills'));
        data.skills.forEach((s) => {
          if (!s.name) return;
          side.push(
            new Paragraph({
              spacing: { after: 90 },
              children: [
                run(s.name, { color: DARK, size: 21 }),
                new TextRun({ text: `(${s.rating}/5)`, break: 1, font: F, color: GRAY, size: 19 }),
              ],
            })
          );
        });
      }
      const sideBlock = (label, val) => {
        if (!val) return;
        side.push(title(label));
        side.push(para(run(val, { size: 20, color: GRAY })));
      };
      sideBlock('Tools & Technologies', data.technologies);
      sideBlock('Managerial Experience', data.managerialExperience);
      sideBlock('Domain', data.domain);
      sideBlock('Languages', data.languages);

      // ---- header (name + logo) ----
      let logo = null;
      try {
        const res = await fetch(`${process.env.PUBLIC_URL}/infobeans-logo.png`);
        logo = new Uint8Array(await res.arrayBuffer());
      } catch (e) {
        logo = null;
      }
      const headerLeft = [para(run(data.fullName || '', { bold: true, color: DARK, size: 44 }), { spacing: { after: 40 } })];
      if (data.position) headerLeft.push(para(run(data.position, { color: GRAY, size: 26 })));
      if (data.yearsExperience) headerLeft.push(para(run(data.yearsExperience, { color: GRAY, size: 18 })));
      if (data.focusAreas) headerLeft.push(para(run(data.focusAreas, { color: GRAY, size: 18 })));
      const headerRight = [
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [run('A PROUD MEMBER OF', { color: LIGHT, size: 12 })] }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            logo
              ? new ImageRun({ data: logo, transformation: { width: 150, height: 34 } })
              : run('InfoBeans', { bold: true, color: RED, size: 28 }),
          ],
        }),
      ];

      const cell = (children, width, margins) =>
        new TableCell({ width: { size: width, type: WidthType.DXA }, borders: noBorders, margins, children: children.length ? children : [para('')] });

      const headerTable = new Table({
        width: { size: 10466, type: WidthType.DXA },
        columnWidths: [6400, 4066],
        borders: noBorders,
        rows: [new TableRow({ children: [cell(headerLeft, 6400), cell(headerRight, 4066)] })],
      });

      const divider = new Paragraph({
        spacing: { after: 160 },
        border: { bottom: { color: 'C9C9CF', space: 1, style: BorderStyle.SINGLE, size: 6 } },
      });

      const bodyTable = new Table({
        width: { size: 10466, type: WidthType.DXA },
        columnWidths: [6400, 4066],
        borders: noBorders,
        rows: [
          new TableRow({
            children: [cell(main, 6400, { right: 300 }), cell(side, 4066, { left: 300 })],
          }),
        ],
      });

      const footer = new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: LIGHT })],
          }),
        ],
      });

      const doc = new Document({
        styles: { default: { document: { run: { font: F, size: 20, color: GRAY } } } },
        sections: [
          {
            properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
            footers: { default: footer },
            children: [headerTable, divider, bodyTable],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${safeName()}_Profile.docx`);
    } finally {
      setBusy('');
    }
  };

  const printResume = () => {
    window.print();
  };

  return (
    <div className={`resume-preview-container ${isEmbedded ? 'embedded' : ''}`}>
      <div className="preview-actions">
        <button className="btn-download" onClick={generatePDF} disabled={!!busy}>
          {busy === 'pdf' ? '…' : '📥 Download PDF'}
        </button>
        <button className="btn-download" onClick={generateDOCX} disabled={!!busy}>
          {busy === 'docx' ? '…' : '📝 Download DOCX'}
        </button>
        <button className="btn-print" onClick={printResume} disabled={!!busy}>
          🖨️ Print
        </button>
      </div>

      <div className={`resume-preview ${isEmbedded ? 'embedded-preview' : ''}`} ref={resumeRef}>
        {/* Header */}
        <div className="resume-header">
          <div className="header-top">
            <div className="header-left">
              <h1 className="name">{data.fullName}</h1>
              <p className="position">{data.position}</p>
              {data.yearsExperience && <p className="years">{data.yearsExperience}</p>}
              {data.focusAreas && <p className="focus-areas">{data.focusAreas}</p>}
            </div>
            <div className="header-right">
              <div className="logo-section">
                <p className="logo-text">A PROUD MEMBER OF</p>
                <img
                  className="logo-image"
                  src={`${process.env.PUBLIC_URL}/infobeans-logo.png`}
                  alt="InfoBeans - Creating Wow!"
                />
              </div>
            </div>
          </div>
          <div className="header-divider"></div>
        </div>

        {/* Main Content */}
        <div className="resume-content">
          <div className="main-column">
            {/* Overview */}
            {data.overview && (
              <section className="resume-section">
                <h2 className="section-title overview-title">Overview</h2>
                <p className="overview-text">{data.overview}</p>
              </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && data.experience.some(e => e.company) && (
              <section className="resume-section">
                <h2 className="section-title experience-title">Experience</h2>
                {data.experience.map((exp, index) => (
                  exp.company && (
                    <div key={index} className="experience-item">
                      <div className="experience-header">
                        <h3 className="company-name">{exp.company}</h3>
                        {exp.duration && <span className="duration">{exp.duration}</span>}
                      </div>
                      {exp.position && <p className="job-title">{exp.position}</p>}
                      {exp.description && <p className="description">{exp.description}</p>}
                    </div>
                  )
                ))}
              </section>
            )}

            {/* Education */}
            {data.education.length > 0 && data.education.some(e => e.year || e.degree) && (
              <section className="resume-section">
                <h2 className="section-title education-title">Education & Training</h2>
                {data.education.map((edu, index) => (
                  (edu.year || edu.degree) && (
                    <div key={index} className="education-item">
                      {edu.year && <p className="education-year">{edu.year}</p>}
                      {edu.degree && <p className="degree">{edu.degree}</p>}
                      {edu.institution && <p className="institution">{edu.institution}</p>}
                    </div>
                  )
                ))}
              </section>
            )}

            {/* Projects */}
            {data.projects.length > 0 && data.projects.some(p => p.name) && (
              <section className="resume-section">
                <h2 className="section-title projects-title">Projects</h2>
                {data.projects.map((project, index) => (
                  project.name && (
                    <div key={index} className="project-item">
                      <h3 className="project-name">
                        {project.name}
                        {project.duration && <span className="project-duration"> - {project.duration}</span>}
                      </h3>
                      {project.tools && (
                        <div className="project-meta">
                          <strong>Tools & Technologies</strong>
                          <p>{project.tools}</p>
                        </div>
                      )}
                      {project.teamSize && (
                        <div className="project-meta">
                          <strong>Team Size</strong>
                          <p>{project.teamSize}</p>
                        </div>
                      )}
                      {project.role && (
                        <div className="project-meta">
                          <strong>Role</strong>
                          <p>{project.role}</p>
                        </div>
                      )}
                      {project.link && (
                        <div className="project-meta">
                          <strong>Project Link</strong>
                          <p>{project.link}</p>
                        </div>
                      )}
                      {project.description && (
                        <p className="project-description">{project.description}</p>
                      )}
                      {project.responsibilities && project.responsibilities.length > 0 && (
                        <div className="project-meta">
                          <strong>Responsibilities and Achievements</strong>
                          <ul className="responsibilities-list">
                            {project.responsibilities.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="sidebar">
            {/* Skills */}
            {data.skills.length > 0 && data.skills.some(s => s.name) && (
              <section className="sidebar-section">
                <h2 className="sidebar-title">Skills</h2>
                <div className="skills-list">
                  {data.skills.map((skill, index) => (
                    skill.name && (
                      <div key={index} className="skill-item">
                        <span className="skill-name">{skill.name}</span>
                        <span className="skill-rating">({skill.rating}/5)</span>
                      </div>
                    )
                  ))}
                </div>
              </section>
            )}

            {/* Tools & Technologies */}
            {data.technologies && (
              <section className="sidebar-section">
                <h2 className="sidebar-title">Tools &amp; Technologies</h2>
                <p className="sidebar-content">{data.technologies}</p>
              </section>
            )}

            {/* Managerial Experience */}
            {data.managerialExperience && (
              <section className="sidebar-section">
                <h2 className="sidebar-title">Managerial Experience</h2>
                <p className="sidebar-content">{data.managerialExperience}</p>
              </section>
            )}

            {/* Domain */}
            {data.domain && (
              <section className="sidebar-section">
                <h2 className="sidebar-title">Domain</h2>
                <p className="sidebar-content">{data.domain}</p>
              </section>
            )}

            {/* Languages */}
            {data.languages && (
              <section className="sidebar-section">
                <h2 className="sidebar-title">Languages</h2>
                <p className="sidebar-content">{data.languages}</p>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="resume-footer">
          <img
            className="footer-swoosh"
            src={`${process.env.PUBLIC_URL}/infobeans-swoosh.jpg`}
            alt="InfoBeans"
          />
          <span className="footer-page">1</span>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
