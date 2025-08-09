import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type React from 'react'
import Chip from './Chip'
import './App.css'

const NUM_PORTS = 3

type ChipConfig = {
  id: number
  code: string
  inputSources: string[]
  outputs: string[]
  x: number
  y: number
}

type Connection = { from: string; to: string }

export default function Workspace() {
  const [inputs, setInputs] = useState<string[]>(Array(NUM_PORTS).fill(''))
  const [outputs, setOutputs] = useState<string[]>(Array(NUM_PORTS).fill(''))
  const [chips, setChips] = useState<ChipConfig[]>([])
  const [wsOutSources, setWsOutSources] = useState<string[]>(
    Array(NUM_PORTS).fill('')
  )

  const workspaceRef = useRef<HTMLDivElement>(null)
  const portRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [portPos, setPortPos] = useState<Record<string, { x: number; y: number }>>({})
  const [draggingChip, setDraggingChip] = useState<{
    id: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const [connecting, setConnecting] = useState<{ from: string; x: number; y: number } | null>(
    null
  )

  const updatePortPositions = useCallback(() => {
    const wsRect = workspaceRef.current?.getBoundingClientRect()
    if (!wsRect) return
    const pos: Record<string, { x: number; y: number }> = {}
    Object.entries(portRefs.current).forEach(([id, el]) => {
      if (el) {
        const r = el.getBoundingClientRect()
        pos[id] = {
          x: r.left + r.width / 2 - wsRect.left,
          y: r.top + r.height / 2 - wsRect.top,
        }
      }
    })
    setPortPos((prev) => {
      const same =
        Object.keys(prev).length === Object.keys(pos).length &&
        Object.entries(pos).every(
          ([key, value]) => prev[key]?.x === value.x && prev[key]?.y === value.y,
        )
      return same ? prev : pos
    })
  }, [])

  const raf = useRef<number | null>(null)

  const schedulePortPosUpdate = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      updatePortPositions()
      raf.current = null
    })
  }, [updatePortPositions])

  const registerPort = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      if (el) portRefs.current[id] = el
      else delete portRefs.current[id]
      schedulePortPosUpdate()
    },
    [schedulePortPosUpdate],
  )

  useLayoutEffect(() => {
    updatePortPositions()
  }, [chips, wsOutSources, updatePortPositions])

  const addChip = () => {
    const id = chips.length
    setChips([
      ...chips,
      {
        id,
        code: 'IN 1\nOUT 1',
        inputSources: Array(NUM_PORTS).fill(''),
        outputs: Array(NUM_PORTS).fill(''),
        x: 100 + id * 20,
        y: 100,
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

  const handleChipMouseDown = (
    id: number,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      (e.target as HTMLElement).classList.contains('port') ||
      e.target instanceof HTMLTextAreaElement
    )
      return
    const chip = chips.find((c) => c.id === id)
    if (!chip) return
    setDraggingChip({ id, offsetX: e.clientX - chip.x, offsetY: e.clientY - chip.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingChip) {
      setChips(
        chips.map((c) =>
          c.id === draggingChip.id
            ? {
                ...c,
                x: e.clientX - draggingChip.offsetX,
                y: e.clientY - draggingChip.offsetY,
              }
            : c
        )
      )
      updatePortPositions()
    } else if (connecting) {
      const wsRect = workspaceRef.current?.getBoundingClientRect()
      if (wsRect)
        setConnecting({
          ...connecting,
          x: e.clientX - wsRect.left,
          y: e.clientY - wsRect.top,
        })
    }
  }

  const handleMouseUp = () => {
    setDraggingChip(null)
    setConnecting(null)
  }

  const startConnection = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    updatePortPositions()
    const wsRect = workspaceRef.current?.getBoundingClientRect()
    if (!wsRect) return
    setConnecting({ from: id, x: e.clientX - wsRect.left, y: e.clientY - wsRect.top })
    e.stopPropagation()
  }

  const finishConnection = (destId: string) => {
    if (!connecting) return
    if (destId.startsWith('ci:')) {
      const [, chipId, port] = destId.split(':')
      setInputSource(parseInt(chipId), parseInt(port), connecting.from)
    } else if (destId.startsWith('wo:')) {
      const [, port] = destId.split(':')
      setWorkspaceOutSource(parseInt(port), connecting.from)
    }
    setConnecting(null)
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
        if (type === 'c') return chipOutputs[parseInt(a)]?.[parseInt(b)] || ''
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

  const connections: Connection[] = [
    ...chips
      .flatMap((chip) =>
        chip.inputSources.map((src, i) =>
          src ? { from: src, to: `ci:${chip.id}:${i}` } : null
        )
      )
      .filter((c): c is Connection => !!c),
    ...wsOutSources
      .map((src, i) => (src ? { from: src, to: `wo:${i}` } : null))
      .filter((c): c is Connection => !!c),
  ]

  return (
    <div
      className="workspace"
      ref={workspaceRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <svg className="connections">
        {connections.map((c, i) => {
          const from = portPos[c.from]
          const to = portPos[c.to]
          if (!from || !to) return null
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="white"
            />
          )
        })}
        {connecting && portPos[connecting.from] && (
          <line
            x1={portPos[connecting.from].x}
            y1={portPos[connecting.from].y}
            x2={connecting.x}
            y2={connecting.y}
            stroke="white"
          />
        )}
      </svg>
      <div className="workspace-io">
        <div className="inputs">
          {inputs.map((value, i) => (
            <div key={i} className="input-wrapper">
              <input
                value={value}
                placeholder={`IN ${i + 1}`}
                onChange={(e) => {
                  const next = [...inputs]
                  next[i] = e.target.value
                  setInputs(next)
                }}
              />
              <div
                className="port output"
                ref={(el) => registerPort(`w:${i}`, el)}
                onMouseDown={(e) => startConnection(`w:${i}`, e)}
              ></div>
            </div>
          ))}
        </div>
        <div className="outputs">
          {outputs.map((value, i) => (
            <div key={i} className="output">
              {value}
              <div
                className="port input"
                ref={(el) => registerPort(`wo:${i}`, el)}
                onMouseUp={() => finishConnection(`wo:${i}`)}
              ></div>
            </div>
          ))}
        </div>
      </div>
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          id={chip.id}
          code={chip.code}
          setCode={(code) => setChipCode(chip.id, code)}
          outputs={chip.outputs}
          position={{ x: chip.x, y: chip.y }}
          onDragStart={handleChipMouseDown}
          registerPort={registerPort}
          startConnection={startConnection}
          finishConnection={finishConnection}
        />
      ))}
      <button className="run" onClick={run}>
        Run
      </button>
      <button className="run" onClick={addChip}>
        Add Chip
      </button>
    </div>
  )
}

