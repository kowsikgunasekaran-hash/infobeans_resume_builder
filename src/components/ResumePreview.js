import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ResumePreview.css';

const ResumePreview = ({ data, isEmbedded = false }) => {
  const resumeRef = useRef();

  const generatePDF = async () => {
    const element = resumeRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    const safeName = (data.fullName || 'InfoBeans_Profile').trim().replace(/\s+/g, '_');
    pdf.save(`${safeName}_Profile.pdf`);
  };

  const printResume = () => {
    window.print();
  };

  return (
    <div className={`resume-preview-container ${isEmbedded ? 'embedded' : ''}`}>
      <div className="preview-actions">
        <button className="btn-download" onClick={generatePDF}>
          📥 Download PDF
        </button>
        <button className="btn-print" onClick={printResume}>
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
