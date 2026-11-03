import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Text } from "@react-three/drei";
import * as THREE from "three";
import "./styles.css";

// --- Topics Navigation ---
const topics = [
  { id: "overview", label: "01", title: "Architecture Overview", sub: "Why virtual memory exists & 3D model" },
  { id: "paging", label: "02", title: "Paging & MMU Translation", sub: "Page numbers, offsets & bit splitting" },
  { id: "tlb", label: "03", title: "TLB & Access Latency", sub: "Fast hardware cache & EAT simulator" },
  { id: "pagefault", label: "04", title: "Page Faults & Demand Paging", sub: "Step-by-step 6-stage lifecycle" },
  { id: "algorithms", label: "05", title: "Page Replacement Lab", sub: "FIFO, LRU, OPT & Clock simulator" },
  { id: "thrashing", label: "06", title: "Thrashing & Working Set", sub: "Paging collapse & modern optimizations" },
  { id: "quiz", label: "07", title: "Mastery Challenge", sub: "Test your OS architecture knowledge" }
];

// --- 3D Architecture Visualizer ---
function BusLine({ start, end, color = "#6366f1" }) {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={lineGeo}>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
}

function SignalPacket({ start, end, active, onComplete, color = "#4f46e5" }) {
  const meshRef = useRef();
  const progressRef = useRef(0);

  useFrame((_, delta) => {
    if (!active || !meshRef.current) return;
    progressRef.current += delta * 1.6;
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      onComplete?.();
    } else {
      const p = progressRef.current;
      meshRef.current.position.lerpVectors(
        new THREE.Vector3(...start),
        new THREE.Vector3(...end),
        p
      );
    }
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef} position={start}>
      <sphereGeometry args={[0.16, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}

function ArchitectureScene({ simulationState, onStepFinish }) {
  // Coords:
  // CPU: [-3.2, 0, 0]
  // MMU: [-1.0, 0, 0]
  // TLB: [-1.0, 1.6, 0]
  // Physical RAM: [1.8, 0, 0]
  // Disk / Swap: [1.8, -1.8, 0]

  let packetStart = [-3.2, 0, 0];
  let packetEnd = [-1.0, 0, 0];
  let packetColor = "#4f46e5";

  if (simulationState === "tlb-check") {
    packetStart = [-1.0, 0, 0];
    packetEnd = [-1.0, 1.6, 0];
    packetColor = "#7c3aed";
  } else if (simulationState === "ram-access") {
    packetStart = [-1.0, 0, 0];
    packetEnd = [1.8, 0, 0];
    packetColor = "#059669";
  } else if (simulationState === "swap-access") {
    packetStart = [-1.0, 0, 0];
    packetEnd = [1.8, -1.8, 0];
    packetColor = "#dc2626";
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Bus Lines */}
      <BusLine start={[-3.2, 0, 0]} end={[-1.0, 0, 0]} color="#4f46e5" />
      <BusLine start={[-1.0, 0, 0]} end={[-1.0, 1.6, 0]} color="#7c3aed" />
      <BusLine start={[-1.0, 0, 0]} end={[1.8, 0, 0]} color="#059669" />
      <BusLine start={[-1.0, 0, 0]} end={[1.8, -1.8, 0]} color="#dc2626" />

      {/* Signal Packet */}
      <SignalPacket
        start={packetStart}
        end={packetEnd}
        active={simulationState !== "idle"}
        onComplete={onStepFinish}
        color={packetColor}
      />

      {/* CPU Module */}
      <group position={[-3.2, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 0.35]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.2]}>
          <boxGeometry args={[0.9, 0.9, 0.1]} />
          <meshStandardMaterial color="#334155" emissive="#1e293b" emissiveIntensity={0.4} />
        </mesh>
        <Text position={[0, 1.1, 0]} fontSize={0.24} color="#0f172a" anchorX="center" fontWeight="bold">
          CPU CORE
        </Text>
        <Text position={[0, -1.05, 0]} fontSize={0.16} color="#475569" anchorX="center">
          Virtual Addr
        </Text>
      </group>

      {/* MMU Module */}
      <group position={[-1.0, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 1.3, 0.35]} />
          <meshStandardMaterial color="#0891b2" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.2]}>
          <boxGeometry args={[0.7, 0.7, 0.1]} />
          <meshStandardMaterial color="#164e63" />
        </mesh>
        <Text position={[0, -0.95, 0]} fontSize={0.22} color="#0891b2" anchorX="center" fontWeight="bold">
          MMU
        </Text>
        <Text position={[0, -1.2, 0]} fontSize={0.15} color="#475569" anchorX="center">
          Paging & Protection
        </Text>
      </group>

      {/* TLB Module */}
      <group position={[-1.0, 1.6, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.7, 0.3]} />
          <meshStandardMaterial color="#7c3aed" metalness={0.3} roughness={0.4} />
        </mesh>
        <Text position={[0, 0.65, 0]} fontSize={0.2} color="#7c3aed" anchorX="center" fontWeight="bold">
          TLB CACHE
        </Text>
        <Text position={[0, 0, 0.18]} fontSize={0.16} color="#f8fafc" anchorX="center">
          Fast Lookups
        </Text>
      </group>

      {/* Physical RAM (DIMM) */}
      <group position={[1.8, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.0, 1.2, 0.3]} />
          <meshStandardMaterial color="#059669" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Frame blocks */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.18]}>
            <boxGeometry args={[0.28, 0.7, 0.1]} />
            <meshStandardMaterial color="#064e3b" />
          </mesh>
        ))}
        <Text position={[0, 0.95, 0]} fontSize={0.22} color="#059669" anchorX="center" fontWeight="bold">
          PHYSICAL RAM
        </Text>
        <Text position={[0, -0.9, 0]} fontSize={0.16} color="#475569" anchorX="center">
          Physical Page Frames
        </Text>
      </group>

      {/* Backing Store / Swap Disk */}
      <group position={[1.8, -1.8, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.8, 0.35]} />
          <meshStandardMaterial color="#b45309" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.6, 0, 0.2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <Text position={[0, -0.65, 0]} fontSize={0.2} color="#b45309" anchorX="center" fontWeight="bold">
          SWAP / DISK
        </Text>
        <Text position={[0, 0, 0.2]} fontSize={0.16} color="#fef3c7" anchorX="center">
          Secondary Store
        </Text>
      </group>
    </group>
  );
}

function Visualizer3D() {
  const [simStep, setSimStep] = useState("idle");
  const [message, setMessage] = useState("Ready: Click an operation to trace the memory bus signal.");

  const startRead = () => {
    setMessage("1. CPU issues virtual address to MMU...");
    setSimStep("cpu-to-mmu");
  };

  const startTLBHit = () => {
    setMessage("1. Address sent to TLB cache for associative match...");
    setSimStep("tlb-check");
  };

  const startPageFault = () => {
    setMessage("1. MMU detects Valid bit = 0 (Page Fault)! Trapping to OS...");
    setSimStep("swap-access");
  };

  const handleStepFinish = () => {
    if (simStep === "cpu-to-mmu") {
      setMessage("2. MMU translated address. Accessing Physical RAM Frame...");
      setSimStep("ram-access");
    } else if (simStep === "tlb-check") {
      setMessage("2. TLB HIT! Translated in <1ns, fetching directly from RAM...");
      setSimStep("ram-access");
    } else if (simStep === "swap-access") {
      setMessage("2. OS Kernel schedules Disk I/O to swap page into RAM...");
      setSimStep("ram-access");
    } else if (simStep === "ram-access") {
      setMessage("Complete! Data transferred to CPU pipeline.");
      setSimStep("idle");
    }
  };

  return (
    <div className="visual-container">
      <div className="visual-overlay">
        <div className="visual-title-pill">VIRTUAL MEMORY BUS ARCHITECTURE</div>
        <div className="visual-controls-pill">
          <button className="visual-action-btn" onClick={startRead}>
            Trace Translation
          </button>
          <button className="visual-action-btn" onClick={startTLBHit} style={{ background: "#7c3aed" }}>
            TLB Hit Flow
          </button>
          <button className="visual-action-btn" onClick={startPageFault} style={{ background: "#dc2626" }}>
            Page Fault Flow
          </button>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 6.5], fov: 42 }} className="visual-canvas">
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 6, 5]} intensity={1.8} castShadow />
        <directionalLight position={[-5, -4, -2]} intensity={0.6} color="#dbeafe" />
        <Float speed={1.2} rotationIntensity={0.06} floatIntensity={0.12}>
          <ArchitectureScene simulationState={simStep} onStepFinish={handleStepFinish} />
        </Float>
        <OrbitControls enablePan={false} minDistance={4.5} maxDistance={9} maxPolarAngle={Math.PI / 2 + 0.2} />
      </Canvas>

      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "14px",
          right: "14px",
          background: "rgba(223, 230, 240, 0.92)",
          backdropFilter: "blur(6px)",
          border: "1px solid var(--border-subtle)",
          padding: "8px 14px",
          borderRadius: "10px",
          fontSize: "12.5px",
          color: "var(--text-main)",
          fontWeight: "600",
          textAlign: "center"
        }}
      >
        {message}
      </div>
    </div>
  );
}

