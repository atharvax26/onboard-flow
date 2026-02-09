

# Customer Onboarding Agent — Implementation Plan

## Design Theme: Browser-Core Modernism
The entire app will be wrapped in a simulated browser chrome frame with macOS traffic lights, tab bar, and address bar. The design uses a light neutral base (#f3f4f6), Inter font for headings, JetBrains Mono for technical labels, and cyan (#06B6D4) as the primary accent. A subtle 20px grid pattern background will be applied throughout. All spacing follows a strict 4px/8px grid.

---

## Pages & Features

### 1. Landing / Hero Page
- **Browser Chrome Frame**: Simulated browser window with tab bar, traffic lights, and address bar at the top
- **Hero Section**: Split-pane layout with a large technical headline (72px), a pulsing "v2.0 RELEASED" tag, and a cyan CTA button ("Get Started") on the left. Right side shows a simulated interactive UI window with a cursor-demo animation
- **Navigation Bar** (inside the browser chrome): 4 tabs — Home, Document Upload, Onboarding, Account Details. Admin users see a 5th "Analytics" tab
- **Release Notes Section**: Two-column changelog grid with cyan "+" bullet features
- **README Manifesto**: Dark-themed (#0d1117) section styled like a GitHub README with monospaced text
- **Technical FAQ**: Accordion-style FAQ using `<details>`-like elements

### 2. Authentication (Mock)
- Login and Register pages with email/password fields styled in the DevTools aesthetic
- Mock auth — no real backend. Hardcoded admin credentials (e.g., admin@demo.com) to access admin features
- After login, user is redirected to the Home dashboard

### 3. Home Dashboard
- Welcome panel showing user status and onboarding progress summary
- Quick-action card to upload a document (links to Document Upload page)
- Recent activity feed (mock data)
- Styled as an IDE-like workspace with the pattern-grid background

### 4. Document Upload Page
- PDF upload area with drag-and-drop support and file browser fallback
- File preview after upload (showing filename, size, upload status)
- Mock processing indicator — simulates "AI parsing" the document to extract onboarding steps
- After processing completes, user is redirected to the Onboarding page with generated steps

### 5. Onboarding Steps Page
- AI-generated onboarding steps displayed as a guided checklist (mock/hardcoded steps based on uploaded document)
- Each step has: title, description, status (pending/in-progress/completed), and an action button
- Progress bar at the top showing overall completion
- Steps are presented in a three-panel IDE layout:
  - **Left sidebar**: Step navigation list (explorer-style)
  - **Center**: Current step details with instructions and action area
  - **Right sidebar**: Property inspector showing step metadata (status, time spent, dependencies)
- Users can mark steps complete and move to the next one

### 6. Account Details Page
- User profile information (name, email, company)
- Onboarding status summary
- Document history (list of uploaded documents)
- Styled with the property inspector grid layout (label-value pairs in monospace)

### 7. Admin Analytics Dashboard (Admin Only)
- **User Overview Table**: All users with their current onboarding step, completion percentage, and last activity timestamp. Filterable and sortable
- **Statistics Cards**: Total users, completion rate, average time to complete, drop-off rate
- **Per-Step Breakdown**: Bar/pie charts showing how many users are on each step and average time per step
- **Bottleneck Analysis**: Highlight steps where users spend the most time or drop off
- **Export**: Button to export data as CSV (mock)
- **User Detail Drill-down**: Click a user row to see their full step-by-step timeline

---

## Navigation Structure
- Top-level tab bar (inside browser chrome): Home | Document Upload | Onboarding | Account Details | Analytics (admin only)
- Active tab highlighted with cyan accent and white background
- Consistent browser chrome frame across all pages

## Data Approach
- All data is mock/hardcoded — no real backend or database
- Mock user list and onboarding progress for admin analytics
- Simulated AI parsing delay when processing uploaded documents


## Keep Project Light weight
