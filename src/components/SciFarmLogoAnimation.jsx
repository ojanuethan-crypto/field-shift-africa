import React, { useEffect, useRef, useCallback } from 'react';

// Orbit geometry matching the SciFarm logo
const CX = 400;
const CY = 180;
const RX = 98;
const RY = 27;
const ANGLE_RAD = (-27 * Math.PI) / 180;
const COS_A = Math.cos(ANGLE_RAD);
const SIN_A = Math.sin(ANGLE_RAD);

const TOTAL_SAMPLES = 240;
const T_RING_START = 0.14;
const T_RING_END = Math.PI * 2 - 0.14;
const T_DOT_START = 0.14;
const T_DOT_END = Math.PI * 2;
const T_BACK_BOUNDARY = Math.PI * 1.07;

function getOrbitPoint(t) {
  const lx = RX * Math.cos(t);
  const ly = RY * Math.sin(t);
  return {
    x: CX + lx * COS_A - ly * SIN_A,
    y: CY + lx * SIN_A + ly * COS_A,
  };
}

const RING_POINTS = Array.from({ length: TOTAL_SAMPLES }, (_, i) => {
  const t = T_RING_START + (i / (TOTAL_SAMPLES - 1)) * (T_RING_END - T_RING_START);
  return { ...getOrbitPoint(t), t };
});

