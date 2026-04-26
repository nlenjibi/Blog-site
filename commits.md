AI System Prompt for Commit Message Generation

Prompt:

You are an expert software engineer who writes clear, concise, and professional Git commit messages in the Conventional Commit format. Your goal is to generate commit messages that are understandable by anyone in the future and clearly explain what was changed and why.

Rules to follow:

Use Conventional Commit types:

feat – new feature

fix – bug fix

chore – maintenance or non-functional changes

docs – documentation updates

refactor – code restructuring

style – formatting changes

perf – performance improvements

test – adding or fixing tests

build – build system changes

ci – continuous integration changes

revert – reverts a previous commit

Include an optional scope in parentheses if relevant. Example: feat(auth): ....

Write the subject line in imperative mood, lowercase, max 50 characters, no ending punctuation. Example: fix(login): handle empty password error.

Write a detailed body explaining:

What was changed

Why it was changed

Any important context for future developers

Use 72 characters per line if possible.

Optionally include a footer for tickets, breaking changes, or references. Example: Closes JIRA-1234.

Avoid vague messages like “fixed stuff” or “update code.”

Output format:

<type>(<scope>): <short summary>

<detailed description of what and why>

<optional footer>

Example:

feat(analytics): add user engagement tracking

Implemented a new analytics module to track user interactions
across the dashboard. This will help the product team analyze
feature usage and identify areas for improvement.

Closes JIRA-456

Now, based on the change description I provide, generate a Conventional Commit message that follows these rules.

✅ With this system prompt, you can just tell your AI:

“I added dark mode toggle for the dashboard, fixed button styling issues, and updated README.”

And it will return a well-structured commit message like:

feat(ui): add dark mode toggle and fix button styling

Added dark mode toggle for the dashboard to improve accessibility.
Fixed button styling inconsistencies to match the design system.
Updated README with instructions for enabling dark mode.

Closes JIRA-789

---

feat(budget): add category and period filters to budget page

Added category and period dropdown filters to the budget page UI
along with search functionality. Updated backend API to handle
category, period, and search query parameters for filtering budgets.

---

feat(income): add date range filters to income page

Added start date and end date filters to the income page along with
existing category and search filters. Updated useEffect dependencies
to trigger fetch on date filter changes. Backend API already supports
date range filtering.

---

feat(expenses): add date range filters to expenses page

Added start date and end date input filters to the expenses page
alongside existing category and search filters. Updated dependencies
to refetch data when date filters change.

---

feat(tobuy): add priority filter to tobuy page

Added priority dropdown filter to filter items by high, medium, or
low priority. Updated backend API to accept priority query parameter.
The tobuy page now has search, status, and priority filters working together.

---

feat(lending): add risk rating filter to lending page

Added risk rating dropdown filter (low, medium, high) to the lending
page. Updated backend API to accept riskRating query parameter.
Users can now filter lendings by status, risk rating, and search term.

---

feat(debt): add date range filters to debt page

Added start date and end date filters to the debt page along with
existing search and show paid off checkbox. Updated backend API to
handle date range filtering on dueDate field. Users can filter debts
by due date range, search term, and paid off status.

---

chore(api): fix duplicate search query in income route

Removed duplicate search query block in income API route that was
causing redundant MongoDB queries. Cleaned up code following
backend system guidelines.

---

fix(utils): handle null amounts in formatCurrency

Fixed formatCurrency function to handle null, undefined, or NaN
amount values. Returns formatted zero when amount is invalid to
prevent runtime TypeError.

---

feat(ui): create reusable confirm dialog component

Created a new ConfirmDialog component using shadcn Dialog for
replacing native browser confirm() calls across the application.
Supports custom title, description, confirm/cancel text, and
destructive variant.

Applied to: budget, expenses, income, tobuy pages

---

fix(budget): include month and year in update request

Fixed budget edit not working by including month and year
parameters in the PUT request. The backend requires these fields
to match the existing budget for proper updating.

---

fix(formatCurrency): move currencySymbols outside function

Moved currencySymbols constant outside formatCurrency function
to prevent ReferenceError. Also updated function signature to
accept null/undefined amounts with proper handling.

---

feat(tobuy): add move to planning for purchased items

Added ability to move purchased items back to planning status
in tobuy page. Users can now delete or move purchased items
back to planning list. Updated backend API to handle status
update for moving items.

---

feat(delete): add delete dialog to lending page

Added proper delete confirmation dialog to lending page using
shadcn Dialog component. Fixed modal not closing after delete
in tobuy page. Updated debt page with proper delete states
and dialog.

---

fix(debt): add missing state variables

Added missing state variables (searchQuery, showPaidOff, deleteOpen,
deleteId) to debt page that were accidentally removed. Fixed
filterStatus usage instead of old filterPeriod for debt status.

---

chore: install @radix-ui/react-alert-dialog

Installed missing @radix-ui/react-alert-dialog package needed
for alert-dialog component in lending page.

---

fix(insights): add placeholder content for AI insights page

Added placeholder content to insights page that was causing
build error due to empty file. Now shows "Coming Soon" message
for AI-powered financial insights feature.

---

feat(reports): optimize reports page with enhanced UI

Complete overhaul of reports page with:
- Icon buttons for each report type (Summary, Income, Expenses,
  Debts, Lending, Budget)
- Colored border cards for financial metrics
- Summary badges showing totals
- Empty state component for better UX
- Date filter with clear button
- Expense breakdown with progress bars in summary
- Risk rating display for lendings
- Paid off status indicators for debts/lendings

Also updated backend API to use proper model imports instead
of inline schemas and added budget report type support.