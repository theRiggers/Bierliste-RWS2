
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'player' | 'auditor';

export interface Player {
  id: string;
  name: string;
  email: string;
  role: Role;
  balance: number;
}

export interface Expense {
  id: string;
  playerId: string;
  playerName: string;
  itemType: 'beer' | 'crate';
  cost: number;
  date: string;
}

export const BEER_PRICE = 1.50;
export const CRATE_PRICE = 35.00;

const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'Lukas Müller', email: 'lukas@example.com', role: 'auditor', balance: -15.50 },
  { id: '2', name: 'Julian Schmidt', email: 'julian@example.com', role: 'player', balance: 0.00 },
  { id: '3', name: 'Mannschaftskasse', email: 'kasse@kickoff.de', role: 'player', balance: 145.00 },
  { id: '4', name: 'Finn Weber', email: 'finn@example.com', role: 'player', balance: -45.00 },
  { id: '5', name: 'Max Power', email: 'max@example.com', role: 'player', balance: -2.50 },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', playerId: '1', playerName: 'Lukas Müller', itemType: 'beer', cost: 1.50, date: '2024-05-20T18:30:00Z' },
  { id: 'e2', playerId: '4', playerName: 'Finn Weber', itemType: 'crate', cost: 35.00, date: '2024-05-19T20:15:00Z' },
  { id: 'e3', playerId: '1', playerName: 'Lukas Müller', itemType: 'crate', cost: 35.00, date: '2024-05-18T19:00:00Z' },
  { id: 'e4', playerId: '5', playerName: 'Max Power', itemType: 'beer', cost: 1.50, date: '2024-05-17T21:45:00Z' },
];

interface StoreContextType {
  players: Player[];
  expenses: Expense[];
  addExpense: (playerId: string, itemType: 'beer' | 'crate') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

  const addExpense = (playerId: string, itemType: 'beer' | 'crate') => {
    const cost = itemType === 'beer' ? BEER_PRICE : CRATE_PRICE;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // 1. Add new expense
    const newExpense: Expense = {
      id: `e${Date.now()}`,
      playerId,
      playerName: player.name,
      itemType,
      cost,
      date: new Date().toISOString(),
    };

    setExpenses(prev => [newExpense, ...prev]);

    // 2. Update player balance and team cash
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, balance: p.balance - cost };
      }
      if (p.id === '3') { // Team cash (Mannschaftskasse)
        return { ...p, balance: p.balance + cost };
      }
      return p;
    }));
  };

  return (
    <StoreContext.Provider value={{ players, expenses, addExpense }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
