import { useState } from 'react'
import Chip from './Chip'
import './App.css'

const NUM_PORTS = 3

type ChipConfig = {
  id: number
  code: string
  inputSources: string[]
  outputs: string[]
}

export default function Workspace() {
  const [inputs, setInputs] = useState<string[]>(Array(NUM_PORTS).fill(''))
  const [outputs, setOutputs] = useState<string[]>(Array(NUM_PORTS).fill(''))
  const [chips, setChips] = useState<ChipConfig[]>([])
  const [wsOutSources, setWsOutSources] = useState<string[]>(
    Array(NUM_PORTS).fill('')
  )

  const addChip = () => {
    const id = chips.length
    setChips([
      ...chips,
      {
        id,
        code: 'IN 1\nOUT 1',
        inputSources: Array(NUM_PORTS)
          .fill(0)
          .map((_, i) => `w:${i}`),
        outputs: Array(NUM_PORTS).fill(''),
      },
    ])
  }

  const setChipCode = (id: number, code: string) => {
    setChips(chips.map((c) => (c.id === id ? { ...c, code } : c)))
  }

  const setInputSource = (id: number, port: number, source: string) => {
    setChips(
      chips.map((c) =>
        c.id === id
          ? {
              ...c,
              inputSources: c.inputSources.map((s, i) =>
                i === port ? source : s
              ),
            }
          : c
      )
    )
  }

  const setWorkspaceOutSource = (i: number, source: string) => {
    const next = [...wsOutSources]
    next[i] = source
    setWsOutSources(next)
  }

  const run = () => {
    const chipOutputs: Record<number, string[]> = {}

    const runChip = (code: string, ins: string[]) => {
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
          acc = ins[port]
        } else if (op?.toUpperCase() === 'OUT' && port >= 0 && port < NUM_PORTS) {
          outs[port] = acc
        }
      })
      return outs
    }

    chips.forEach((chip) => {
      const ins = chip.inputSources.map((src) => {
        const [type, a, b] = src.split(':')
        if (type === 'w') return inputs[parseInt(a)]
        if (type === 'c')
          return chipOutputs[parseInt(a)]?.[parseInt(b)] || ''
        return ''
      })
      chipOutputs[chip.id] = runChip(chip.code, ins)
    })

    setChips(
      chips.map((c) => ({ ...c, outputs: chipOutputs[c.id] || c.outputs }))
    )

    const wsOuts = wsOutSources.map((src) => {
      const [type, a, b] = src.split(':')
      if (type === 'w') return inputs[parseInt(a)] || ''
      if (type === 'c') return chipOutputs[parseInt(a)]?.[parseInt(b)] || ''
      return ''
    })
    setOutputs(wsOuts)
  }

  const inputOptions = Array.from({ length: NUM_PORTS }, (_, i) => ({
    value: `w:${i}`,
    label: `IN ${i + 1}`,
  }))

  const workspaceOutputOptions = [
    ...inputOptions,
    ...chips.flatMap((chip, i) =>
      Array.from({ length: NUM_PORTS }, (_, j) => ({
        value: `c:${chip.id}:${j}`,
        label: `Chip ${i + 1} OUT ${j + 1}`,
      }))
    ),
  ]

  return (
    <div className="workspace">
      <div className="workspace-io">
        <div className="inputs">
          {inputs.map((value, i) => (
            <input
              key={i}
              value={value}
              placeholder={`IN ${i + 1}`}
              onChange={(e) => {
                const next = [...inputs]
                next[i] = e.target.value
                setInputs(next)
              }}
            />
          ))}
        </div>
        <div className="outputs">
          {outputs.map((value, i) => (
            <div key={i} className="output">
              {value}
            </div>
          ))}
        </div>
        <div className="outputs">
          {wsOutSources.map((src, i) => (
            <select
              key={i}
              value={src}
              onChange={(e) => setWorkspaceOutSource(i, e.target.value)}
            >
              <option value="">Select</option>
              {workspaceOutputOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
      <div className="chips">
        {chips.map((chip, index) => (
          <Chip
            key={chip.id}
            id={chip.id}
            code={chip.code}
            setCode={(code) => setChipCode(chip.id, code)}
            outputs={chip.outputs}
            inputSources={chip.inputSources}
            setInputSource={(p, s) => setInputSource(chip.id, p, s)}
            options={[
              ...inputOptions,
              ...chips
                .slice(0, index)
                .flatMap((c, ci) =>
                  Array.from({ length: NUM_PORTS }, (_, j) => ({
                    value: `c:${c.id}:${j}`,
                    label: `Chip ${ci + 1} OUT ${j + 1}`,
                  }))
                ),
            ]}
          />
        ))}
      </div>
      <button className="run" onClick={run}>
        Run
      </button>
      <button className="run" onClick={addChip}>
        Add Chip
      </button>
    </div>
  )
}
