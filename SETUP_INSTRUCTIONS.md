# Setup and Running Instructions

## Prerequisites
- Node.js (version 16 or higher)
- npm (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation Steps

### 1. Clone the Repository
```bash
# Clone from GitHub
git clone https://github.com/ghuhn/langgraph-screener.git
cd langgraph-screener
```

**Alternative: Download ZIP**
```bash
# If downloading as ZIP file
# Extract to your desired location and navigate to the project directory
cd langgraph-screener
```

### 2. Install Dependencies
```bash
# Install all required packages
npm install
```

### 3. Start the Development Server
```bash
# Start the development server
npm run dev
```

The application will be available at: `http://localhost:8081/`

## Testing the LangGraph Implementation

### Option 1: Use the Test Interface
1. Navigate to: `http://localhost:8081/test-langgraph`
2. Click "Run LangGraph Test" button
3. Watch the real-time progress updates
4. Review the detailed analysis results

### Option 2: Use the Main Application
1. Go to: `http://localhost:8081/`
2. Click "Get Started" 
3. Upload sample resumes (PDF/DOCX files)
4. Fill in job description details
5. Watch the enhanced processing page with real-time agent status
6. View the comprehensive results

## Key Features to Test

### 1. Real-time Progress Tracking
- Watch agent status updates during processing
- Monitor progress percentages
- See current agent messages

### 2. Multi-Agent Workflow
- Recruiter Agent: Extracts candidate information
- Analyst Agent: Analyzes skills and experience
- HR Agent: Evaluates cultural fit
- Recommender Agent: Ranks and selects top candidates

### 3. Error Handling
- System gracefully handles parsing errors
- Fallback to legacy processing if needed
- Comprehensive error reporting

## Project Structure
```
src/
├── types/langgraph.ts          # LangGraph type definitions
├── services/
│   ├── langGraphAgents.ts      # Individual agent implementations
│   ├── langGraphWorkflow.ts    # Main workflow orchestrator
│   └── recruitmentService.ts   # Integration layer
├── pages/
│   ├── Processing.tsx          # Enhanced processing UI
│   └── TestLangGraph.tsx       # Test interface
└── test/
    └── langGraphTest.ts        # Test utilities
```

## Troubleshooting

### Port Already in Use
If port 8081 is busy, Vite will automatically try the next available port.

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Browser Console Errors
- Open browser developer tools (F12)
- Check console for any error messages
- Most issues are resolved by refreshing the page

## Additional Commands

### Build for Production
```bash
npm run build
```

### Run Linting
```bash
npm run lint
```

### Preview Production Build
```bash
npm run preview
```

## Support
If you encounter any issues:
1. Check the browser console for error messages
2. Ensure all dependencies are installed correctly
3. Verify Node.js version compatibility
4. Try clearing browser cache and refreshing
