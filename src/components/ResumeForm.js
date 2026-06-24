import React, { useState, useEffect } from 'react';
import './ResumeForm.css';

const ResumeForm = ({ onSubmit, onChange, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    yearsExperience: '',
    focusAreas: '',
    overview: '',
    experience: [{ company: '', position: '', duration: '', description: '' }],
    education: [{ year: '', degree: '', institution: '' }],
    projects: [{ name: '', duration: '', tools: '', teamSize: '', role: '', description: '' }],
    skills: [{ name: '', rating: 3 }],
    languages: '',
    domain: '',
    technologies: '',
    managerialExperience: '',
  });

  // When initialData is provided (from upload), populate the form
  useEffect(() => {
    if (initialData && (initialData.fullName || initialData.experience?.length > 0 || initialData.skills?.length > 0)) {
      setFormData(initialData);
      if (onChange) {
        onChange(initialData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const updateFormData = (newData) => {
    setFormData(newData);
    if (onChange) {
      onChange(newData);
    }
  };

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    const newData = {
      ...formData,
      [name]: value,
    };
    updateFormData(newData);
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...formData.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    updateFormData({ ...formData, experience: newExperience });
  };

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    updateFormData({ ...formData, education: newEducation });
  };

  const handleProjectChange = (index, field, value) => {
    const newProjects = [...formData.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    updateFormData({ ...formData, projects: newProjects });
  };

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...formData.skills];
    if (field === 'rating') {
      newSkills[index] = { ...newSkills[index], [field]: parseFloat(value) };
    } else {
      newSkills[index] = { ...newSkills[index], [field]: value };
    }
    updateFormData({ ...formData, skills: newSkills });
  };

  const addExperience = () => {
    updateFormData({
      ...formData,
      experience: [...formData.experience, { company: '', position: '', duration: '', description: '' }],
    });
  };

  const addEducation = () => {
    updateFormData({
      ...formData,
      education: [...formData.education, { year: '', degree: '', institution: '' }],
    });
  };

  const addProject = () => {
    updateFormData({
      ...formData,
      projects: [...formData.projects, { name: '', duration: '', tools: '', teamSize: '', role: '', description: '' }],
    });
  };

  const addSkill = () => {
    updateFormData({
      ...formData,
      skills: [...formData.skills, { name: '', rating: 3 }],
    });
  };

  const removeExperience = (index) => {
    updateFormData({
      ...formData,
      experience: formData.experience.filter((_, i) => i !== index),
    });
  };

  const removeEducation = (index) => {
    updateFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index),
    });
  };

  const removeProject = (index) => {
    updateFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== index),
    });
  };

  const removeSkill = (index) => {
    updateFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="resume-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Personal Information</h2>
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleBasicChange}
            required
            placeholder="e.g., Team Member Name"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Position/Title *</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleBasicChange}
              required
              placeholder="e.g., Full Stack Developer"
            />
          </div>
          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="text"
              name="yearsExperience"
              value={formData.yearsExperience}
              onChange={handleBasicChange}
              placeholder="e.g., 5+ years"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Focus Areas</label>
          <input
            type="text"
            name="focusAreas"
            value={formData.focusAreas}
            onChange={handleBasicChange}
            placeholder="e.g., Backend Development • System Architecture"
          />
        </div>
      </div>

      <div className="form-section">
        <h2>Overview</h2>
        <div className="form-group">
          <label>Professional Summary *</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleBasicChange}
            required
            placeholder="Write your professional overview..."
            rows="4"
          />
        </div>
      </div>

      <div className="form-section">
        <h2>Experience</h2>
        {formData.experience.map((exp, index) => (
          <div key={index} className="subsection">
            <h3>Experience {index + 1}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                  placeholder="e.g., InfoBeans"
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                  placeholder="e.g., Senior QA Engineer"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                value={exp.duration}
                onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                placeholder="e.g., Dec 2025 - Present"
              />
            </div>
            <div className="form-group">
              <label>Description/Achievements</label>
              <textarea
                value={exp.description}
                onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                placeholder="Describe your responsibilities and achievements..."
                rows="3"
              />
            </div>
            {formData.experience.length > 1 && (
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeExperience(index)}
              >
                Remove Experience
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-add" onClick={addExperience}>
          + Add Experience
        </button>
      </div>

      <div className="form-section">
        <h2>Education & Training</h2>
        {formData.education.map((edu, index) => (
          <div key={index} className="subsection">
            <h3>Education {index + 1}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Year</label>
                <input
                  type="text"
                  value={edu.year}
                  onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                  placeholder="e.g., 2011"
                />
              </div>
              <div className="form-group">
                <label>Degree</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                  placeholder="e.g., Bachelor of Engineering (EC)"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Institution</label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                placeholder="e.g., National College"
              />
            </div>
            {formData.education.length > 1 && (
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeEducation(index)}
              >
                Remove Education
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-add" onClick={addEducation}>
          + Add Education
        </button>
      </div>

      <div className="form-section">
        <h2>Projects</h2>
        {formData.projects.map((project, index) => (
          <div key={index} className="subsection">
            <h3>Project {index + 1}</h3>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => handleProjectChange(index, 'name', e.target.value)}
                placeholder="e.g., National College Admissions Consulting site"
              />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                value={project.duration}
                onChange={(e) => handleProjectChange(index, 'duration', e.target.value)}
                placeholder="e.g., Feb 2020 - June 2020"
              />
            </div>
            <div className="form-group">
              <label>Tools & Technologies</label>
              <input
                type="text"
                value={project.tools}
                onChange={(e) => handleProjectChange(index, 'tools', e.target.value)}
                placeholder="e.g., Node, HTML, MySQL, CSS, React, PayPal"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Team Size</label>
                <input
                  type="text"
                  value={project.teamSize}
                  onChange={(e) => handleProjectChange(index, 'teamSize', e.target.value)}
                  placeholder="e.g., 3"
                />
              </div>
              <div className="form-group">
                <label>Your Role</label>
                <input
                  type="text"
                  value={project.role}
                  onChange={(e) => handleProjectChange(index, 'role', e.target.value)}
                  placeholder="e.g., Project Lead"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={project.description}
                onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                placeholder="Describe the project and your contributions..."
                rows="3"
              />
            </div>
            {formData.projects.length > 1 && (
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeProject(index)}
              >
                Remove Project
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-add" onClick={addProject}>
          + Add Project
        </button>
      </div>

      <div className="form-section">
        <h2>Skills</h2>
        {formData.skills.map((skill, index) => (
          <div key={index} className="skill-item">
            <div className="form-group">
              <label>Skill Name</label>
              <input
                type="text"
                value={skill.name}
                onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                placeholder="e.g., JavaScript"
              />
            </div>
            <div className="form-group">
              <label>Rating (1-5)</label>
              <select
                value={skill.rating}
                onChange={(e) => handleSkillChange(index, 'rating', e.target.value)}
              >
                <option value={1}>1/5</option>
                <option value={2}>2/5</option>
                <option value={3}>3/5</option>
                <option value={3.5}>3.5/5</option>
                <option value={3.8}>3.8/5</option>
                <option value={4}>4/5</option>
                <option value={5}>5/5</option>
              </select>
            </div>
            {formData.skills.length > 1 && (
              <button
                type="button"
                className="btn-remove-skill"
                onClick={() => removeSkill(index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-add" onClick={addSkill}>
          + Add Skill
        </button>
      </div>

      <div className="form-section">
        <h2>Additional Information</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Technologies</label>
            <input
              type="text"
              name="technologies"
              value={formData.technologies}
              onChange={handleBasicChange}
              placeholder="e.g., AJAX, XML, JSON, Swagger, Postman, Jira, Visual Studio"
            />
          </div>
          <div className="form-group">
            <label>Managerial Experience</label>
            <input
              type="text"
              name="managerialExperience"
              value={formData.managerialExperience}
              onChange={handleBasicChange}
              placeholder="e.g., Project Delivery Management, Team Building"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Domain</label>
            <input
              type="text"
              name="domain"
              value={formData.domain}
              onChange={handleBasicChange}
              placeholder="e.g., Financial Services/Banking"
            />
          </div>
          <div className="form-group">
            <label>Languages</label>
            <input
              type="text"
              name="languages"
              value={formData.languages}
              onChange={handleBasicChange}
              placeholder="e.g., English, Hindi"
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-submit">
        Generate Resume Preview
      </button>
    </form>
  );
};

export default ResumeForm;
