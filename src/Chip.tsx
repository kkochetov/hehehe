import './App.css'
import type React from 'react'

interface ChipProps {
  id: number
  code: string
  setCode: (code: string) => void
  outputs: string[]
  position: { x: number; y: number }
  onDragStart: (id: number, e: React.MouseEvent<HTMLDivElement>) => void
  registerPort: (id: string, el: HTMLDivElement | null) => void
  startConnection: (id: string, e: React.MouseEvent<HTMLDivElement>) => void
  finishConnection: (id: string) => void
}

export default function Chip({
  id,
  code,
  setCode,
  outputs,
  position,
  onDragStart,
  registerPort,
  startConnection,
  finishConnection,
}: ChipProps) {
  return (
    <div
      className="chip"
      style={{ left: position.x, top: position.y }}
      onMouseDown={(e) => onDragStart(id, e)}
    >
      <div className="inputs">
        {outputs.map((_, i) => (
          <div
            key={i}
            className="port input"
            ref={(el) => registerPort(`ci:${id}:${i}`, el)}
            onMouseUp={() => finishConnection(`ci:${id}:${i}`)}
          ></div>
        ))}
      </div>
      <textarea
        className="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <div className="outputs">
        {outputs.map((value, i) => (
          <div key={i} className="output">
            {value}
            <div
              className="port output"
              ref={(el) => registerPort(`c:${id}:${i}`, el)}
              onMouseDown={(e) => startConnection(`c:${id}:${i}`, e)}
            ></div>
          </div>
        ))}
      </div>
    </div>
  )
}

