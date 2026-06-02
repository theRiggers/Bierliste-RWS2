
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
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

export interface Payment {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  date: string;
  recordedBy: string;
}

export const BEER_PRICE = 1.50;
export const CRATE_PRICE = 35.00;
// Der offizielle PayPal-Link der Mannschaftskasse RWS2
export const PAYPAL_ME_LINK = "https://www.paypal.me/JamieRigden932";

interface StoreContextType {
  players: Player[];
  expenses: Expense[];
  payments: Payment[];
  currentUserProfile: Player | null;
  loading: boolean;
  addExpense: (playerId: string, itemType: 'beer' | 'crate') => void;
  recordPayment: (playerId: string, amount: number) => void;
  addPlayer: (name: string, email: string, role: Role, uid?: string) => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();

  const playersQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'players');
  }, [db]);
  const { data: playersData, loading: playersLoading } = useCollection<Omit<Player, 'id'>>(playersQuery);

  const expensesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(50));
  }, [db]);
  const { data: expensesData, loading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

  const paymentsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'payments'), orderBy('date', 'desc'), limit(50));
  }, [db]);
  const { data: paymentsData, loading: paymentsLoading } = useCollection<Omit<Payment, 'id'>>(paymentsQuery);

  const players = useMemo(() => 
    playersData?.map(d => ({ ...d.data, id: d.id })) || [], 
    [playersData]
  );

  const expenses = useMemo(() => 
    expensesData?.map(d => ({ ...d.data, id: d.id })) || [], 
    [expensesData]
  );

  const payments = useMemo(() => 
    paymentsData?.map(d => ({ ...d.data, id: d.id })) || [], 
    [paymentsData]
  );

  const currentUserProfile = useMemo(() => {
    if (!user || players.length === 0) return null;
    return players.find(p => p.id === user.uid) || null;
  }, [user, players]);

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

    addDoc(collection(db, 'expenses'), expenseData).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'expenses',
        operation: 'create',
        requestResourceData: expenseData
      }));
    });

    const playerRef = doc(db, 'players', playerId);
    const newPlayerBalance = (player.balance || 0) - cost;
    setDoc(playerRef, { balance: newPlayerBalance }, { merge: true }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: playerRef.path,
        operation: 'update',
        requestResourceData: { balance: newPlayerBalance }
      }));
    });

    if (teamKasse) {
      const kasseRef = doc(db, 'players', teamKasse.id);
      const newKasseBalance = (teamKasse.balance || 0) + cost;
      setDoc(kasseRef, { balance: newKasseBalance }, { merge: true }).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: kasseRef.path,
          operation: 'update',
          requestResourceData: { balance: newKasseBalance }
        }));
      });
    }
  };

  const recordPayment = (playerId: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const paymentData = {
      playerId,
      playerName: player.name,
      amount,
      date: new Date().toISOString(),
      recordedBy: currentUserProfile.id
    };

    addDoc(collection(db, 'payments'), paymentData).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'payments',
        operation: 'create',
        requestResourceData: paymentData
      }));
    });

    const playerRef = doc(db, 'players', playerId);
    const newBalance = (player.balance || 0) + amount;
    setDoc(playerRef, { balance: newBalance }, { merge: true }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: playerRef.path,
        operation: 'update',
        requestResourceData: { balance: newBalance }
      }));
    });
  };

  const addPlayer = async (name: string, email: string, role: Role, uid?: string) => {
    if (!db) return;
    const playerData = { name, email, role, balance: 0.00 };
    const playerRef = uid ? doc(db, 'players', uid) : doc(collection(db, 'players'));
    
    try {
      await setDoc(playerRef, playerData, { merge: true });
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: playerRef.path,
        operation: 'write',
        requestResourceData: playerData
      }));
      throw err;
    }
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
      payments,
      currentUserProfile,
      loading: playersLoading || expensesLoading || paymentsLoading || authLoading,
      addExpense, 
      recordPayment,
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
