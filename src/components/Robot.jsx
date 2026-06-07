import React, { useRef, useEffect } from 'react'

// Simple SVG robot that turns its head/eyes toward a target {x,y}
export default function Robot({ target, idle }) {
  const headRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()
  const raf = useRef(null)

  useEffect(() => {
    const node = headRef.current
    if (!node) return
    let last = { x: 0, y: 0 }

    const update = () => {
      if (!target) return
      const rect = node.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = target.x - cx
      const dy = target.y - cy
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      // limit rotation
      const limited = Math.max(-30, Math.min(30, angle))
      node.style.transform = `rotate(${limited}deg)`

      // eyes move as translation within small bounds
      const maxEyeOffset = 4
      const dist = Math.sqrt(dx*dx + dy*dy)
      const factor = Math.min(1, dist / 200)
      const ex = Math.round((dx / (dist || 1)) * maxEyeOffset * factor)
      const ey = Math.round((dy / (dist || 1)) * maxEyeOffset * factor)
      if (leftEyeRef.current) leftEyeRef.current.style.transform = `translate(${ex}px, ${ey}px)`
      if (rightEyeRef.current) rightEyeRef.current.style.transform = `translate(${ex}px, ${ey}px)`

      raf.current = requestAnimationFrame(update)
    }

    raf.current = requestAnimationFrame(update)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target])

  return (
    <div aria-hidden className={`robot absolute left-6 top-12 w-56 h-56 pointer-events-none ${idle ? 'robot-idle' : ''}`}>
      <style>{`
        .robot.robot-idle { animation: bob 3s ease-in-out infinite; }
        @keyframes bob { 0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)} }
        .robot .pupil { transform-origin: center; animation: blink 4s infinite; }
        @keyframes blink { 0%,92%{transform:scaleY(1)}95%{transform:scaleY(0.15)}100%{transform:scaleY(1)} }
      `}</style>
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        {/* body */}
        <rect x="20" y="40" width="80" height="60" rx="8" fill="#E8FFF2" stroke="#56C596" />
        {/* head group to rotate */}
        <g ref={headRef} style={{ transformOrigin: '60px 30px', transition: 'transform 120ms linear' }}>
          <rect x="30" y="8" width="60" height="40" rx="6" fill="#F0FFF6" stroke="#56C596" />
          {/* antenna */}
          <line x1="60" y1="4" x2="60" y2="8" stroke="#56C596" strokeWidth="2" />
          <circle cx="60" cy="4" r="3" fill="#FFD166" />
          {/* eyes */}
          <g>
            <circle cx="46" cy="28" r="6" fill="#fff" stroke="#C9F0DF" />
            <circle ref={leftEyeRef} className="pupil" cx="46" cy="28" r="2.5" fill="#0B3D2E" />
            <circle cx="74" cy="28" r="6" fill="#fff" stroke="#C9F0DF" />
            <circle ref={rightEyeRef} className="pupil" cx="74" cy="28" r="2.5" fill="#0B3D2E" />
          </g>
        </g>
        {/* smile */}
        <path d="M44 46 q16 12 32 0" stroke="#2F8F6A" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}
