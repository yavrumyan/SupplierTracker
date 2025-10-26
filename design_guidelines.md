# CHIP ERP Design Guidelines

## Design Approach
**System**: Carbon Design-inspired enterprise application framework
**Justification**: Data-dense ERP requiring maximum information density, scannable layouts, and efficient workflows. Drawing from modern enterprise systems (SAP Fiori, Salesforce Lightning) with focus on productivity over aesthetics.

## Layout System

**Spacing Primitives**: Tailwind units 1, 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Card spacing: gap-4 to gap-6
- Section margins: mb-6 to mb-8
- Dense table cells: px-4 py-2

**Grid Architecture**:
- **Dashboard**: 3-4 column metric cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- **Data tables**: Full-width with horizontal scroll for many columns
- **Forms**: 2-column layout for efficiency (grid-cols-1 md:grid-cols-2), single column for complex fields
- **Sidebar**: Fixed 64px collapsed / 240px expanded with navigation icons and labels

## Typography

**Font Stack**: Inter (Google Fonts) - optimized for data density and multilingual support (Armenian, Russian UTF-8)

**Hierarchy**:
- Page titles: text-2xl font-semibold (24px)
- Section headers: text-lg font-semibold (18px)
- Card titles: text-base font-medium (16px)
- Body/table text: text-sm (14px)
- Labels/metadata: text-xs font-medium uppercase tracking-wide (12px)
- Dense table data: text-sm leading-tight

## Component Library

### Navigation Structure
**Sidebar** (bg-[#2AA448] green):
- Company logo/icon at top (h-12)
- Icon-based navigation with labels (collapsed: icon-only, expanded: icon + text)
- Active state: lighter green background (#3BB857)
- Sections: Dashboard, Inventory, Finance, Accounting, Reports, Settings

**Top Bar** (bg-white, border-b):
- Breadcrumb navigation (text-sm)
- Global search input (w-80)
- Quick actions: Notifications bell, User avatar dropdown, Export/Print icons
- Height: h-16

### Dashboard Cards
**Metric Cards**:
- White background, subtle shadow (shadow-sm), rounded corners (rounded-lg)
- Label: text-xs uppercase text-gray-500
- Value: text-3xl font-bold
- Trend indicator: small arrow icon + percentage (text-xs)
- Mini sparkline chart for context
- Padding: p-6

**Chart Cards**:
- Same styling as metric cards
- Toolbar with date range selector, export button
- Use Chart.js or similar library for bar/line/pie charts
- Height: h-80 for standard charts

### Data Tables
**Table Structure**:
- Sticky header row (bg-gray-50)
- Alternating row colors (even: bg-white, odd: bg-gray-50/50)
- Dense spacing: px-4 py-2 for cells
- Border between rows: border-b border-gray-200
- Column headers: text-xs font-medium uppercase text-gray-600

**Table Features**:
- Fixed first column for row labels when scrolling horizontally
- Sort indicators in headers (up/down arrows)
- Checkbox column for bulk actions (w-12)
- Action column (right-aligned): Edit/Delete icons
- Pagination footer: showing "1-50 of 234 items"

**Horizontal Scroll**:
- Container: overflow-x-auto
- Minimum column widths: min-w-[120px] for data, min-w-[200px] for names/descriptions

### Forms
**Input Fields**:
- Label above input: text-sm font-medium mb-1
- Input height: h-10
- Border: border-gray-300, focus: ring-2 ring-[#2AA448]/20 border-[#2AA448]
- Background: bg-white
- Rounded: rounded-md

**Field Groups**:
- Two-column grid for efficiency: grid-cols-1 md:grid-cols-2 gap-4
- Full-width for textarea, file uploads
- Required fields: red asterisk after label

**Buttons**:
- Primary (green): bg-[#2AA448] text-white h-10 px-6 rounded-md font-medium
- Secondary: bg-white border-2 border-gray-300 h-10 px-6 rounded-md
- Danger: bg-red-600 text-white
- Icon buttons: h-8 w-8 rounded-md for actions

**Select/Dropdown**:
- Match input styling
- Chevron-down icon on right
- Use native select or Headless UI for custom dropdowns

### Action Bars & Toolbars
**Page Action Bar** (below breadcrumbs):
- Flex layout: space-between items-center mb-6
- Left: Page title + description
- Right: Primary action button + secondary actions (Export, Print, Filter)
- Height: min-h-[60px]

**Table Toolbar**:
- Search input (w-64)
- Filter dropdowns (Status, Date range, Category)
- Bulk action dropdown (when rows selected)
- Export buttons: CSV, PDF, Excel icons

### Alerts & Notifications
**Toast notifications** (top-right):
- Success: border-l-4 border-green-500 bg-green-50
- Error: border-l-4 border-red-500 bg-red-50
- Info: border-l-4 border-blue-500 bg-blue-50

**Inline alerts** (in forms):
- Error messages: text-sm text-red-600 mt-1
- Helper text: text-sm text-gray-500 mt-1

## Responsive Behavior

**Desktop (1280px+)**: Full 4-column dashboard, expanded sidebar
**Tablet (768-1279px)**: 2-column cards, collapsible sidebar
**Mobile (<768px)**: 
- Single column cards
- Hamburger menu for navigation
- Tables: horizontal scroll with fixed first column
- Forms: single column, full-width inputs

## Data Visualization

**Chart Colors** (maintain brand consistency):
- Primary: #2AA448 (green)
- Secondary palette: #60A5FA (blue), #F59E0B (amber), #EF4444 (red), #8B5CF6 (purple)
- Use for multi-series charts, status indicators

**Financial Metrics**:
- Positive values: text-green-600
- Negative values: text-red-600
- Neutral: text-gray-900

## Accessibility
- All inputs have associated labels
- Focus states visible on all interactive elements
- Adequate color contrast (WCAG AA)
- Keyboard navigation support for tables and forms
- ARIA labels for icon-only buttons

## No Images Required
This is a data-focused ERP dashboard - no hero images or decorative imagery needed. All visual interest comes from data visualization, card layouts, and the functional interface itself.