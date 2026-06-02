'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, addDoc, query, orderBy, limit, deleteDoc } from 'firebase/firestore';

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

export interface MembershipFee {
  id: string;
  playerId: string;
  type: 'monthly' | 'annual';
  month?: number; // 0-11
  year: number; // Startjahr der Saison (z.B. 2024)
  amount: number;
  datePaid: string;
}

export interface TreasuryExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  recordedBy: string;
}

export const BEER_PRICE = 1.50;
export const CRATE_PRICE = 35.00;
export const MONTHLY_FEE = 15.00;
export const ANNUAL_FEE = 150.00;
export const FEE_MONTHS = [7, 8, 9, 10, 11, 0, 1, 2, 3, 4]; // Aug bis Mai
export const PAYPAL_ME_LINK = "https://www.paypal.me/JamieRigden932";
export const CLUBHOUSE_PAYPAL_EMAIL = "marleneadmans@yahoo.com";

interface StoreContextType {
  players: Player[];
  expenses: Expense[];
  payments: Payment[];
  membershipFees: MembershipFee[];
  treasuryExpenses: TreasuryExpense[];
  currentUserProfile: Player | null;
  loading: boolean;
  addExpense: (playerId: string, itemType: 'beer' | 'crate') => void;
  deleteExpense: (expenseId: string) => void;
  recordPayment: (playerId: string, amount: number) => void;
  deletePayment: (paymentId: string) => void;
  addMembershipFee: (playerId: string, type: 'monthly' | 'annual', year: number, month?: number) => void;
  deleteMembershipFee: (feeId: string) => void;
  addTreasuryExpense: (description: string, amount: number) => void;
  deleteTreasuryExpense: (expenseId: string) => void;
  addPlayer: (name: string, email: string, role: Role, uid?: string) => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();

  const playersQuery = useMemo(() => db ? collection(db, 'players') : null, [db]);
  const { data: playersData, loading: playersLoading } = useCollection<Omit<Player, 'id'>>(playersQuery);

