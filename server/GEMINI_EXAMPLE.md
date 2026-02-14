# Gemini Integration Example

## How It Works

### 1. PDF Upload
When a user uploads a PDF, the file is sent to the backend as a buffer.

### 2. Text Extraction
The `pdf-parse` library extracts text from the PDF:

```typescript
const pdfData = await pdf(fileBuffer);
const text = pdfData.text;
```

### 3. Gemini Prompt
A structured prompt is sent to Gemini AI:

```typescript
const prompt = `Analyze the following document and extract onboarding steps. 
For each step, provide:
- A clear title (max 50 characters)
- A brief description (max 100 characters)
- Detailed instructions
- Any dependencies on other steps (by title)

Return the result as a JSON array with this structure:
[
  {
    "title": "Step Title",
    "description": "Brief description",
    "details": "Detailed instructions",
    "dependencies": ["Previous Step Title"]
  }
]

Document content:
${text.substring(0, 10000)}

Return ONLY the JSON array, no additional text.`;
```

### 4. AI Response
Gemini analyzes the document and returns structured JSON:

```json
[
  {
    "title": "Account Setup",
    "description": "Create your company email and set up authentication",
    "details": "Create your company email account and set up two-factor authentication. Complete your employee profile with contact information.",
    "dependencies": []
  },
  {
    "title": "Equipment Request",
    "description": "Submit IT equipment request form",
    "details": "Submit IT equipment request form for laptop and accessories. Schedule equipment pickup with IT department.",
    "dependencies": ["Account Setup"]
  }
]
```

### 5. Data Transformation
The response is transformed into the app's format:

```typescript
const steps: OnboardingStep[] = parsedSteps.map((step: any, index: number) => ({
  id: index + 1,
  title: step.title,
  description: step.description,
  details: step.details,
  status: 'pending',
  timeSpent: '0m',
  dependencies: step.dependencies || []
}));
```

### 6. Storage & Return
Steps are stored in the database and returned to the frontend.

## Example API Call

### Request
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@onboarding.pdf" \
  -F "userId=user@example.com"
```

### Response
```json
{
  "success": true,
  "document": {
    "id": "doc-1234567890",
    "name": "onboarding.pdf",
    "size": "1.2 MB",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "status": "parsed"
  },
  "steps": [
    {
      "id": 1,
      "title": "Account Setup",
      "description": "Create your company email and set up authentication",
      "details": "Create your company email account...",
      "status": "pending",
      "timeSpent": "0m",
      "dependencies": []
    },
    {
      "id": 2,
      "title": "Equipment Request",
      "description": "Submit IT equipment request form",
      "details": "Submit IT equipment request form...",
      "status": "pending",
      "timeSpent": "0m",
      "dependencies": ["Account Setup"]
    }
  ],
  "message": "AI extracted 2 onboarding steps"
}
```

## Customizing the Prompt

You can modify the prompt in `server/src/services/gemini.ts` to:

### Extract Different Information
```typescript
const prompt = `Analyze this document and extract:
- Training modules
- Compliance requirements
- System access needs
- Meeting schedules

Format as JSON...`;
```

### Change Output Format
```typescript
const prompt = `Return steps with these fields:
- name (required)
- category (HR, IT, Training, etc.)
- priority (high, medium, low)
- estimatedTime (in minutes)
- prerequisites (array of step names)
...`;
```

### Add Context
```typescript
const prompt = `You are analyzing an onboarding document for a ${companyType} company.
Focus on ${industry}-specific requirements.
Extract steps relevant to ${role} position.
...`;
```

## Error Handling

### Fallback Steps
If Gemini fails, default steps are returned:

```typescript
function getDefaultSteps(): OnboardingStep[] {
  return [
    {
      id: 1,
      title: "Company Profile Setup",
      description: "Configure your organization's basic information",
      details: "Enter your company name, industry, size...",
      status: "pending",
      timeSpent: "0m",
      dependencies: []
    },
    // ... more default steps
  ];
}
```

### Error Logging
All errors are logged for debugging:

```typescript
catch (error) {
  console.error('Gemini parsing error:', error);
  return getDefaultSteps();
}
```

## Performance Tips

### 1. Limit Text Length
Only send first 10,000 characters to Gemini:

```typescript
${text.substring(0, 10000)}
```

### 2. Cache Results
Store parsed results to avoid re-parsing:

```typescript
const cacheKey = `parsed-${fileHash}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

### 3. Batch Processing
Process multiple documents in parallel:

```typescript
const results = await Promise.all(
  files.map(file => parseDocument(file))
);
```

## Advanced Features

### Multi-Language Support
```typescript
const prompt = `Analyze this document in ${language}.
Return steps in ${language} with English field names...`;
```

### Step Validation
```typescript
// Validate extracted steps
steps.forEach(step => {
  if (step.title.length > 50) {
    step.title = step.title.substring(0, 47) + '...';
  }
  if (!step.dependencies) {
    step.dependencies = [];
  }
});
```

### Dependency Resolution
```typescript
// Ensure dependencies exist
steps.forEach(step => {
  step.dependencies = step.dependencies.filter(dep =>
    steps.some(s => s.title === dep)
  );
});
```

## Testing Gemini Integration

### Test with Sample Text
```typescript
const sampleText = `
Step 1: Setup
Complete initial setup process.

Step 2: Training
Attend training sessions.
Requires: Setup
`;

const steps = await parseDocument(Buffer.from(sampleText));
console.log(steps);
```

### Mock Gemini Response
```typescript
// For testing without API calls
if (process.env.NODE_ENV === 'test') {
  return getMockSteps();
}
```

## API Quota Management

### Check Usage
Monitor your Gemini API usage in Google Cloud Console.

### Rate Limiting
```typescript
const rateLimiter = new RateLimiter({
  tokensPerInterval: 15,
  interval: 'minute'
});

await rateLimiter.removeTokens(1);
const result = await model.generateContent(prompt);
```

### Retry Logic
```typescript
async function parseWithRetry(buffer: Buffer, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await parseDocument(buffer);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

## Security Considerations

### Input Validation
```typescript
// Validate file type
if (!file.mimetype.includes('pdf')) {
  throw new Error('Only PDF files allowed');
}

// Validate file size
if (file.size > 20 * 1024 * 1024) {
  throw new Error('File too large');
}
```

### Sanitize Output
```typescript
// Remove potentially harmful content
steps.forEach(step => {
  step.title = sanitize(step.title);
  step.description = sanitize(step.description);
  step.details = sanitize(step.details);
});
```

### API Key Protection
- Never commit `.env` files
- Use environment variables
- Rotate keys regularly
- Monitor for unauthorized usage
