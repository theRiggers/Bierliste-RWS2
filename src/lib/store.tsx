
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, addDoc, query, orderBy, limit, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

interface StoreContextType {
  players: Player[];
  expenses: Expense[];
  loading: boolean;
  addExpense: (playerId: string, itemType: 'beer' | 'crate') => void;
  addPlayer: (name: string, email: string, role: Role) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();

  // Abfrage aller Spieler
  const playersQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'players');
  }, [db]);
  const { data: playersData, loading: playersLoading } = useCollection<Omit<Player, 'id'>>(playersQuery);

  // Abfrage der letzten 50 Ausgaben
  const expensesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(50));
  }, [db]);
  const { data: expensesData, loading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

  const players = useMemo(() => 
    playersData?.map(d => ({ ...d.data, id: d.id })) || [], 
    [playersData]
  );

  const expenses = useMemo(() => 
    expensesData?.map(d => ({ ...d.data, id: d.id })) || [], 
    [expensesData]
  );

  const addExpense = (playerId: string, itemType: 'beer' | 'crate') => {
    if (!db) return;
    const cost = itemType === 'beer' ? BEER_PRICE : CRATE_PRICE;
    const player = players.find(p => p.id === playerId);
    const teamKasse = players.find(p => p.email === 'kasse@kickoff.de');

    if (!player) return;

    const expenseData = {
      playerId,
      playerName: player.name,
      itemType,
      cost,
      date: new Date().toISOString(),
    };

    // 1. Ausgabe hinzufügen
    addDoc(collection(db, 'expenses'), expenseData).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'expenses',
        operation: 'create',
        requestResourceData: expenseData
      }));
    });

    // 2. Spieler-Balance aktualisieren
    const playerRef = doc(db, 'players', playerId);
    setDoc(playerRef, { balance: (player.balance || 0) - cost }, { merge: true }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: playerRef.path,
        operation: 'update',
        requestResourceData: { balance: player.balance - cost }
      }));
    });

    // 3. Teamkasse aktualisieren
    if (teamKasse) {
      const kasseRef = doc(db, 'players', teamKasse.id);
      setDoc(kasseRef, { balance: (teamKasse.balance || 0) + cost }, { merge: true }).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: kasseRef.path,
          operation: 'update',
          requestResourceData: { balance: teamKasse.balance + cost }
        }));
      });
    }
  };

  const addPlayer = (name: string, email: string, role: Role) => {
    if (!db) return;
    const playerData = { name, email, role, balance: 0.00 };
    addDoc(collection(db, 'players'), playerData).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'players',
        operation: 'create',
        requestResourceData: playerData
      }));
    });
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    if (!db) return;
    const playerRef = doc(db, 'players', id);
    setDoc(playerRef, updates, { merge: true }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: playerRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  return (
    <StoreContext.Provider value={{ 
      players, 
      expenses, 
      loading: playersLoading || expensesLoading,
      addExpense, 
      addPlayer, 
      updatePlayer 
    }}>
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
