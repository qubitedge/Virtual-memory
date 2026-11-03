# Virtual Memory Atelier • Interactive Architecture & Simulator

An interactive educational website and simulation suite for **Virtual Memory**, Operating Systems, and Computer Architecture.

Built with **React**, **Three.js / React Three Fiber**, and modern CSS with a curated, tactile **Light Slate Theme** (calibrated soft slate and pearl-mist tones instead of blinding pure white).

---

## 🌟 Key Modules & Features

### 1. Architecture Overview & 3D Bus Visualizer
- **Concept:** Process address spaces, isolation, memory protection, shared libraries, and overcommitment.
- **Interactive 3D Hardware Model:** 
  - Rendered CPU core, hardware MMU, associative TLB cache, physical RAM DIMM with frames, and Swap/SSD storage.
  - Interactive signal packet simulation tracing translation, TLB hits, and Page Fault paths through the system bus.

### 2. Paging & Hardware MMU Translation Engine
- **Formula:** $\text{Virtual Address} = (p \times \text{Page Size}) + d$.
- **Live Bit-Splitter:** Dynamic binary and hexadecimal breakdown separating Page Index bits from Offset bits.
- **Configurable Page Sizes:** 4 KB (12-bit offset), 2 KB (11-bit offset), and 1 KB (10-bit offset).
- **Interactive Page Table Matrix:** Live lookup showing frame mapping, Present/Valid bit, Read/Write permissions, and Dirty bit state.
- **Multi-Level Paging:** Explains 2-level (x86) and 4-level (x86-64 PML4) hierarchical paging to eliminate multi-megabyte flat table overhead.

### 3. TLB (Translation Lookaside Buffer) & Latency Lab
- **Associative Cache:** Parallel tag matching resolving address translation in < 1 nanosecond.
- **Interactive Effective Access Time (EAT) Simulator:**
  $$\text{EAT} = h \cdot (t_{\text{TLB}} + t_{\text{MEM}}) + (1 - h) \cdot (t_{\text{TLB}} + 2 \cdot t_{\text{MEM}})$$
  - Sliders for TLB Hit Rate (50%–100%), TLB Latency, and Main Memory Latency.
  - Live speedup factor calculation and visual latency bar comparison.
- **Advanced Architecture:** Context switches, TLB flushes, and modern ASID (Address Space Identifier) tagging.

### 4. Demand Paging & 6-Step Page Fault Lifecycle
- **Demand Paging:** "Lazy swapper" paradigm loading pages into RAM only when demanded.
- **Interactive Stepper:** Walk through the complete 6-stage lifecycle:
  1. Memory Reference & Valid Bit Check
  2. Hardware Trap to OS Kernel (`#PF` Exception 14)
  3. Address Legality & VMA Verification
  4. Physical Frame Allocation (Free Frame List / Eviction)
  5. Secondary Storage I/O Read (DMA transfer)
  6. Page Table Update & Instruction Restart

### 5. Page Replacement Algorithms Lab
- **Algorithms Implemented:**
  - **FIFO (First-In, First-Out):** Oldest page evicted.
  - **LRU (Least Recently Used):** Evicts page unused for longest time via temporal locality.
  - **Optimal (OPT / MIN):** Clairvoyant replacement (lowest theoretical fault rate).
  - **Clock (Second Chance):** Circular buffer with reference bits.
- **Interactive Controls:**
  - Custom comma-separated reference string input.
  - Configurable frames (3, 4, 5, or 6 frames).
  - Autoplay with play/pause, step forward, step backward, and reset.
  - Frame-by-frame memory state matrix with real-time Hit (green) and Fault (amber/red) badges.
  - Real-time stats: Total References, Faults, Hits, and Hit Ratio %.
- **Belady's Anomaly Test:** One-click demonstration of FIFO suffering *more* page faults with 4 frames than with 3 frames, and proof of why LRU/OPT are immune Stack Algorithms.
- **4-Way Benchmark:** Direct head-to-head comparison table and hit rate analysis across all four algorithms.

### 6. Thrashing & Working Set Model
- **The Thrashing Collapse:** When page faulting saturates the disk bus and CPU utilization drops toward zero.
- **Interactive Thrashing Curve:** Slider for degree of multiprogramming with a dynamic SVG curve showing optimal concurrency vs the thrashing cliff.
- **Modern Virtual Memory Superpowers:** Copy-on-Write (`fork()`), Transparent Huge Pages (2 MB / 1 GB), and Memory-Mapped Files (`mmap`).

### 7. Virtual Memory Mastery Quiz
- 6 high-yield questions evaluating Paging math, TLB benefits, Belady's anomaly, dirty bits, optimal replacement, and thrashing.
- Real-time score tracker, correctness badges, and deep conceptual explanations.

---

## 🎨 Visual Aesthetics & Light Theme

- **"Light UI but NOT White"**: Crafted using soothing, velvety slate and pearl-mist tones (`#e8edf5`, `#f0f4f9`, `#dfe6f0`) rather than harsh, eye-straining pure white `#ffffff`.
- **Typography:** Google Fonts `Outfit` for modern headlines, `Plus Jakarta Sans` for body, and `JetBrains Mono` for hardware registers and addresses.
- **Tactile Shadows & Accents:** Subtle layered drop shadows, color-coded badges (Indigo for MMU, Violet for TLB, Emerald for Page Hits, Amber/Rose for Page Faults), and smooth micro-interactions.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run Vite dev server
npm run dev

# Build for production
npm run build
```
"# Virtual-memory" 
