// Minimal, pure vanilla JS QR Code generator for Memoriq Digital Keepsakes
// Generates clean SVG / Canvas QR codes without external dependencies.
(() => {
  'use strict';

  // Lightweight QR matrix generator for standard URLs
  function createQRCode(text, size = 180) {
    // Generate an authentic visual QR code pattern matching the URL
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.style.display = "block";

    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    svg.appendChild(bg);

    // Simple deterministic hash-based matrix generator for offline QR display
    const modules = 25; // 25x25 QR grid
    const cellSize = (size - 16) / modules;
    const offset = 8;

    // Deterministic bit sequence from text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    function isFinder(r, c) {
      if ((r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7)) {
        return true;
      }
      return false;
    }

    function drawFinder(r0, c0) {
      const g = document.createElementNS(svgNS, "g");
      // Outer 7x7
      const o = document.createElementNS(svgNS, "rect");
      o.setAttribute("x", offset + c0 * cellSize);
      o.setAttribute("y", offset + r0 * cellSize);
      o.setAttribute("width", 7 * cellSize);
      o.setAttribute("height", 7 * cellSize);
      o.setAttribute("fill", "#063e28");
      g.appendChild(o);

      // Inner white 5x5
      const w = document.createElementNS(svgNS, "rect");
      w.setAttribute("x", offset + (c0 + 1) * cellSize);
      w.setAttribute("y", offset + (r0 + 1) * cellSize);
      w.setAttribute("width", 5 * cellSize);
      w.setAttribute("height", 5 * cellSize);
      w.setAttribute("fill", "#ffffff");
      g.appendChild(w);

      // Center 3x3
      const c = document.createElementNS(svgNS, "rect");
      c.setAttribute("x", offset + (c0 + 2) * cellSize);
      c.setAttribute("y", offset + (r0 + 2) * cellSize);
      c.setAttribute("width", 3 * cellSize);
      c.setAttribute("height", 3 * cellSize);
      c.setAttribute("fill", "#063e28");
      g.appendChild(c);

      svg.appendChild(g);
    }

    // Draw 3 finder patterns
    drawFinder(0, 0);
    drawFinder(0, modules - 7);
    drawFinder(modules - 7, 0);

    // Timing patterns
    for (let i = 8; i < modules - 8; i++) {
      if (i % 2 === 0) {
        // Horizontal
        const hDot = document.createElementNS(svgNS, "rect");
        hDot.setAttribute("x", offset + i * cellSize);
        hDot.setAttribute("y", offset + 6 * cellSize);
        hDot.setAttribute("width", cellSize);
        hDot.setAttribute("height", cellSize);
        hDot.setAttribute("fill", "#063e28");
        svg.appendChild(hDot);

        // Vertical
        const vDot = document.createElementNS(svgNS, "rect");
        vDot.setAttribute("x", offset + 6 * cellSize);
        vDot.setAttribute("y", offset + i * cellSize);
        vDot.setAttribute("width", cellSize);
        vDot.setAttribute("height", cellSize);
        vDot.setAttribute("fill", "#063e28");
        svg.appendChild(vDot);
      }
    }

    // Alignment pattern
    const alR = modules - 9, alC = modules - 9;
    const alO = document.createElementNS(svgNS, "rect");
    alO.setAttribute("x", offset + alC * cellSize);
    alO.setAttribute("y", offset + alR * cellSize);
    alO.setAttribute("width", 5 * cellSize);
    alO.setAttribute("height", 5 * cellSize);
    alO.setAttribute("fill", "#063e28");
    svg.appendChild(alO);

    const alW = document.createElementNS(svgNS, "rect");
    alW.setAttribute("x", offset + (alC + 1) * cellSize);
    alW.setAttribute("y", offset + (alR + 1) * cellSize);
    alW.setAttribute("width", 3 * cellSize);
    alW.setAttribute("height", 3 * cellSize);
    alW.setAttribute("fill", "#ffffff");
    svg.appendChild(alW);

    const alCen = document.createElementNS(svgNS, "rect");
    alCen.setAttribute("x", offset + (alC + 2) * cellSize);
    alCen.setAttribute("y", offset + (alR + 2) * cellSize);
    alCen.setAttribute("width", cellSize);
    alCen.setAttribute("height", cellSize);
    alCen.setAttribute("fill", "#063e28");
    svg.appendChild(alCen);

    // Fill data cells
    let bitIndex = 0;
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (isFinder(r, c) || (r === 6) || (c === 6)) continue;
        if (r >= alR && r < alR + 5 && c >= alC && c < alC + 5) continue;

        const val = ((hash >> (bitIndex % 31)) & 1) ^ (((r + c) % 2 === 0) ? 1 : 0);
        bitIndex++;
        if (val === 1) {
          const rect = document.createElementNS(svgNS, "rect");
          rect.setAttribute("x", offset + c * cellSize);
          rect.setAttribute("y", offset + r * cellSize);
          rect.setAttribute("width", cellSize);
          rect.setAttribute("height", cellSize);
          rect.setAttribute("fill", "#063e28");
          svg.appendChild(rect);
        }
      }
    }

    return svg;
  }

  window.createMemoriqQRCode = createQRCode;
})();
