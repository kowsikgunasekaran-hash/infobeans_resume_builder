# Quick Start Guide - InfoBeans Resume Builder

## Step 1: Install Dependencies
Open a terminal in this folder and run:
```bash
npm install
```
This will download and install all required packages. It may take a few minutes.

## Step 2: Start the Application
Once installation is complete, run:
```bash
npm start
```
The application will automatically open in your browser. If not, go to:
```
http://localhost:3000
```

## Step 3: Choose Your Input Method

### Using Form (Recommended for New Resumes)
1. Click the "Form Input" tab
2. Fill in all fields:
   - Personal Information (required)
   - Professional Overview (required)
   - Work Experience (optional but recommended)
   - Education (optional)
   - Projects (optional)
   - Skills (optional)
   - Additional details (Technologies, Domain, etc.)
3. Click "Generate Resume Preview"
4. Download PDF or Print

### Using File Upload
1. Click the "Upload Resume" tab
2. Upload your existing resume file
3. System will auto-parse the content
4. Review and edit the extracted information
5. Click "Generate Resume Preview"
6. Download or Print

## Step 4: Download or Print
From the preview page:
- **📥 Download PDF** - Saves as a professional PDF file
- **🖨️ Print** - Print directly or to PDF printer

## Form Fields Explanation

**Personal Information**
- Full Name: Your complete name
- Position: Current job title or desired position
- Years of Experience: e.g., "5+ years"
- Focus Areas: Key specializations separated by bullet points

**Professional Overview**
- A summary paragraph about your professional background

**Experience**
- Company: Company name
- Position: Job title
- Duration: Dates of employment
- Description: Achievements and responsibilities

**Education**
- Year: Graduation year
- Degree: Degree name
- Institution: School/University name

**Projects**
- Name: Project title
- Duration: Timeline
- Tools: Technologies used
- Team Size: Number of people
- Role: Your role
- Description: Project details

**Skills**
- Name: Skill name
- Rating: 1-5 scale (use decimals like 3.5 for in-between)

**Additional Info**
- Technologies: List of tools and technologies
- Domain: Industry/domain expertise
- Languages: Languages you speak
- Managerial Experience: Management capabilities

## Tips for Best Results

✅ **DO:**
- Fill all required fields (marked with *)
- Use consistent date formatting
- Write clear, concise descriptions
- Review the preview before downloading
- Be honest about skill ratings

❌ **DON'T:**
- Leave the full name empty
- Use special characters that might not render
- Copy-paste from poorly formatted sources
- Exaggerate skill ratings

## Common Issues

**Issue: "npm: command not found"**
- Solution: Node.js is not installed. Download from nodejs.org

**Issue: Port 3000 already in use**
- Solution: Close other applications using port 3000, or the app will try another port

**Issue: Dependencies won't install**
- Solution: Try `npm install --legacy-peer-deps`

**Issue: Resume preview looks wrong**
- Solution: Check your browser zoom level (should be 100%)

## File Information

The application generates resume files in this folder:
- **Resume previews**: Displayed in-browser (no file saved)
- **Downloaded PDFs**: Saved to your Downloads folder with format: `[Name]_Resume.pdf`

## Keyboard Shortcuts

- **Ctrl+P** or **Cmd+P**: Print current preview
- **Tab**: Move to next form field
- **Shift+Tab**: Move to previous form field

## Need Help?

1. Check the terminal for error messages
2. Try refreshing the page (Ctrl+R or Cmd+R)
3. Clear browser cache and restart
4. Ensure all required fields are filled (marked with *)

## Next Steps

1. Customize your resume content in the form
2. Generate preview to see formatting
3. Make adjustments as needed
4. Download PDF when satisfied
5. You can always edit and regenerate

---

**Good luck with your resume! 🎉**
