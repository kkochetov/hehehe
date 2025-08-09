import { useState } from 'react'
import './App.css'

const NUM_PORTS = 3

function App() {
  const [inputs, setInputs] = useState<string[]>(Array(NUM_PORTS).fill(''))
  const [outputs, setOutputs] = useState<string[]>(Array(NUM_PORTS).fill(''))
  const [code, setCode] = useState<string>('IN 1\nOUT 1')

  const handleInputChange = (index: number, value: string) => {
    const next = [...inputs]
    next[index] = value
    setInputs(next)
  }

  const runCode = () => {
    const lines = code
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    let acc = ''
    const outs = Array(NUM_PORTS).fill('')

    lines.forEach((line) => {
      const [op, arg] = line.split(/\s+/)
      const port = parseInt(arg) - 1
      if (op?.toUpperCase() === 'IN' && port >= 0 && port < NUM_PORTS) {
        acc = inputs[port]
      } else if (op?.toUpperCase() === 'OUT' && port >= 0 && port < NUM_PORTS) {
        outs[port] = acc
      }
    })

    setOutputs(outs)
  }

  return (
    <div className="app">
      <div className="chip">
        <div className="inputs">
          {inputs.map((value, i) => (
            <input
              key={i}
              value={value}
              placeholder={`IN ${i + 1}`}
              onChange={(e) => handleInputChange(i, e.target.value)}
            />
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
      <button className="run" onClick={runCode}>
        Run
      </button>
    </div>
  )
}

export default App

