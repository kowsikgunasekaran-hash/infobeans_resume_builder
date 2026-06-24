# InfoBeans Resume Builder

A professional React application for creating beautifully formatted resumes based on the InfoBeans template. Users can either fill out a detailed form or upload an existing resume for parsing and formatting.

## Features

✨ **Two Input Methods:**
- **Form Input**: Fill out a comprehensive form with all resume details
- **Resume Upload**: Upload an existing resume (PDF, DOC, DOCX, TXT) for automatic parsing

📄 **Professional Formatting:**
- InfoBeans template styling with logo, header, and footer
- Responsive two-column layout (content + skills sidebar)
- Professional typography and color scheme
- Print-ready formatting

⬇️ **Export Options:**
- Download as PDF with high-quality formatting
- Print directly to paper or PDF printer
- Fully formatted HTML preview

🎨 **Customizable Sections:**
- Personal Information
- Professional Overview
- Work Experience
- Education & Training
- Projects (with details and tools)
- Skills (with 1-5 rating system)
- Technologies
- Managerial Experience
- Domain Expertise
- Languages

## Installation

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/
   - Choose the LTS (Long Term Support) version

2. **Install Dependencies**
   ```bash
   npm install
   ```

## Running the Application

Start the development server:
```bash
npm start
```

The application will open in your default browser at `http://localhost:3000`

## How to Use

### Method 1: Form Input
1. Click on the **"Form Input"** tab
2. Fill in all the required and optional fields
3. Use the **"+ Add..."** buttons to add multiple entries for experience, education, projects, and skills
4. Click **"Generate Resume Preview"** to see your formatted resume
5. Download or print from the preview

### Method 2: Resume Upload
1. Click on the **"Upload Resume"** tab
2. Click the upload area or drag and drop your resume file
3. The system will parse the resume and extract key information
4. Review the extracted data in the form that appears
5. Edit any information as needed
6. Click **"Generate Resume Preview"** to see your formatted resume

## Skills Rating Scale
- **3/5**: Intermediate
- **3.5/5**: Intermediate-Advanced
- **3.8/5**: Advanced
- **4/5**: Advanced
- **5/5**: Expert

## Supported File Formats
- **PDF** (.pdf)
- **Word Documents** (.doc, .docx)
- **Text Files** (.txt)

## Template Features

The generated resume follows the InfoBeans professional template with:

### Header Section
- Candidate name and position
- Years of experience
- Focus areas
- InfoBeans logo and branding

### Content Layout
**Left Column (70%):**
- Professional Overview
- Work Experience
- Education & Training
- Projects

**Right Sidebar (30%):**
- Skills with ratings
- Technologies
- Managerial Experience
- Domain Expertise
- Languages

### Footer
- Professional footer with page information

## Tips for Best Results

1. **Complete Information**: Fill in as much detail as possible for better formatting
2. **Consistent Formatting**: Use consistent date formats (e.g., "Dec 2025 - Present")
3. **Clear Descriptions**: Write clear, concise descriptions of responsibilities
4. **Skill Ratings**: Be honest about skill ratings for credibility
5. **Review Before Download**: Always review the preview before downloading

## Troubleshooting

### PDF Download Not Working
- Try a different browser
- Ensure JavaScript is enabled
- Check browser console for errors

### Resume Upload Not Parsing Correctly
- Ensure the resume file is in a supported format
- For best results, use well-formatted resumes
- You can manually edit extracted information

### Styling Issues in Print
- Use Chrome or Firefox for best print results
- Adjust print margins to "None" or "Small"
- Preview the print layout before printing

## Browser Compatibility

- Chrome/Edge (Recommended)
- Firefox
- Safari

## Project Structure

```
infobeans-resume-builder/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ResumeForm.js
│   │   ├── ResumeForm.css
│   │   ├── ResumePreview.js
│   │   ├── ResumePreview.css
│   │   ├── FileUpload.js
│   │   └── FileUpload.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── .gitignore
└── README.md
```

## Available Scripts

```bash
# Start development server
npm start

# Create optimized production build
npm run build

# Run tests
npm test

# Eject configuration (irreversible)
npm eject
```

## Technologies Used

- **React** - UI framework
- **JSPdf** - PDF generation
- **html2canvas** - HTML to image conversion
- **CSS3** - Styling and layout

## License

This project is provided as-is for professional resume formatting.

## Support

For issues or feature requests, please check the application console for error messages and ensure all fields are properly filled before exporting.

---

**Created with ❤️ for professional resume formatting**