// --- Card Helper ---
const Card = ({ title, children, badge }) => (
  <div className="card">
    <div className="card-title">
      <h3>{title}</h3>
      {badge && <span className="badge-tag highlight">{badge}</span>}
    </div>
    {children}
  </div>
);

// --- Component 1: Overview ---
function OverviewSection({ go }) {
  return (
    <>
      <Visualizer3D />

      <div className="two-cols">
        <Card title="The Problem: Physical Memory Bottlenecks" badge="Core Concept">
          <p>
            In early computing, programs directly accessed physical RAM addresses. If a program had a bug or memory leak, it could crash the operating system or corrupt other programs. Furthermore, programs were strictly constrained by the physical size of RAM installed on the motherboard.
          </p>
          <div className="callout">
            <strong>The Virtual Memory Revolution:</strong> An architectural abstraction created by the OS and hardware MMU (Memory Management Unit) that gives every running process the illusion of its own private, massive, contiguous address space.
          </div>
        </Card>

        <Card title="Key Pillars of Virtual Memory">
          <ul>
            <li>
              <strong>Total Process Isolation:</strong> Process A cannot inspect or modify Process B's memory space, guaranteeing crash protection and security.
            </li>
            <li>
              <strong>Demand Paging:</strong> Only active program pages reside in physical RAM; unused routines remain on disk until called.
            </li>
            <li>
              <strong>Shared Memory & DLLs:</strong> Common libraries (like <code>libc</code> or <code>kernel32.dll</code>) exist once in physical RAM and are mapped into dozens of process spaces.
            </li>
            <li>
              <strong>Memory Protection:</strong> Hardware flags (Read, Write, Execute) prevent code injection and buffer overflows.
            </li>
          </ul>
        </Card>
      </div>

      <h2>How Virtual Memory Compares Across Systems</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Architecture</th>
              <th>Virtual Address Space</th>
              <th>Physical RAM Limits</th>
              <th>Default Page Size</th>
              <th>Page Table Levels</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>x86 32-bit</strong></td>
              <td><span className="code-cell">4 GB (2^32 bytes)</span></td>
              <td>Typically 4 GB (or 64 GB with PAE)</td>
              <td>4 KB</td>
              <td>2 levels (Page Directory + Page Table)</td>
            </tr>
            <tr>
              <td><strong>x86-64 (AMD64)</strong></td>
              <td><span className="code-cell">128 TB to 16 EB</span> (48 or 57-bit canonical)</td>
              <td>Up to 4 PB physical RAM</td>
              <td>4 KB (with 2 MB & 1 GB huge pages)</td>
              <td>4 levels (PML4) or 5 levels (PML5)</td>
            </tr>
            <tr>
              <td><strong>ARM64 (AArch64)</strong></td>
              <td><span className="code-cell">256 TB (48-bit address)</span></td>
              <td>Up to 4 PB physical RAM</td>
              <td>4 KB, 16 KB, or 64 KB</td>
              <td>3 or 4 levels (Translation Table Walk)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>System Architecture Tour</h2>
      <div className="grid3">
        <Card title="1. The MMU">
          <p>
            The <strong>Memory Management Unit</strong> is a dedicated silicon hardware coprocessor inside the CPU die that intercepts every memory reference and performs hardware address translation in real time.
          </p>
          <button className="btn-secondary btn-sm" onClick={() => go("paging")} style={{ marginTop: "10px" }}>
            Explore Paging & MMU →
          </button>
        </Card>

        <Card title="2. The TLB">
          <p>
            Translating an address via multi-level page tables in RAM takes multiple bus cycles. The <strong>Translation Lookaside Buffer</strong> is an ultrafast associative hardware cache that speeds lookups up by over 98%.
          </p>
          <button className="btn-secondary btn-sm" onClick={() => go("tlb")} style={{ marginTop: "10px" }}>
            Explore TLB Cache →
          </button>
        </Card>

        <Card title="3. Swap / Backing Store">
          <p>
            When physical RAM becomes saturated, the OS kernel evicts inactive pages to disk/swap storage via intelligent <strong>Page Replacement Algorithms</strong> (FIFO, LRU, Clock, OPT).
          </p>
          <button className="btn-secondary btn-sm" onClick={() => go("algorithms")} style={{ marginTop: "10px" }}>
            Launch Simulator →
          </button>
        </Card>
      </div>
    </>
  );
}

