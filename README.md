# Dream Big Crèche Graduation Keepsake & Student Calendar

An all-in-one web generator for **Dream Big Crèche**:
1. **Graduation Keepsake**: Matches the original **1198 × 1313** reference poster with the Dream Big Crèche logo, Limpopo Provincial Government logo, ornate framed portrait, gold laurel quotes, and ribbon banner.
2. **Student Calendar**: A companion **1200 × 1700** (A-series wall poster ratio) 12-month annual student calendar featuring the child's framed portrait, full details, and dynamically generated monthly date grids for any chosen academic year (2026, 2027, etc.).

### How to use
- Open `index.html` (or `calendar.html`) in any modern browser. No installation, server, internet connection, build steps, or external libraries are required.
- Use the **Keepsake** and **Calendar** tabs at the top of the editor to switch between templates at any time.
- Changes to the student's name, birth date, gender, photo upload, and photo position/zoom are instantly synchronized across both templates.
- **Student Calendar Year**: When on the Calendar tab, select the academic year (e.g., 2026, 2027) to update all 12 month grids and headings automatically.
- **Photo adjustments**: Drag the portrait directly inside either preview window or use the horizontal, vertical, and zoom sliders.
- **Preview**: Opens a clean modal preview of the active template.
- **Download PNG**:
  - **Graduation Keepsake**: Exports a high-resolution **3594 × 3939 px** PNG (`[Name]-Dream-Big-Graduation.png`).
  - **Student Calendar**: Exports an ultra-sharp **3600 × 5100 px** 300 DPI print-quality PNG (`[Name]-Dream-Big-Calendar-[Year].png`).
- **Reset**: Restores Bonolo Makola, 18-08-2021, Male, 2026, and the default portrait and position.

### Architecture
- Works both locally (`file://`) and hosted (e.g. Vercel at `https://students-lemon-seven.vercel.app/`).
- Native browser Canvas rendering ensures crisp vector-grade typography, accurate date grids, and reliable downloads without external server dependencies.
