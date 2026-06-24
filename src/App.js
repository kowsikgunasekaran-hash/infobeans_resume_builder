import React, { useState } from 'react';
import './App.css';
import ResumeBuilder from './components/ResumeBuilder';
import CertificateBuilder from './components/CertificateBuilder';

function App() {
  const [tab, setTab] = useState('resume'); // 'resume' | 'certificate'

  return (
    <div className="app-container">
      <header className="app-header">
        <img
          className="app-logo"
          src={`${process.env.PUBLIC_URL}/infobeans-logo.png`}
          alt="InfoBeans"
        />
        <h1>InfoBeans Studio</h1>
        <p>Build branded resume profiles &amp; award certificates</p>
      </header>

      <div className="main-content">
        <div className="tabs">
          <button
            className={`tab-button ${tab === 'resume' ? 'active' : ''}`}
            onClick={() => setTab('resume')}
          >
            📄 Resume Profile
          </button>
          <button
            className={`tab-button ${tab === 'certificate' ? 'active' : ''}`}
            onClick={() => setTab('certificate')}
          >
            🏆 Award Certificate
          </button>
        </div>

        {tab === 'resume' ? <ResumeBuilder /> : <CertificateBuilder />}
      </div>
    </div>
  );
}

export default App;
