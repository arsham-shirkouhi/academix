# Grades Page Redesign - Implementation Plan

## Core Concept: Hybrid Manual/Automated System

### 1. **Course Overview Section**
- List of all courses with:
  - Current grade (from Canvas or calculated)
  - Target grade indicator
  - Progress bar to target
  - Quick actions (sync Canvas, configure, view details)

### 2. **Course Detail View** (when a course is selected)
- **Automated Section (Canvas):**
  - Auto-imported assignments with scores
  - Assignment groups/categories from Canvas
  - Current Canvas grade
  
- **Manual Configuration Section:**
  - **Category Setup:**
    - Create/edit grade categories (Exams, Homework, Projects, etc.)
    - Set weights for each category (must total 100%)
    - Assign Canvas assignment groups to categories
    - Configure policies (drop lowest, extra credit)
  
  - **Grade Policies:**
    - Drop lowest N scores per category
    - Extra credit handling
    - Rounding rules
  
  - **Manual Assignments:**
    - Add assignments not in Canvas
    - Override Canvas grades if needed
  
- **Grade Calculator:**
  - Current calculated grade
  - What-if scenarios
  - "What grade do I need?" calculator
  - Progress to target grade

### 3. **Visualizations**
- Category breakdown pie chart
- Grade trend over time
- Assignment completion status
- Weight distribution

### 4. **Smart Features**
- Auto-sync from Canvas (button to refresh)
- Save configuration to Firebase
- Export grade report
- Grade predictions based on current performance

## Implementation Priority

1. **Phase 1: Basic Hybrid System**
   - Course list with Canvas sync
   - Category configuration
   - Basic grade calculation

2. **Phase 2: Advanced Features**
   - What-if scenarios
   - Grade policies (drop lowest)
   - Visualizations

3. **Phase 3: Polish**
   - Better UI/UX
   - Export features
   - Grade history tracking

