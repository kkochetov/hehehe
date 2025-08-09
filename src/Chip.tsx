import './App.css'
import type { ChangeEvent } from 'react'

interface ChipProps {
  id: number
  code: string
  setCode: (code: string) => void
  outputs: string[]
  inputSources: string[]
  setInputSource: (port: number, source: string) => void
  options: { value: string; label: string }[]
}

export default function Chip({
  code,
  setCode,
  outputs,
  inputSources,
  setInputSource,
  options,
}: ChipProps) {
  const handleSelect = (i: number) => (e: ChangeEvent<HTMLSelectElement>) => {
    setInputSource(i, e.target.value)
  }

  return (
    <div className="chip">
      <div className="inputs">
        {inputSources.map((src, i) => (
          <select key={i} value={src} onChange={handleSelect(i)}>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>
      <textarea className="code" value={code} onChange={(e) => setCode(e.target.value)} />
      <div className="outputs">
        {outputs.map((value, i) => (
          <div key={i} className="output">
            {value}
          </div>
        ))}
      </div>
    </div>
  )
}
