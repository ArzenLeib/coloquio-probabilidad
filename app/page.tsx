'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ShipType = 3 | 2 | 1
type Cell = { type: 'empty' | 'ship', shipType?: ShipType, hit: boolean }
type Ship = { type: ShipType, positions: [number, number][], hits: number }

export default function BatallaNaval() {
  const [board, setBoard] = useState<Cell[][]>(Array(10).fill(null).map(() => 
    Array(10).fill(null).map(() => ({ type: 'empty', hit: false }))
  ))
  const [ships, setShips] = useState<Ship[]>([])
  const [money, setMoney] = useState(100)
  const [message, setMessage] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [betAmount, setBetAmount] = useState(10)
  const [autoPlay, setAutoPlay] = useState(false)
  const [juegoNumero, setJuegoNumero] = useState(1);
  const [movimientoNumero, setMovimientoNumero] = useState(1);
  
  useEffect(() => {
    placeShips()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (autoPlay && !gameOver && money >= betAmount) {
      timer = setTimeout(autoFire, 5000)
    } else if (autoPlay && (gameOver || money < betAmount)) {
      resetGame()
    }
    return () => clearTimeout(timer)
  }, [autoPlay, gameOver, money, board, betAmount])

  const placeShips = () => {
    const newBoard: Cell[][] = Array(10).fill(null).map(() => 
      Array(10).fill(null).map(() => ({ type: 'empty', hit: false }))
    )
    const newShips: Ship[] = []

    const shipTypes: ShipType[] = [3, 2, 1]
    shipTypes.forEach(shipType => {
      const ship = placeShip(newBoard, shipType)
      newShips.push(ship)
    })

    setBoard(newBoard)
    setShips(newShips)
  }

  const placeShip = (board: Cell[][], size: ShipType): Ship => {
    let placed = false
    let ship: Ship = { type: size, positions: [], hits: 0 }

    while (!placed) {
      const horizontal = Math.random() < 0.5
      const row = Math.floor(Math.random() * 10)
      const col = Math.floor(Math.random() * 10)

      if (canPlaceShip(board, row, col, size, horizontal)) {
        for (let i = 0; i < size; i++) {
          if (horizontal) {
            board[row][col + i] = { type: 'ship', shipType: size, hit: false }
            ship.positions.push([row, col + i])
          } else {
            board[row + i][col] = { type: 'ship', shipType: size, hit: false }
            ship.positions.push([row + i, col])
          }
        }
        placed = true
      }
    }

    return ship
  }

  const canPlaceShip = (board: Cell[][], row: number, col: number, size: number, horizontal: boolean) => {
    if (horizontal) {
      if (col + size > 10) return false
      for (let i = 0; i < size; i++) {
        if (board[row][col + i].type !== 'empty') return false
      }
    } else {
      if (row + size > 10) return false
      for (let i = 0; i < size; i++) {
        if (board[row + i][col].type !== 'empty') return false
      }
    }
    return true
  }

  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (gameOver || board[row][col].hit) return

    let acierto = false;
    setMovimientoNumero(prev => prev + 1)
    
    if (money < betAmount) {
      setMessage('No tienes suficiente dinero para jugar.')
      setGameOver(true)
      return
    }

    const newBoard = board.map(rowArray => rowArray.map(cell => ({...cell})))
    const newShips = ships.map(ship => ({...ship}))
    
    newBoard[row][col].hit = true

    let reward = 0
    let newMessage = ''

    if (newBoard[row][col].type === 'ship') {
      const shipIndex = newShips.findIndex(ship => 
        ship.positions.some(([r, c]) => r === row && c === col)
      )
      
      if (shipIndex !== -1) {
        acierto = true;
        newShips[shipIndex].hits++
        const hitShip = newShips[shipIndex]
        
        if (hitShip.type === 3) reward = 10
        else if (hitShip.type === 2) reward = 20
        else if (hitShip.type === 1) reward = 300

        if (hitShip.hits === hitShip.type) {
          if (hitShip.type === 3) reward = 100
          else if (hitShip.type === 2) reward = 200
          newMessage = `¡Hundiste un barco de ${hitShip.type} casillas! Ganaste $${reward}`
        } else {
          newMessage = `¡Le diste a un barco de ${hitShip.type} casillas! Ganaste $${reward}`
        }
      }
    } else {
      reward = -betAmount
      newMessage = `Agua. Perdiste $${betAmount}`
    }

    setBoard(newBoard)
    setShips(newShips)
    setMoney(prevMoney => prevMoney + reward)
    setMessage(newMessage)

    if (newShips.every(ship => ship.hits === ship.type)) {
      setMessage('¡Felicidades! Has hundido todos los barcos.')
      setGameOver(true)
    }

    if (money + reward < betAmount) {
      setMessage('Game Over. Te has quedado sin dinero.')
      setGameOver(true)
    }

    const jugadaDato = {
      juegoNumero: juegoNumero, 
      movimientoNumero: movimientoNumero,
      posicion: { 
        fila: row, 
        col: col 
      },
      acierto: acierto,
      gano: newShips.every(ship => ship.hits === ship.type),
      dinero: money + reward,
  };

  try {
    await fetch('/api/datos-naval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jugadaDato)
    });
  } catch (error) {
    console.error('Error al guardar la jugada:', error);
  }

  }, [board, ships, betAmount, gameOver, money])

  const autoFire = useCallback(() => {
    let row, col
    do {
      row = Math.floor(Math.random() * 10)
      col = Math.floor(Math.random() * 10)
    } while (board[row][col].hit)

    handleCellClick(row, col)
  }, [board, handleCellClick])

  const resetGame = useCallback(() => {
    const newBoard = Array(10).fill(null).map(() => 
      Array(10).fill(null).map(() => ({ type: 'empty', hit: false }))
    )
    setBoard(newBoard)
    setShips([])
    setMoney(100)
    setMessage('')
    setGameOver(false)
    setBetAmount(10)
    setJuegoNumero(prev => prev + 1);
    setMovimientoNumero(1);
    setTimeout(() => {
      placeShips()
    }, 0)
  }, [])

  const toggleAutoPlay = () => {
    setAutoPlay(prev => !prev)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Batalla Naval</h1>
      <div className="mb-4">Dinero: ${money}</div>
      <div className="mb-4">
        <Input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          min={1}
          max={money}
          className="w-24 mr-2"
        />
        <span>Apuesta por intento</span>
      </div>
      <div className="grid grid-cols-10 gap-0.5 mb-4">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`w-7 h-7 border ${
                cell.hit && cell.type === 'ship' ? 'bg-red-500' :
                cell.hit ? 'bg-blue-500' :
                'bg-gray-200'
              }`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              disabled={gameOver || cell.hit || autoPlay}
            />
          ))
        )}
      </div>
      <div className="mb-4">{message}</div>
      <div className="flex gap-4">
        <Button onClick={resetGame}>Reiniciar Juego</Button>
        <Button onClick={toggleAutoPlay}>
          {autoPlay ? 'Detener Auto-juego' : 'Iniciar Auto-juego'}
        </Button>
      </div>
    </div>
  )
}