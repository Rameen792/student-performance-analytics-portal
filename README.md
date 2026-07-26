📊 Student Performance Analytics Portal — Front-End Prototype

A fully responsive front-end prototype built during Week 1 of internship, designed to
help teachers and administrators track and analyze student academic performance.

🚀 Features
- Fully responsive design (mobile, tablet, desktop)
- Modern UI with cards, stats, and clean color scheme
- Student Dashboard with sidebar navigation
- Performance Report page with live search & filters
- Student data entry form with real-time validation
- Contact form with validation
- Mobile-friendly hamburger navigation

🛠️ Tech Stack
- HTML5
- CSS3 (Flexbox, Grid, Media Queries)
- Vanilla JavaScript (DOM manipulation, form validation)

📁 Project Structure
- student-performance-portal/
- ├── index.html
- ├── about.html
- ├── dashboard.html
- ├── report.html
- ├── contact.html
- ├── css/style.css
- ├── js/script.js
- ├── images/
- └── README.md

▶️ How to Run
1. Clone the repository:
```bash
   git clone https://github.com/Rameen792/student-performance-analytics-portal.git
```

**Week 6 – Testing, Debugging & Optimization**

Week 6 focused on improving the Student Performance Analytics Portal by testing the existing codebase, fixing bugs, optimizing performance, and enhancing accessibility instead of adding major new modules.

**Bugs Fixed**

* Fixed the dashboard heading hierarchy by changing the stat card headings (Total, Excellent, Average, At Risk) from `<h3>` to `<h2>` to maintain proper heading order and pass accessibility checks.
* Added unique `aria-label` attributes to each **View Profile** link so screen readers can identify the correct student instead of reading identical link text.
* Fixed duplicate roll number detection, which was previously case- and space-sensitive. Roll numbers are now compared after removing whitespace, preventing duplicate entries such as `"STU - 1009"` and `"STU-1009"`.
* Restored global function exports (including `window.EA_deleteStudentEverywhere`) after refactoring so the delete and edit buttons work correctly again.

**Performance Optimization**

* Minified all production CSS and JavaScript files by removing comments, whitespace, and shortening variable names where safe.
* Reduced the JavaScript bundle size from approximately **97 KB** to **53 KB**.
* Reduced the CSS size from approximately **76 KB** to **56 KB**.
* Added the `defer` attribute to script tags so JavaScript no longer blocks HTML parsing during page load.
* Deferred Chart.js initialization until the next animation frame, allowing the student table to render immediately while charts load shortly afterward. This reduced the page's Total Blocking Time.

**Lighthouse Scores (Dashboard)**

| Metric         | Before | After |
| -------------- | ------ | ------|
| Performance    | 78     |   96  |
| Accessibility  | 91     |   100 |
| Best Practices | 100    |   100 |
| SEO            | 100    |   100 |

**New Feature – Advanced Filtering**

* Added an attendance range filter to the dashboard.
* Added a **Sort By** dropdown alongside the existing class and score-range filters.
* Added an **Attendance** column to the student table.
* Updated the **Clear Filters** functionality and active filter chips to support the new filtering options.

**Accessibility**

* Fixed the heading hierarchy issue.
* Verified keyboard navigation across the dashboard, including correct Tab order, visible focus indicators, and Enter/Space key support for buttons.
* Confirmed that form validation displays clear and readable error messages.

**Browser Testing**

Tested on **Google Chrome**, and **Microsoft Edge**.

No layout or functional differences were found across all the browsers.

**What This Week Reinforced**

Performance and accessibility are essential parts of software development, not final-stage additions. A feature is only complete when it performs efficiently and remains accessible to users who rely on keyboards or screen readers. This week also showed that reducing file size through minification helps, but proper execution timing and efficient rendering have an equally important impact on overall performance.