function pointsToPath(pts) {
  if (pts.length < 2) return '';
  return pts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// NOTE: pass a stable (useCallback) onComplete, otherwise the animation restarts on every render.
export default function SciFarmLogoAnimation({
  duration = 1800,
  autoPlay = true,
  showReplayButton = true,
  onComplete,
  className = '',
}) {
  const orbitBackRef = useRef(null);
  const orbitFrontHaloRef = useRef(null);
  const orbitFrontRef = useRef(null);
  const yellowDotRef = useRef(null);
  const wordmarkRef = useRef(null);

  const animFrameRef = useRef(null);
  const timeoutRef = useRef(null);

  const cancelRunning = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const runAnimation = useCallback(() => {
    cancelRunning();

    const orbitBack = orbitBackRef.current;
    const orbitFrontHalo = orbitFrontHaloRef.current;
    const orbitFront = orbitFrontRef.current;
    const yellowDot = yellowDotRef.current;
    const wordmark = wordmarkRef.current;

    if (!orbitBack || !orbitFrontHalo || !orbitFront || !yellowDot || !wordmark) {
      return;
    }

    // Reset wordmark immediately without transition
    wordmark.style.transition = 'none';
    wordmark.style.opacity = '0';
    wordmark.style.transform = 'translateY(14px)';
    void wordmark.getBoundingClientRect();
    wordmark.style.transition =
      'opacity 0.65s ease-out, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)';

    // Clear ring paths
    orbitBack.setAttribute('d', '');
    orbitFrontHalo.setAttribute('d', '');
    orbitFront.setAttribute('d', '');

    // Position yellow dot at start
    const startPos = getOrbitPoint(T_DOT_START);
    yellowDot.setAttribute('cx', startPos.x.toFixed(2));
    yellowDot.setAttribute('cy', startPos.y.toFixed(2));
    yellowDot.setAttribute('opacity', '1');

    let startTime = null;

    const frame = (now) => {
      if (startTime === null) startTime = now;

      const elapsed = Math.max(0, now - startTime);
      const rawProgress = Math.max(0, Math.min(elapsed / duration, 1));
      const eased = easeInOutCubic(rawProgress);

      const dotT = T_DOT_START + eased * (T_DOT_END - T_DOT_START);
      const dotPos = getOrbitPoint(dotT);
      yellowDot.setAttribute('cx', dotPos.x.toFixed(2));
      yellowDot.setAttribute('cy', dotPos.y.toFixed(2));

      const maxRingT = Math.min(dotT - 0.14, T_RING_END);
      const frontPoints = [];
      const backPoints = [];

      for (let i = 0; i < RING_POINTS.length; i++) {
        const p = RING_POINTS[i];
        if (p.t > maxRingT) break;
        if (p.t <= T_BACK_BOUNDARY) {
          frontPoints.push(p);
        }
        if (p.t >= T_BACK_BOUNDARY - 0.08) {
          backPoints.push(p);
        }
      }

      const frontD = pointsToPath(frontPoints);
      orbitFrontHalo.setAttribute('d', frontD);
      orbitFront.setAttribute('d', frontD);
      orbitBack.setAttribute('d', pointsToPath(backPoints));

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(frame);
      } else {
        animFrameRef.current = null;
        timeoutRef.current = setTimeout(() => {
          if (wordmarkRef.current) {
            wordmarkRef.current.style.opacity = '1';
            wordmarkRef.current.style.transform = 'translateY(0px)';
          }
          if (onComplete) onComplete();
        }, 160);
      }
    };

    animFrameRef.current = requestAnimationFrame(frame);
  }, [cancelRunning, duration, onComplete]);

  useEffect(() => {
    if (autoPlay) {
      runAnimation();
    }
    return cancelRunning;
  }, [autoPlay, runAnimation, cancelRunning]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        width: '100%',
      }}
    >
      <div
        style={{
          width: 'min(90vw, 800px)',
          aspectRatio: '16 / 9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 800 450"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          {/* Orbit Back Layer (behind leaf) */}
          <path
            ref={orbitBackRef}
            fill="none"
            stroke="#134227"
            strokeWidth="8.5"
            strokeLinecap="round"
          />

          {/* Leaf Icon */}
          <g>
            <path
              d="M 400 258
                 C 363 226, 342 190, 342 154
                 C 342 120, 368 102, 400 102
                 C 432 102, 458 120, 458 154
                 C 458 190, 437 226, 400 258 Z"
              fill="#2C6B43"
              stroke="#134227"
              strokeWidth="8"
              strokeLinejoin="round"
            />
            <line x1="400" y1="108" x2="400" y2="250" stroke="#134227" strokeWidth="7.5" strokeLinecap="round" />
            <line x1="400" y1="156" x2="379" y2="135" stroke="#134227" strokeWidth="7.5" strokeLinecap="round" />
            <line x1="400" y1="156" x2="421" y2="135" stroke="#134227" strokeWidth="7.5" strokeLinecap="round" />
            <line x1="400" y1="194" x2="371" y2="165" stroke="#134227" strokeWidth="7.5" strokeLinecap="round" />
            <line x1="400" y1="194" x2="429" y2="165" stroke="#134227" strokeWidth="7.5" strokeLinecap="round" />
          </g>

          {/* Orbit Front Cutout (white halo separating ring from leaf) */}
          <path
            ref={orbitFrontHaloRef}
            fill="none"
            stroke="#ffffff"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Orbit Front Layer (in front of leaf) */}
          <path
            ref={orbitFrontRef}
            fill="none"
            stroke="#134227"
            strokeWidth="8.5"
            strokeLinecap="round"
          />

          {/* Yellow Dot */}
          <circle ref={yellowDotRef} cx="0" cy="0" r="8.5" fill="#F4C446" opacity="0" />

          {/* Brand Name */}
          <g
            ref={wordmarkRef}
            style={{
              fontFamily: "'Fredoka', 'Nunito', 'Arial Rounded MT Bold', sans-serif",
              fontWeight: 700,
              fontSize: '68px',
              letterSpacing: '-1px',
              opacity: 0,
              transform: 'translateY(14px)',
            }}
          >
            <text x="400" y="348" textAnchor="middle">
              <tspan fill="#75C78E">Sci</tspan>
              <tspan fill="#134227">Farm</tspan>
            </text>
          </g>
        </svg>
      </div>

      {showReplayButton && (
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={runAnimation}
            style={{
              padding: '10px 22px',
              border: 'none',
              borderRadius: '999px',
              background: '#134227',
              color: '#ffffff',
              fontFamily: "'Fredoka', 'Nunito', 'Arial Rounded MT Bold', sans-serif",
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Replay Animation
          </button>
        </div>
      )}
    </div>
  );
}
