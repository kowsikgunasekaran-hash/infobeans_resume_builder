import React, { useState } from 'react';
import ResumeForm from './ResumeForm';
import ResumePreview from './ResumePreview';
import FileUpload from './FileUpload';

const emptyResume = {
  fullName: '',
  position: '',
  yearsExperience: '',
  focusAreas: '',
  overview: '',
  experience: [],
  education: [],
  projects: [],
  skills: [],
  languages: '',
  domain: '',
  technologies: '',
  managerialExperience: '',
};

const ResumeBuilder = () => {
  const [resumeData, setResumeData] = useState(emptyResume);
  const [mode, setMode] = useState('form'); // 'form' | 'upload'
  const [dataUploaded, setDataUploaded] = useState(false);

  const handleFormChange = (data) => setResumeData(data);
  const handleFormSubmit = (data) => setResumeData(data);

  const handleFileUpload = (data) => {
    setResumeData(data);
    setDataUploaded(true);
    setMode('form'); // jump to the editable form + live preview
  };

  return (
    <div className="builder">
      <div className="subtabs">
        <button
          className={`subtab ${mode === 'form' ? 'active' : ''}`}
          onClick={() => setMode('form')}
        >
          ✍️ Fill / Edit Details
        </button>
        <button
          className={`subtab ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => setMode('upload')}
        >
          📤 Upload Resume
        </button>
      </div>

      {mode === 'form' ? (
        <div className="form-preview-container">
          <div className="form-section-wrapper">
            <ResumeForm
              onSubmit={handleFormSubmit}
              onChange={handleFormChange}
              initialData={resumeData}
            />
          </div>
          {(resumeData.fullName || dataUploaded) && (
            <div className="preview-section-wrapper">
              <div className="preview-sticky">
                <ResumePreview data={resumeData} isEmbedded={true} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="content-area">
          <FileUpload onUpload={handleFileUpload} />
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