// --- Component 2: Paging & Address Translation ---
function PagingSection() {
  const [pageSizeKB, setPageSizeKB] = useState(4); // 1, 2, 4 KB
  const [inputHex, setInputHex] = useState("0x3A28");

  // Sample Page Table entries: index 0 to 7
  const samplePageTable = [
    { page: 0, frame: 5, valid: 1, rw: "RW", dirty: 0, access: 1 },
    { page: 1, frame: 12, valid: 1, rw: "R", dirty: 0, access: 1 },
    { page: 2, frame: 3, valid: 1, rw: "RW", dirty: 1, access: 1 },
    { page: 3, frame: 8, valid: 1, rw: "RW", dirty: 0, access: 0 },
    { page: 4, frame: 0, valid: 0, rw: "RW", dirty: 0, access: 0 }, // Invalid: Page Fault!
    { page: 5, frame: 21, valid: 1, rw: "R", dirty: 0, access: 1 },
    { page: 6, frame: 0, valid: 0, rw: "RW", dirty: 0, access: 0 }, // Invalid
    { page: 7, frame: 14, valid: 1, rw: "RW", dirty: 1, access: 1 }
  ];

  // Parse address
  let rawVal = 0;
  try {
    rawVal = parseInt(inputHex, 16);
    if (isNaN(rawVal)) rawVal = 0;
  } catch (e) {
    rawVal = 0;
  }

  const offsetBits = pageSizeKB === 1 ? 10 : pageSizeKB === 2 ? 11 : 12;
  const offsetMask = (1 << offsetBits) - 1;
  const pageNumber = rawVal >> offsetBits;
  const offset = rawVal & offsetMask;

  const targetEntry = samplePageTable.find((x) => x.page === (pageNumber % 8));
  const isPageFault = targetEntry ? targetEntry.valid === 0 : true;
  const physicalFrame = targetEntry?.valid ? targetEntry.frame : null;
  const physicalAddress = physicalFrame !== null ? (physicalFrame << offsetBits) | offset : null;

  return (
    <>
      <div className="two-cols">
        <Card title="The Mathematics of Paging" badge="Hardware Formula">
          <p>
            Logical memory is segmented into fixed-size blocks called <strong>Pages</strong>. Physical memory is divided into equal-sized blocks called <strong>Page Frames</strong>.
          </p>
          <div className="callout teal">
            <strong>Virtual Address Breakdown:</strong>
            <br />
            <code>Virtual Address = (Page Number 'p' × Page Size) + Offset 'd'</code>
            <br />
            The offset <span className="code-cell">d</span> is copied directly to the physical address without modification!
          </div>
          <p>
            Because both pages and frames are identical powers of 2 in size (typically 4,096 bytes = 4 KB = 2<sup>12</sup>), address translation is executed in hardware using rapid bitwise bit shifting and masking.
          </p>
        </Card>

        <Card title="Page Table Entry (PTE) Anatomy">
          <p>Each row in the Page Table stores crucial hardware metadata bits:</p>
          <ul>
            <li><strong>Present / Valid Bit (P):</strong> 1 if page is loaded in physical RAM; 0 if in swap (triggers Page Fault).</li>
            <li><strong>Read / Write (R/W):</strong> 0 = Read-only (e.g. executable code); 1 = Read/Write data.</li>
            <li><strong>User / Supervisor (U/S):</strong> Prevents Ring 3 user programs from accessing kernel pages.</li>
            <li><strong>Dirty / Modified (D):</strong> Set by CPU whenever a write occurs. Dictates if disk writeback is needed upon eviction.</li>
            <li><strong>Accessed / Referenced (A):</strong> Set on reads/writes; used by replacement algorithms like Clock & LRU.</li>
            <li><strong>No-Execute (NX / XD):</strong> Modern hardware security bit preventing execution of malicious shellcode in stack/heap.</li>
          </ul>
        </Card>
      </div>

      <div className="sim-panel">
        <div className="sim-header">
          <div>
            <h3>Interactive MMU Address Translation Engine</h3>
            <p style={{ fontSize: "13px", color: "var(--text-sub)", marginTop: "4px" }}>
              Input any hexadecimal virtual address to watch the MMU split the bits, query the Page Table, and compute the Physical Address.
            </p>
          </div>
          <div className="sim-controls">
            <span style={{ fontSize: "12px", fontWeight: "600" }}>Page Size:</span>
            <button
              className={`btn-secondary btn-sm ${pageSizeKB === 4 ? "tab-btn active" : ""}`}
              onClick={() => setPageSizeKB(4)}
            >
              4 KB (12-bit offset)
            </button>
            <button
              className={`btn-secondary btn-sm ${pageSizeKB === 2 ? "tab-btn active" : ""}`}
              onClick={() => setPageSizeKB(2)}
            >
              2 KB (11-bit offset)
            </button>
            <button
              className={`btn-secondary btn-sm ${pageSizeKB === 1 ? "tab-btn active" : ""}`}
              onClick={() => setPageSizeKB(1)}
            >
              1 KB (10-bit offset)
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
          <label style={{ fontSize: "13px", fontWeight: "700" }}>Virtual Address (Hex):</label>
          <input
            type="text"
            className="input-field"
            value={inputHex}
            onChange={(e) => setInputHex(e.target.value)}
            style={{ width: "130px" }}
          />
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Quick presets:</span>
          <button className="btn-secondary btn-sm" onClick={() => setInputHex("0x02F4")}>
            Page 0 (Code)
          </button>
          <button className="btn-secondary btn-sm" onClick={() => setInputHex("0x3A28")}>
            Page 3 (Heap)
          </button>
          <button className="btn-secondary btn-sm" onClick={() => setInputHex("0x4810")}>
            Page 4 (Fault Target!)
          </button>
          <button className="btn-secondary btn-sm" onClick={() => setInputHex("0x7D3C")}>
            Page 7 (Stack)
          </button>
        </div>

        {/* Bit Splitter */}
        <div className="bit-splitter">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600" }}>
            <span>Hardware Bit Breakdown ({16}-bit simplified demo address)</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>Binary: {rawVal.toString(2).padStart(16, "0")}</span>
          </div>

          <div className="bit-bar">
            <div className="bit-part page">
              <span className="bit-label">Page Number (p) [Bits 15:{offsetBits}]</span>
              <span className="bit-val">
                {pageNumber} (0x{pageNumber.toString(16).toUpperCase()})
              </span>
            </div>
            <div className="bit-part offset">
              <span className="bit-label">Page Offset (d) [Bits {offsetBits - 1}:0]</span>
              <span className="bit-val">
                {offset} (0x{offset.toString(16).toUpperCase().padStart(offsetBits / 4, "0")})
              </span>
            </div>
          </div>
        </div>

        {/* Page Table & Result */}
        <div className="two-cols" style={{ alignItems: "start", marginTop: "20px" }}>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
              Active Process Page Table (Entries 0–7)
            </h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Page #</th>
                    <th>Frame #</th>
                    <th>Valid Bit</th>
                    <th>Permissions</th>
                    <th>Dirty</th>
                    <th>Accessed</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePageTable.map((entry) => {
                    const isSelected = entry.page === (pageNumber % 8);
                    return (
                      <tr
                        key={entry.page}
                        style={{
                          backgroundColor: isSelected
                            ? entry.valid === 1
                              ? "var(--success-tint)"
                              : "var(--danger-tint)"
                            : "transparent",
                          fontWeight: isSelected ? "700" : "normal"
                        }}
                      >
                        <td><span className="code-cell">Page {entry.page}</span></td>
                        <td>{entry.valid === 1 ? <span className="code-cell">Frame {entry.frame}</span> : "—"}</td>
                        <td>
                          {entry.valid === 1 ? (
                            <span style={{ color: "var(--success)", fontWeight: "700" }}>1 (In RAM)</span>
                          ) : (
                            <span style={{ color: "var(--danger)", fontWeight: "700" }}>0 (Disk Swap)</span>
                          )}
                        </td>
                        <td>{entry.rw}</td>
                        <td>{entry.dirty}</td>
                        <td>{entry.access}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
              Translation Output & Hardware Status
            </h4>
            {isPageFault ? (
              <div
                style={{
                  background: "var(--danger-tint)",
                  border: "1px solid var(--danger-border)",
                  borderRadius: "14px",
                  padding: "20px",
                  color: "#991b1b"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "16px" }}>
                  ⚠️ HARDWARE PAGE FAULT TRAP (#PF)
                </div>
                <p style={{ marginTop: "10px", fontSize: "13px", lineHeight: "1.6" }}>
                  Page <strong>{pageNumber % 8}</strong> has its <strong>Valid Bit set to 0</strong>. The target page is not resident in physical RAM.
                </p>
                <div style={{ marginTop: "12px", fontSize: "12px", background: "rgba(255,255,255,0.6)", padding: "10px", borderRadius: "8px" }}>
                  <strong>OS Intervention Triggered:</strong>
                  <br />
                  1. CPU halts current instruction & saves context.
                  <br />
                  2. Interrupt 14 is invoked.
                  <br />
                  3. Kernel fetches Page {pageNumber % 8} from swap storage and updates Page Table.
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--success-tint)",
                  border: "1px solid var(--success-border)",
                  borderRadius: "14px",
                  padding: "20px",
                  color: "#065f46"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "16px" }}>
                  ✓ TRANSLATION SUCCESSFUL
                </div>
                <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span>Physical Frame:</span>
                    <span className="code-cell" style={{ color: "#065f46" }}>Frame {physicalFrame}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span>Offset Preserved:</span>
                    <span className="code-cell" style={{ color: "#065f46" }}>0x{offset.toString(16).toUpperCase()}</span>
                  </div>
                  <hr style={{ border: "0", borderTop: "1px solid var(--success-border)", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "800" }}>
                    <span>Physical Address:</span>
                    <span className="code-cell" style={{ background: "#a7f3d0", color: "#064e3b", fontSize: "14px" }}>
                      0x{physicalAddress.toString(16).toUpperCase().padStart(4, "0")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <h2>Multi-Level Paging: Why Flat Tables Fail</h2>
      <div className="grid2">
        <Card title="The Flat Page Table Disaster">
          <p>
            In a 32-bit system with 4 KB pages, a process can address 2<sup>32</sup> bytes = 4 GB. That yields:
          </p>
          <div className="callout amber">
            <code>4 GB ÷ 4 KB = 1,048,576 pages!</code>
            <br />
            At 4 bytes per Page Table Entry (PTE), each process needs <strong>4 Megabytes of RAM</strong> purely for its page table, even if the program only uses 100 KB! For 100 running apps, that wastes 400 MB of pure overhead.
          </div>
        </Card>

        <Card title="The Hierarchical Solution (x86 & x86-64)">
          <p>
            Modern operating systems use <strong>Multi-Level Paging</strong> (e.g. 4-level PML4 in 64-bit architectures).
          </p>
          <p>
            The master <strong>Page Directory</strong> points to second-level Page Tables. If a vast range of virtual memory is unused (such as the huge void between Heap and Stack), the intermediate page tables are never allocated in RAM!
          </p>
        </Card>
      </div>
    </>
  );
}

// --- Component 3: TLB & Access Latency ---
function TLBSection() {
  const [hitRate, setHitRate] = useState(98); // percentage
  const [tlbLatency, setTlbLatency] = useState(1); // ns
  const [memLatency, setMemLatency] = useState(100); // ns

  // Effective Access Time formula:
  // EAT = h * (t_tlb + t_mem) + (1 - h) * (t_tlb + 2 * t_mem)
  const h = hitRate / 100;
  const eat = h * (tlbLatency + memLatency) + (1 - h) * (tlbLatency + 2 * memLatency);
  const withoutTlb = 2 * memLatency;
  const speedup = (withoutTlb / eat).toFixed(2);

  return (
    <>
      <div className="two-cols">
        <Card title="Why the CPU Needs a TLB" badge="Associative Cache">
          <p>
            Standard address translation requires the hardware to read the Page Table in physical RAM before it can fetch the actual instruction or data. That means <strong>every memory access would require two RAM accesses</strong> (or 5 RAM accesses in 4-level 64-bit paging!).
          </p>
          <div className="callout teal">
            <strong>The Translation Lookaside Buffer (TLB):</strong> A small, ultra-fast, fully associative hardware cache built directly on the CPU die. It caches recent virtual page to physical frame translations and resolves lookups in less than 1 nanosecond.
          </div>
        </Card>

        <Card title="TLB Hit vs Miss Workflow">
          <ol>
            <li>
              <strong>Virtual Address Generated:</strong> CPU instruction executes.
            </li>
            <li>
              <strong>Associative Search:</strong> TLB checks all its entries simultaneously.
            </li>
            <li>
              <strong>TLB HIT (98% of cases):</strong> Frame number is found immediately. Memory is accessed in 1 cycle.
            </li>
            <li>
              <strong>TLB MISS (2% of cases):</strong> Hardware page table walker fetches PTE from DRAM, installs entry into TLB, then accesses data.
            </li>
          </ol>
        </Card>
      </div>

      <div className="sim-panel">
        <div className="sim-header">
          <div>
            <h3>Effective Access Time (EAT) Interactive Simulator</h3>
            <p style={{ fontSize: "13px", color: "var(--text-sub)", marginTop: "4px" }}>
              Explore how TLB hit rate, search speed, and RAM latency dictate overall computer processing speed.
            </p>
          </div>
          <span className="badge-tag highlight">Speedup: {speedup}x Faster</span>
        </div>

        <div className="grid3" style={{ marginBottom: "20px" }}>
          <div className="slider-group">
            <div className="slider-header">
              <span>TLB Hit Rate (h):</span>
              <span className="slider-val">{hitRate}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="1"
              value={hitRate}
              onChange={(e) => setHitRate(Number(e.target.value))}
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span>TLB Latency (t<sub>tlb</sub>):</span>
              <span className="slider-val">{tlbLatency} ns</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={tlbLatency}
              onChange={(e) => setTlbLatency(Number(e.target.value))}
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <span>Main Memory Latency (t<sub>mem</sub>):</span>
              <span className="slider-val">{memLatency} ns</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={memLatency}
              onChange={(e) => setMemLatency(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="stat-pills">
          <div className="stat-pill">
            <span className="stat-pill-label">Effective Access Time (EAT)</span>
            <span className="stat-pill-value" style={{ color: "var(--primary)" }}>
              {eat.toFixed(2)} ns
            </span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-label">Without TLB (2 Memory Reads)</span>
            <span className="stat-pill-value" style={{ color: "var(--danger)" }}>
              {withoutTlb} ns
            </span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-label">Time Saved per Memory Read</span>
            <span className="stat-pill-value" style={{ color: "var(--success)" }}>
              {(withoutTlb - eat).toFixed(2)} ns
            </span>
          </div>
        </div>

        {/* Visual Bar Comparison */}
        <div style={{ marginTop: "24px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>Latency Comparison</div>
          <div className="compare-bar-track">
            <div
              className="compare-bar-fill"
              style={{
                width: `${(eat / withoutTlb) * 100}%`,
                background: "linear-gradient(90deg, #4f46e5, #0891b2)"
              }}
            >
              With TLB: {eat.toFixed(1)} ns
            </div>
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: "600"
              }}
            >
              Without TLB Baseline: {withoutTlb} ns
            </div>
          </div>
        </div>
      </div>

      <h2>Advanced TLB Architecture: ASIDs & Context Switches</h2>
      <div className="grid2">
        <Card title="The Context Switch Dilemma">
          <p>
            When the OS switches from Process A to Process B, their virtual addresses map to completely different physical frames. In older architectures, the CPU was forced to <strong>flush the entire TLB</strong> on every context switch, causing severe performance penalties as cold misses occurred.
          </p>
        </Card>

        <Card title="Modern Solution: ASIDs (Address Space IDs)">
          <p>
            Modern CPUs tag each TLB entry with an <strong>Address Space Identifier (ASID)</strong> or PCID (Process Context ID in x86). The CPU can keep translations for multiple processes simultaneously in the TLB without conflict!
          </p>
        </Card>
      </div>
    </>
  );
}

// --- Component 4: Page Faults & Demand Paging ---
function PageFaultSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: 1,
      title: "Memory Reference by CPU",
      desc: "An application instruction attempts to read or write to a virtual memory address. The MMU inspects the corresponding Page Table entry and detects that the Present/Valid bit is 0.",
      subsystem: "CPU & MMU Hardware",
      badge: "Hardware Step"
    },
    {
      num: 2,
      title: "Hardware Trap to Operating System",
      desc: "The MMU triggers Interrupt Vector 14 (x86 #PF Page Fault Exception). The hardware saves the faulting instruction pointer (EIP/RIP) and registers onto the kernel stack.",
      subsystem: "CPU Interrupt Controller",
      badge: "Trap to Kernel"
    },
    {
      num: 3,
      title: "Address Legality Verification",
      desc: "The OS kernel Page Fault Handler checks the internal process Virtual Memory Area (VMA) descriptors. If the address is invalid (e.g. null pointer), it issues SIGSEGV. If legitimate, it proceeds to fetch the page.",
      subsystem: "OS Kernel Memory Subsystem",
      badge: "Kernel Verification"
    },
    {
      num: 4,
      title: "Physical Frame Allocation",
      desc: "The OS inspects its physical free-frame pool. If memory is full, the OS invokes a Page Replacement Algorithm (such as LRU or Clock) to evict a victim page, writing it back to disk if modified (Dirty bit = 1).",
      subsystem: "Free Frame Pool / Replacer",
      badge: "Frame Allocation"
    },
    {
      num: 5,
      title: "Secondary Storage I/O Read",
      desc: "The OS issues a DMA read command to the NVMe/SSD/HDD backing store to transfer the required 4 KB page into the assigned physical frame. The process is put into a Wait state while I/O completes.",
      subsystem: "Disk Controller & DMA",
      badge: "Disk Transfer"
    },
    {
      num: 6,
      title: "Page Table Update & Instruction Restart",
      desc: "When disk I/O completes, the kernel fills in the physical frame number, sets the Valid bit to 1, restores the CPU register state, and transparently re-executes the exact faulting instruction!",
      subsystem: "MMU & CPU Pipeline",
      badge: "Resume Execution"
    }
  ];

  return (
    <>
      <div className="two-cols">
        <Card title="What is Demand Paging?" badge="The Lazy Swapper">
          <p>
            Rather than loading an entire 2 GB executable into physical memory before launching, modern operating systems employ <strong>Demand Paging</strong>.
          </p>
          <div className="callout amber">
            <strong>The Lazy Pager Rule:</strong> A page is never brought into physical RAM until the CPU explicitly references an address residing inside that page.
          </div>
          <p>
            This allows programs to start virtually instantaneously, dramatically reduces memory consumption, and enables systems to run multi-gigabyte programs on modest hardware.
          </p>
        </Card>

        <Card title="Page Fault Cost & Backing Store Latency">
          <p>
            While memory accesses take roughly <strong>100 nanoseconds</strong>, an I/O read from an SSD or hard drive takes <strong>100 microseconds to 10 milliseconds</strong> (10,000× to 100,000× slower!).
          </p>
          <p>
            Therefore, maintaining a low Page Fault rate (less than 1 fault per 100,000 references) is essential to prevent CPU starvation.
          </p>
        </Card>
      </div>

      <div className="sim-panel">
        <div className="sim-header">
          <div>
            <h3>The 6-Step Page Fault Lifecycle Stepper</h3>
            <p style={{ fontSize: "13px", color: "var(--text-sub)", marginTop: "4px" }}>
              Click through each sequential stage of the hardware exception and OS kernel recovery loop.
            </p>
          </div>
          <div className="sim-controls">
            <button
              className="btn-secondary btn-sm"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            >
              ← Previous Step
            </button>
            <button
              className="btn-primary btn-sm"
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
            >
              Next Step →
            </button>
            <button className="btn-secondary btn-sm" onClick={() => setActiveStep(0)}>
              Reset
            </button>
          </div>
        </div>

        <div className="steps-timeline">
          {steps.map((st, idx) => {
            const isCurrent = idx === activeStep;
            return (
              <div
                key={st.num}
                className={`step-card ${isCurrent ? "active" : ""}`}
                onClick={() => setActiveStep(idx)}
                style={{ cursor: "pointer" }}
              >
                <div className="step-badge">{st.num}</div>
                <div className="step-info">
                  <h4>{st.title}</h4>
                  <p>{st.desc}</p>
                </div>
                <span className="step-tag">{st.badge}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// --- Component 5: Page Replacement Simulator ---
function AlgorithmsSection() {
  const [refString, setRefString] = useState("7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1");
  const [frameCount, setFrameCount] = useState(3);
  const [selectedAlgo, setSelectedAlgo] = useState("FIFO"); // FIFO, LRU, OPT, CLOCK
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [compareResults, setCompareResults] = useState(null);

  // Parse reference string into array of numbers
  const pages = refString
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));

  // Simulation execution for all algorithms
  const runSimulation = (algo, framesTotal, pageSequence) => {
    let memory = []; // array of page numbers
    let stepsData = [];
    let faults = 0;
    let hits = 0;

    // For CLOCK algorithm
    let clockBits = {};
    let clockHand = 0;

    for (let i = 0; i < pageSequence.length; i++) {
      const page = pageSequence[i];
      let isHit = memory.includes(page);
      let victim = null;

      if (isHit) {
        hits++;
        if (algo === "LRU") {
          // move to most recently used (end of memory array)
          memory = memory.filter((p) => p !== page);
          memory.push(page);
        } else if (algo === "CLOCK") {
          clockBits[page] = 1;
        }
      } else {
        faults++;
        if (memory.length < framesTotal) {
          memory.push(page);
          if (algo === "CLOCK") {
            clockBits[page] = 1;
          }
        } else {
          // Eviction needed
          if (algo === "FIFO") {
            victim = memory.shift();
            memory.push(page);
          } else if (algo === "LRU") {
            victim = memory.shift(); // oldest at index 0
            memory.push(page);
          } else if (algo === "OPT") {
            // Find which memory page will not be used for longest time in future
            let farthestDistance = -1;
            let victimIndex = 0;

            for (let m = 0; m < memory.length; m++) {
              const memPage = memory[m];
              let nextUse = -1;
              for (let f = i + 1; f < pageSequence.length; f++) {
                if (pageSequence[f] === memPage) {
                  nextUse = f;
                  break;
                }
              }
              if (nextUse === -1) {
                // Never used again in future! Best victim
                victimIndex = m;
                break;
              } else if (nextUse > farthestDistance) {
                farthestDistance = nextUse;
                victimIndex = m;
              }
            }
            victim = memory[victimIndex];
            memory[victimIndex] = page;
          } else if (algo === "CLOCK") {
            // Second chance circular buffer
            while (true) {
              const candidate = memory[clockHand];
              if (clockBits[candidate] === 1) {
                clockBits[candidate] = 0;
                clockHand = (clockHand + 1) % memory.length;
              } else {
                victim = candidate;
                delete clockBits[candidate];
                memory[clockHand] = page;
                clockBits[page] = 1;
                clockHand = (clockHand + 1) % memory.length;
                break;
              }
            }
          }
        }
      }

      stepsData.push({
        step: i,
        page,
        isHit,
        victim,
        memorySnapshot: [...memory],
        clockHandSnapshot: clockHand,
        clockBitsSnapshot: { ...clockBits }
      });
    }

    return { stepsData, faults, hits, total: pageSequence.length };
  };

  const currentSim = runSimulation(selectedAlgo, frameCount, pages);

  // Auto-play timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < pages.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isPlaying, pages.length]);

  const runBenchmark = () => {
    const algos = ["FIFO", "LRU", "OPT", "CLOCK"];
    const results = algos.map((alg) => {
      const res = runSimulation(alg, frameCount, pages);
      return {
        algo: alg,
        faults: res.faults,
        hits: res.hits,
        hitRate: ((res.hits / res.total) * 100).toFixed(1)
      };
    });
    setCompareResults(results);
  };

  const setBeladyAnomalyPreset = () => {
    setRefString("1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5");
    setSelectedAlgo("FIFO");
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <>
      <div className="two-cols">
        <Card title="Page Replacement Fundamentals" badge="Memory Management">
          <p>
            When a Page Fault occurs and all physical frames are occupied, the operating system must pick a <strong>victim page</strong> to evict to make room for the newly requested page.
          </p>
          <div className="callout teal">
            <strong>The Replacement Challenge:</strong> Pick a victim page that will minimize future page faults. If a dirty page is evicted, it must be written to disk; if an unmodified page is evicted, it can simply be discarded.
          </div>
        </Card>

        <Card title="Algorithms at a Glance">
          <ul>
            <li><strong>FIFO (First-In First-Out):</strong> Evicts the oldest page in memory. Simple queue, but suffers from Belady's Anomaly!</li>
            <li><strong>LRU (Least Recently Used):</strong> Evicts the page unused for the longest time. Highly effective approximation of optimal.</li>
            <li><strong>OPT (Optimal / Clairvoyant):</strong> Replaces the page that will not be used for the longest period in the future. Theoretical lower bound.</li>
            <li><strong>Clock (Second Chance):</strong> Circular list with a reference bit. Approximates LRU with very low hardware overhead.</li>
          </ul>
        </Card>
      </div>

      <div className="sim-panel">
        <div className="sim-header">
          <div>
            <h3>Interactive Page Replacement Simulator</h3>
            <p style={{ fontSize: "13px", color: "var(--text-sub)", marginTop: "4px" }}>
              Watch page hits and page faults evolve step-by-step with real-time memory frame matrices.
            </p>
          </div>

          <div className="sim-controls">
            <button className="btn-secondary btn-sm" onClick={setBeladyAnomalyPreset}>
              ⚡ Belady's Anomaly Test
            </button>
            <button className="btn-secondary btn-sm" onClick={runBenchmark}>
              📊 Run 4-Way Comparison
            </button>
          </div>
        </div>

        {/* Algorithm Tabs */}
        <div className="tabs">
          {["FIFO", "LRU", "OPT", "CLOCK"].map((alg) => (
            <button
              key={alg}
              className={`tab-btn ${selectedAlgo === alg ? "active" : ""}`}
              onClick={() => {
                setSelectedAlgo(alg);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
            >
              {alg} Algorithm
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Reference String (comma-separated):
            </label>
            <input
              type="text"
              className="input-field"
              style={{ width: "100%" }}
              value={refString}
              onChange={(e) => {
                setRefString(e.target.value);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Physical Frames:
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {[3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  className={`btn-secondary btn-sm ${frameCount === num ? "tab-btn active" : ""}`}
                  onClick={() => {
                    setFrameCount(num);
                    setCurrentStep(0);
                    setIsPlaying(false);
                  }}
                >
                  {num} Frames
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "16px 0" }}>
          <button
            className="btn-primary btn-sm"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={currentStep >= pages.length - 1 && !isPlaying}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play Autoplay"}
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep((p) => Math.max(0, p - 1));
            }}
            disabled={currentStep === 0}
          >
            ← Prev Step
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep((p) => Math.min(pages.length - 1, p + 1));
            }}
            disabled={currentStep >= pages.length - 1}
          >
            Next Step →
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
          >
            Reset
          </button>
          <span style={{ fontSize: "13px", fontWeight: "600", marginLeft: "12px" }}>
            Step: {currentStep + 1} / {pages.length}
          </span>
        </div>

        {/* Real-time stats */}
        <div className="stat-pills">
          <div className="stat-pill">
            <span className="stat-pill-label">Total References</span>
            <span className="stat-pill-value">{currentStep + 1}</span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-label">Page Faults</span>
            <span className="stat-pill-value" style={{ color: "var(--danger)" }}>
              {currentSim.stepsData.slice(0, currentStep + 1).filter((s) => !s.isHit).length}
            </span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-label">Page Hits</span>
            <span className="stat-pill-value" style={{ color: "var(--success)" }}>
              {currentSim.stepsData.slice(0, currentStep + 1).filter((s) => s.isHit).length}
            </span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-label">Hit Ratio</span>
            <span className="stat-pill-value" style={{ color: "var(--primary)" }}>
              {(
                (currentSim.stepsData.slice(0, currentStep + 1).filter((s) => s.isHit).length / (currentStep + 1)) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>

        {/* Matrix Visualization */}
        <div className="frame-matrix">
          {/* Reference row */}
          <div className="matrix-header">
            <div
              className="matrix-cell"
              style={{ width: "90px", fontSize: "11px", fontWeight: "800", background: "var(--bg-subtle)" }}
            >
              Ref Page:
            </div>
            {pages.map((p, idx) => (
              <div
                key={idx}
                className={`matrix-cell ref-page ${idx === currentStep ? "active-step" : ""}`}
                style={{ opacity: idx <= currentStep ? 1 : 0.4 }}
              >
                {p}
              </div>
            ))}
          </div>

          {/* Frame rows */}
          {Array.from({ length: frameCount }).map((_, fIdx) => (
            <div key={fIdx} className="matrix-header">
              <div
                className="matrix-cell"
                style={{ width: "90px", fontSize: "11px", fontWeight: "700", background: "var(--bg-card)" }}
              >
                Frame {fIdx}
              </div>
              {pages.map((_, stepIdx) => {
                if (stepIdx > currentStep) {
                  return (
                    <div key={stepIdx} className="matrix-cell" style={{ opacity: 0.2 }}>
                      —
                    </div>
                  );
                }
                const stepObj = currentSim.stepsData[stepIdx];
                const pageInFrame = stepObj.memorySnapshot[fIdx];
                const isJustInserted = stepObj.memorySnapshot[fIdx] === stepObj.page && !stepObj.isHit;

                return (
                  <div
                    key={stepIdx}
                    className={`matrix-cell ${stepIdx === currentStep ? "active-step" : ""}`}
                    style={{
                      background: isJustInserted ? "var(--warning-tint)" : "var(--bg-card)",
                      borderColor: isJustInserted ? "var(--warning-border)" : "var(--border-subtle)",
                      fontWeight: isJustInserted ? "800" : "600"
                    }}
                  >
                    {pageInFrame !== undefined ? pageInFrame : "—"}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Hit / Fault Status Row */}
          <div className="matrix-header" style={{ marginTop: "4px" }}>
            <div
              className="matrix-cell"
              style={{ width: "90px", fontSize: "11px", fontWeight: "800", background: "var(--bg-subtle)" }}
            >
              Status:
            </div>
            {pages.map((_, stepIdx) => {
              if (stepIdx > currentStep) {
                return (
                  <div key={stepIdx} className="matrix-cell" style={{ opacity: 0.2 }}>
                    —
                  </div>
                );
              }
              const stepObj = currentSim.stepsData[stepIdx];
              return (
                <div
                  key={stepIdx}
                  className={`matrix-cell ${stepObj.isHit ? "hit" : "fault"} ${
                    stepIdx === currentStep ? "active-step" : ""
                  }`}
                  style={{ fontSize: "11px", fontWeight: "800" }}
                >
                  {stepObj.isHit ? "HIT" : "FAULT"}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Description Callout */}
        {currentSim.stepsData[currentStep] && (
          <div
            className={`callout ${currentSim.stepsData[currentStep].isHit ? "emerald" : "amber"}`}
            style={{ marginTop: "14px" }}
          >
            <strong>Step {currentStep + 1} Assessment: </strong>
            Referencing Page <strong>{currentSim.stepsData[currentStep].page}</strong>.{" "}
            {currentSim.stepsData[currentStep].isHit ? (
              <span>✓ Page is already present in RAM. <strong>Page Hit!</strong> No I/O needed.</span>
            ) : currentSim.stepsData[currentStep].victim !== null ? (
              <span>
                ✗ Page not in RAM. <strong>Page Fault!</strong> Memory was full; evicted victim Page{" "}
                <strong>{currentSim.stepsData[currentStep].victim}</strong> to make space.
              </span>
            ) : (
              <span>✗ Page not in RAM. <strong>Page Fault!</strong> Placed into an empty physical frame.</span>
            )}
          </div>
        )}

        {/* 4-Way Comparative Benchmark Table */}
        {compareResults && (
          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border-subtle)" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>
              4-Way Algorithm Head-to-Head Comparison ({frameCount} Frames)
            </h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Page Faults (Lower is Better)</th>
                    <th>Page Hits (Higher is Better)</th>
                    <th>Hit Ratio %</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {compareResults.map((r) => {
                    const minFaults = Math.min(...compareResults.map((x) => x.faults));
                    const isWinner = r.faults === minFaults;
                    return (
                      <tr
                        key={r.algo}
                        style={{
                          backgroundColor: isWinner ? "var(--success-tint)" : "transparent",
                          fontWeight: isWinner ? "700" : "normal"
                        }}
                      >
                        <td><strong>{r.algo}</strong></td>
                        <td><span className="code-cell" style={{ color: "var(--danger)" }}>{r.faults} Faults</span></td>
                        <td><span className="code-cell" style={{ color: "var(--success)" }}>{r.hits} Hits</span></td>
                        <td>{r.hitRate}%</td>
                        <td>{isWinner ? "🏆 Optimal / Lowest Faults" : "Sub-optimal"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <h2>Belady's Anomaly: When Adding RAM Causes More Faults</h2>
      <div className="grid2">
        <Card title="The Counter-Intuitive Truth">
          <p>
            Common intuition suggests: <em>"If we give a program more physical frames, page faults must decrease or stay the same."</em>
          </p>
          <div className="callout amber">
            <strong>Belady's Anomaly:</strong> For certain page replacement algorithms (specifically FIFO), increasing the number of physical frames can actually <strong>increase</strong> the total number of page faults!
          </div>
        </Card>

        <Card title="Why LRU and OPT are Immune (Stack Algorithms)">
          <p>
            Algorithms like <strong>LRU</strong> and <strong>OPT</strong> belong to a mathematical class known as <strong>Stack Algorithms</strong>.
          </p>
          <p>
            For any stack algorithm, the set of pages in an <em>n</em>-frame memory is guaranteed to always be a strict subset of the pages in an <em>(n+1)</em>-frame memory. Hence, LRU and OPT can never suffer from Belady's Anomaly!
          </p>
        </Card>
      </div>
    </>
  );
}

// --- Component 6: Thrashing & Advanced Topics ---
function ThrashingSection() {
  const [multiprogrammingDegree, setMultiprogrammingDegree] = useState(8);

  // Thrashing curve math:
  // Up to ~6 processes, CPU utilization rises as CPU has work.
  // Beyond optimal, page faulting dominates and CPU collapses.
  const calculateUtilization = (n) => {
    if (n <= 6) {
      return Math.min(95, 20 + n * 12);
    } else {
      const drop = Math.pow(n - 6, 1.8) * 4.5;
      return Math.max(5, Math.round(92 - drop));
    }
  };

  const currentCpu = calculateUtilization(multiprogrammingDegree);
  const isThrashing = multiprogrammingDegree > 7;

  return (
    <>
      <div className="two-cols">
        <Card title="What is Thrashing?" badge="System Collapse">
          <p>
            <strong>Thrashing</strong> occurs when a computer spends more time moving pages back and forth between RAM and secondary swap storage than executing user applications.
          </p>
          <div className="callout amber">
            <strong>The Thrashing Death Spiral:</strong>
            <br />
            1. Active processes need more pages than available physical RAM.
            <br />
            2. Page fault rate explodes. Processes block waiting for Disk I/O.
            <br />
            3. CPU utilization plunges. The OS scheduler mistakenly thinks the CPU is idle and launches <em>even more processes</em>, catastrophically worsening the disaster!
          </div>
        </Card>

        <Card title="The Working Set Model W(t, Δ)">
          <p>
            Proposed by Peter Denning, the <strong>Working Set Model</strong> relies on the principle of <em>Locality of Reference</em>.
          </p>
          <ul>
            <li><strong>Temporal Locality:</strong> Recently referenced memory is likely to be referenced again soon (e.g. loops, counters).</li>
            <li><strong>Spatial Locality:</strong> Memory adjacent to recently referenced addresses will likely be needed (e.g. array traversals).</li>
            <li><strong>Working Set Window (Δ):</strong> The set of pages referenced by a process in the most recent Δ time units.</li>
          </ul>
        </Card>
      </div>

      <div className="sim-panel">
        <div className="sim-header">
          <div>
            <h3>The Thrashing Curve Simulator</h3>
            <p style={{ fontSize: "13px", color: "var(--text-sub)", marginTop: "4px" }}>
              Adjust the degree of multiprogramming to watch CPU utilization climb and then suffer a catastrophic cliff dive into thrashing.
            </p>
          </div>
          <span className={`badge-tag ${isThrashing ? "highlight" : ""}`} style={{ color: isThrashing ? "var(--danger)" : "var(--success)" }}>
            {isThrashing ? "🚨 CRITICAL THRASHING DETECTED" : "✓ STABLE SYSTEM OPERATING"}
          </span>
        </div>

        <div className="slider-group" style={{ margin: "20px 0" }}>
          <div className="slider-header">
            <span>Degree of Multiprogramming (Active Processes):</span>
            <span className="slider-val">{multiprogrammingDegree} Processes</span>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            step="1"
            value={multiprogrammingDegree}
            onChange={(e) => setMultiprogrammingDegree(Number(e.target.value))}
          />
        </div>

        <div className="stat-pills">
          <div className="stat-pill">
            <span className="stat-pill-label">CPU Utilization</span>
            <span className="stat-pill-value" style={{ color: isThrashing ? "var(--danger)" : "var(--success)" }}>
              {currentCpu}%
            </span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-label">Paging / Disk I/O Bus</span>
            <span className="stat-pill-value" style={{ color: isThrashing ? "var(--danger)" : "var(--text-main)" }}>
              {isThrashing ? "95% Saturation" : "8% Normal"}
            </span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-label">OS Recommendation</span>
            <span className="stat-pill-value" style={{ fontSize: "15px" }}>
              {isThrashing ? "Suspend / Kill Processes" : "Optimal Concurrency"}
            </span>
          </div>
        </div>

        {/* SVG Interactive Curve */}
        <div style={{ marginTop: "24px", background: "var(--bg-inset)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>
            CPU Utilization vs Multiprogramming Curve
          </div>
          <svg viewBox="0 0 500 160" style={{ width: "100%", height: "auto" }}>
            {/* Axis */}
            <line x1="40" y1="140" x2="480" y2="140" stroke="#94a3b8" strokeWidth="2" />
            <line x1="40" y1="20" x2="40" y2="140" stroke="#94a3b8" strokeWidth="2" />

            {/* Thrashing Danger Zone */}
            <rect x="230" y="20" width="250" height="120" fill="rgba(239, 68, 68, 0.08)" />
            <text x="320" y="35" fill="#dc2626" fontSize="10" fontWeight="bold">
              Thrashing Zone
            </text>

            {/* Theoretical curve */}
            <path
              d="M 40 120 Q 140 30, 220 30 T 460 135"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3"
            />

            {/* Current point */}
            {(() => {
              const xPos = 40 + (multiprogrammingDegree / 16) * 420;
              const yPos = 140 - (currentCpu / 100) * 110;
              return (
                <g>
                  <circle cx={xPos} cy={yPos} r="7" fill={isThrashing ? "#dc2626" : "#059669"} />
                  <text x={xPos - 12} y={yPos - 12} fill="#0f172a" fontSize="11" fontWeight="bold">
                    {currentCpu}%
                  </text>
                </g>
              );
            })()}

            <text x="210" y="155" fill="#64748b" fontSize="10">
              Degree of Multiprogramming →
            </text>
            <text x="5" y="15" fill="#64748b" fontSize="9">
              CPU %
            </text>
          </svg>
        </div>
      </div>

      <h2>Modern Virtual Memory Innovations</h2>
      <div className="grid3">
        <Card title="Copy-on-Write (CoW)">
          <p>
            When a Unix process invokes <code>fork()</code>, duplicating memory would be enormously wasteful.
          </p>
          <p>
            Instead, parent and child processes share the exact same physical pages with <strong>Read-Only</strong> permissions. Only if either process writes to a page does the hardware fault and the OS duplicates that single 4 KB page!
          </p>
        </Card>

        <Card title="Transparent Huge Pages (THP)">
          <p>
            Standard 4 KB pages cause millions of TLB misses in database engines and AI training clusters.
          </p>
          <p>
            Modern x86-64 and ARM64 CPUs support <strong>Huge Pages</strong> (2 MB and 1 GB). One 2 MB TLB entry covers 512 individual 4 KB pages, drastically cutting TLB miss rates.
          </p>
        </Card>

        <Card title="Memory-Mapped Files (mmap)">
          <p>
            Rather than reading files via <code>read()</code> system calls and copying bytes between kernel and user buffers, <code>mmap()</code> maps a disk file directly into the virtual address space. File I/O happens through native memory pointers!
          </p>
        </Card>
      </div>
    </>
  );
}

// --- Component 7: Mastery Challenge Quiz ---
function QuizSection() {
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const questions = [
    {
      id: 1,
      q: "In hardware address translation, what happens to the Page Offset (d) when translating a virtual address to physical address?",
      options: [
        "It is translated using the TLB associative cache",
        "It is copied directly to the physical address without modification",
        "It is looked up in the Master Page Directory",
        "It is inverted using bitwise negation"
      ],
      correct: 1,
      explanation: "Because both virtual pages and physical frames are identical in size (e.g. 4,096 bytes), the offset inside the page is identical to the offset inside the physical frame and is copied directly."
    },
    {
      id: 2,
      q: "Why does the Memory Management Unit (MMU) use a Translation Lookaside Buffer (TLB)?",
      options: [
        "To replace the physical DRAM memory modules",
        "To compress page files on the SSD",
        "To avoid multiple slow physical RAM accesses for each memory reference",
        "To schedule process threads on the CPU"
      ],
      correct: 2,
      explanation: "Without a TLB, every memory read requires walking the Page Table in physical DRAM first, cutting system throughput in half (or by 80% on 4-level 64-bit systems)."
    },
    {
      id: 3,
      q: "What is Belady's Anomaly?",
      options: [
        "When page size is increased, physical memory overflows",
        "For FIFO page replacement, giving more physical frames can result in more page faults",
        "LRU consumes more CPU cycles than Optimal replacement",
        "A page fault occurs when referencing an address in physical RAM"
      ],
      correct: 1,
      explanation: "Belady's Anomaly is the counter-intuitive phenomenon where FIFO replacement with more frames causes more page faults. Stack algorithms like LRU and OPT are immune."
    },
    {
      id: 4,
      q: "What is the role of the 'Dirty Bit' in a Page Table Entry (PTE)?",
      options: [
        "It marks the page as containing malicious shellcode",
        "It indicates the page has been modified and must be written to disk when evicted",
        "It locks the page from being read by user processes",
        "It flags that the page has parity or ECC errors"
      ],
      correct: 1,
      explanation: "The Dirty bit is set by the hardware whenever a write operation occurs. If a dirty page is evicted, the OS must write it to swap; if clean, it can be discarded immediately without disk write overhead."
    },
    {
      id: 5,
      q: "Which page replacement algorithm achieves the absolute lowest possible page fault rate for any reference string?",
      options: [
        "Least Recently Used (LRU)",
        "Clock (Second Chance)",
        "Optimal (OPT / MIN)",
        "First-In First-Out (FIFO)"
      ],
      correct: 2,
      explanation: "Optimal replacement (OPT/MIN) replaces the page that will not be used for the longest time in the future. While impossible to implement in practice (requires future clairvoyance), it is the theoretical benchmark."
    },
    {
      id: 6,
      q: "What primary condition leads to system Thrashing?",
      options: [
        "The CPU clock speed is set too high",
        "The sum of the working sets of all active processes exceeds available physical RAM",
        "The TLB hit rate reaches 100%",
        "Processes share too many read-only library files"
      ],
      correct: 1,
      explanation: "Thrashing occurs when total working set sizes exceed physical DRAM capacity. The OS is forced into continuous page faulting and disk paging, driving CPU utilization toward zero."
    }
  ];

  const handleSelect = (qId, optionIdx) => {
    setSelectedAnswers({ ...selectedAnswers, [qId]: optionIdx });
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter((q) => selectedAnswers[q.id] === q.correct).length;

  return (
    <>
      <div className="sim-panel">
        <div className="sim-header">
          <div>
            <h3>Virtual Memory Architecture Knowledge Challenge</h3>
            <p style={{ fontSize: "13px", color: "var(--text-sub)", marginTop: "4px" }}>
              Validate your mastery of Paging, TLB, Page Replacement Algorithms, and Kernel Memory Systems.
            </p>
          </div>
          <div className="stat-pill" style={{ minWidth: "160px" }}>
            <span className="stat-pill-label">Score Tracker</span>
            <span className="stat-pill-value" style={{ color: "var(--primary)" }}>
              {correctCount} / {questions.length}
            </span>
          </div>
        </div>

        {answeredCount === questions.length && (
          <div
            className={`callout ${correctCount === questions.length ? "emerald" : "teal"}`}
            style={{ marginBottom: "20px" }}
          >
            {correctCount === questions.length
              ? "🎉 Outstanding! You scored 100% on the Virtual Memory Master Exam!"
              : `You scored ${correctCount} out of ${questions.length}. Review the explanations below to refine your knowledge.`}
          </div>
        )}

        <div className="quiz-grid">
          {questions.map((q, idx) => {
            const userChoice = selectedAnswers[q.id];
            const isAnswered = userChoice !== undefined;
            const isCorrect = userChoice === q.correct;

            return (
              <div key={q.id} className="quiz-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-main)" }}>
                    {idx + 1}. {q.q}
                  </h4>
                  {isAnswered && (
                    <span className={`badge-tag ${isCorrect ? "highlight" : ""}`} style={{ color: isCorrect ? "var(--success)" : "var(--danger)" }}>
                      {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  )}
                </div>

                <div className="quiz-options">
                  {q.options.map((opt, optIdx) => {
                    let className = "quiz-option";
                    if (isAnswered) {
                      if (optIdx === q.correct) className += " correct";
                      else if (optIdx === userChoice) className += " wrong";
                    }

                    return (
                      <button
                        key={optIdx}
                        className={className}
                        onClick={() => handleSelect(q.id, optIdx)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className={`quiz-feedback ${isCorrect ? "success" : "error"}`}>
                    <strong>Explanation: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// --- Main App Root ---
function App() {
  const [activeTab, setActiveTab] = useState("overview");

  const currentTopic = topics.find((x) => x.id === activeTab);
  const currentIndex = topics.findIndex((x) => x.id === activeTab);

  const goTo = (id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      {/* Top Header */}
      <header>
        <div className="brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M6 18h12M6 12h12M6 6h12" />
            </svg>
          </div>
          <div>
            <div className="brand-title">VIRTUAL MEMORY ATELIER</div>
            <div className="brand-subtitle">Computer Systems & OS Architecture</div>
          </div>
        </div>

        <div className="header-badges">
          <span className="badge-tag">Light Theme (Calibrated Slate)</span>
          <span className="badge-tag highlight">Interactive 3D & Simulators</span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="layout">
        {/* Navigation Sidebar */}
        <aside>
          <div className="nav-section-title">Interactive Modules</div>
          <div className="nav-list">
            {topics.map((t) => (
              <button
                key={t.id}
                className={`nav-item ${activeTab === t.id ? "active" : ""}`}
                onClick={() => goTo(t.id)}
              >
                <span className="nav-number">{t.label}</span>
                <div className="nav-content">
                  <strong>{t.title}</strong>
                  <small>{t.sub}</small>
                </div>
              </button>
            ))}
          </div>

          <div className="sidebar-box">
            <h4>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Curriculum Progress
            </h4>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${((currentIndex + 1) / topics.length) * 100}%` }}
              />
            </div>
            <small style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
              Module {currentIndex + 1} of {topics.length} completed.
            </small>
          </div>
        </aside>

        {/* Content Pane */}
        <main>
          <section className="hero">
            <div className="eyebrow">OPERATING SYSTEMS • VIRTUAL MEMORY</div>
            <h1>{currentTopic.title}</h1>
            <p className="hero-description">{currentTopic.sub}</p>
            <div className="hero-tags">
              <span className="hero-tag">Hardware MMU</span>
              <span className="hero-tag">Paging & Frames</span>
              <span className="hero-tag">Demand Paging</span>
              <span className="hero-tag">TLB Optimization</span>
              <span className="hero-tag">Replacement Algorithms</span>
            </div>
          </section>

          {/* Render Active Module */}
          {activeTab === "overview" && <OverviewSection go={goTo} />}
          {activeTab === "paging" && <PagingSection />}
          {activeTab === "tlb" && <TLBSection />}
          {activeTab === "pagefault" && <PageFaultSection />}
          {activeTab === "algorithms" && <AlgorithmsSection />}
          {activeTab === "thrashing" && <ThrashingSection />}
          {activeTab === "quiz" && <QuizSection />}

          {/* Bottom Pager */}
          <div className="pager">
            <button
              className="btn-secondary"
              disabled={currentIndex === 0}
              onClick={() => goTo(topics[Math.max(0, currentIndex - 1)].id)}
            >
              ← Previous Module
            </button>
            <button
              className="btn-primary"
              disabled={currentIndex === topics.length - 1}
              onClick={() => goTo(topics[Math.min(topics.length - 1, currentIndex + 1)].id)}
            >
              Next Module →
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

// Render into DOM
createRoot(document.getElementById("root")).render(<App />);