  const expensesQuery = useMemo(() => db ? query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(100)) : null, [db]);
  const { data: expensesData, loading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

  const paymentsQuery = useMemo(() => db ? query(collection(db, 'payments'), orderBy('date', 'desc'), limit(100)) : null, [db]);
  const { data: paymentsData, loading: paymentsLoading } = useCollection<Omit<Payment, 'id'>>(paymentsQuery);

  const feesQuery = useMemo(() => db ? collection(db, 'membershipFees') : null, [db]);
  const { data: feesData, loading: feesLoading } = useCollection<Omit<MembershipFee, 'id'>>(feesQuery);

  const tExpensesQuery = useMemo(() => db ? query(collection(db, 'treasuryExpenses'), orderBy('date', 'desc'), limit(100)) : null, [db]);
  const { data: tExpensesData, loading: tExpensesLoading } = useCollection<Omit<TreasuryExpense, 'id'>>(tExpensesQuery);

  const players = useMemo(() => playersData?.map(d => ({ ...d.data, id: d.id })) || [], [playersData]);
  const expenses = useMemo(() => expensesData?.map(d => ({ ...d.data, id: d.id })) || [], [expensesData]);
  const payments = useMemo(() => paymentsData?.map(d => ({ ...d.data, id: d.id })) || [], [paymentsData]);
  const membershipFees = useMemo(() => feesData?.map(d => ({ ...d.data, id: d.id })) || [], [feesData]);
  const treasuryExpenses = useMemo(() => tExpensesData?.map(d => ({ ...d.data, id: d.id })) || [], [tExpensesData]);

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

    const expenseData = { playerId, playerName: player.name, itemType, cost, date: new Date().toISOString() };
    addDoc(collection(db, 'expenses'), expenseData);

    const playerRef = doc(db, 'players', playerId);
    setDoc(playerRef, { balance: (player.balance || 0) - cost }, { merge: true });

    if (teamKasse) {
      const kasseRef = doc(db, 'players', teamKasse.id);
      setDoc(kasseRef, { balance: (teamKasse.balance || 0) + cost }, { merge: true });
    }
  };

  const deleteExpense = (expenseId: string) => {
    if (!db) return;
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    const player = players.find(p => p.id === expense.playerId);
    const teamKasse = players.find(p => p.email === 'kasse@kickoff.de');

    deleteDoc(doc(db, 'expenses', expenseId));
    if (player) {
      setDoc(doc(db, 'players', player.id), { balance: (player.balance || 0) + expense.cost }, { merge: true });
    }
    if (teamKasse) {
      setDoc(doc(db, 'players', teamKasse.id), { balance: (teamKasse.balance || 0) - expense.cost }, { merge: true });
    }
  };

  const recordPayment = (playerId: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const paymentData = { playerId, playerName: player.name, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id };
    addDoc(collection(db, 'payments'), paymentData);

    setDoc(doc(db, 'players', playerId), { balance: (player.balance || 0) + amount }, { merge: true });
  };

  const deletePayment = (paymentId: string) => {
    if (!db) return;
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    const player = players.find(p => p.id === payment.playerId);

    deleteDoc(doc(db, 'payments', paymentId));
    if (player) {
      setDoc(doc(db, 'players', player.id), { balance: (player.balance || 0) - payment.amount }, { merge: true });
    }
  };

  const addMembershipFee = (playerId: string, type: 'monthly' | 'annual', year: number, month?: number) => {
    if (!db) return;
    const amount = type === 'monthly' ? MONTHLY_FEE : ANNUAL_FEE;
    const feeData = { playerId, type, year, month: type === 'monthly' ? month : null, amount, datePaid: new Date().toISOString() };
    addDoc(collection(db, 'membershipFees'), feeData);
  };

  const deleteMembershipFee = (feeId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'membershipFees', feeId));
  };

  const addTreasuryExpense = (description: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    const teamKasse = players.find(p => p.email === 'kasse@kickoff.de');
    if (!teamKasse) return;

    const expenseData = { description, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id };
    addDoc(collection(db, 'treasuryExpenses'), expenseData);

    const kasseRef = doc(db, 'players', teamKasse.id);
    setDoc(kasseRef, { balance: (teamKasse.balance || 0) - amount }, { merge: true });
  };

  const deleteTreasuryExpense = (expenseId: string) => {
    if (!db) return;
    const expense = treasuryExpenses.find(e => e.id === expenseId);
    if (!expense) return;
    const teamKasse = players.find(p => p.email === 'kasse@kickoff.de');

    deleteDoc(doc(db, 'treasuryExpenses', expenseId));
    if (teamKasse) {
      const kasseRef = doc(db, 'players', teamKasse.id);
      setDoc(kasseRef, { balance: (teamKasse.balance || 0) + expense.amount }, { merge: true });
    }
  };

  const addPlayer = async (name: string, email: string, role: Role, uid?: string) => {
    if (!db) return;
    const playerData = { name, email, role, balance: 0.00 };
    const playerRef = uid ? doc(db, 'players', uid) : doc(collection(db, 'players'));
    await setDoc(playerRef, playerData, { merge: true });
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    if (!db) return;
    setDoc(doc(db, 'players', id), updates, { merge: true });
  };

  const deletePlayer = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'players', id));
  };

  return (
    <StoreContext.Provider value={{ 
      players, expenses, payments, membershipFees, treasuryExpenses, currentUserProfile,
      loading: playersLoading || expensesLoading || paymentsLoading || feesLoading || tExpensesLoading || authLoading,
      addExpense, deleteExpense, recordPayment, deletePayment,
      addMembershipFee, deleteMembershipFee, addTreasuryExpense, deleteTreasuryExpense,
      addPlayer, updatePlayer, deletePlayer
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
