
'use client';

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, addDoc, query, orderBy, limit, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export type Role = 'player' | 'admin' | 'kassenwart' | 'strafenwart' | 'coach' | 'assistant_coach';

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
  year: number; // Startjahr der Saison
  amount: number;
  datePaid: string;
}

export interface MembershipTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'sponsor' | 'donation' | 'other' | 'expense';
  date: string;
  recordedBy: string;
}

export interface TreasuryExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  recordedBy: string;
}

export interface Fine {
  id: string;
  playerId: string;
  playerName: string;
  reason: string;
  amount: number;
  date: string;
  recordedBy: string;
}

export interface FineType {
  id: string;
  name: string;
  amount: number;
}

export interface TeamEvent {
  id: string;
  title: string;
  description?: string;
  type: 'training' | 'match' | 'social';
  date: string; 
  location?: string;
}

export interface AppSettings {
  beerPrice: number;
  cratePrice: number;
  monthlyFee: number;
  annualFee: number;
  paypalMeLink: string;
  clubhousePaypalEmail: string;
  treasuryPaypalEmail: string;
  footballDeLink?: string;
  fupaLink?: string;
}

export const BEER_PRICE = 1.50;
export const CRATE_PRICE = 35.00;
export const MONTHLY_FEE = 15.00;
export const ANNUAL_FEE = 150.00;
// Saisonstart 01.07. - Monate: Jul(6), Aug(7), Sep(8), Okt(9), Nov(10), Dez(11), Jan(0), Feb(1), Mär(2), Apr(3), Mai(4), Jun(5)
export const FEE_MONTHS = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
export const PAYPAL_ME_LINK = "";
export const CLUBHOUSE_PAYPAL_EMAIL = "";
export const TREASURY_PAYPAL_EMAIL = "";

export const DEFAULT_FINES = [
  "Dumme Aktion", "Arroganzspruch", "Tunnel beim Kreisspiel", "Sachen liegen lassen",
  "Während Training pinkeln", "Nicht aufräumen", "Zu spät absagen",
  "Zu spät zum Training", "Trinken im Trikot", "Zu spät zum Spiel",
  "Gar nicht absagen", "Verkatert beim Spiel", "Tunnel Mallerunde"
];

interface StoreContextType {
  players: Player[];
  expenses: Expense[];
  payments: Payment[];
  membershipFees: MembershipFee[];
  membershipTransactions: MembershipTransaction[];
  treasuryExpenses: TreasuryExpense[];
  fines: Fine[];
  fineCatalog: FineType[];
  teamEvents: TeamEvent[];
  currentUserProfile: Player | null;
  settings: AppSettings;
  loading: boolean;
  totalMannschaftskasse: number;
  totalBierkasse: number;
  bierkasseLiquidity: number;
  addExpense: (playerId: string, itemType: 'beer' | 'crate') => void;
  deleteExpense: (expenseId: string) => void;
  recordPayment: (playerId: string, amount: number) => void;
  deletePayment: (paymentId: string) => void;
  addMembershipFee: (playerId: string, type: 'monthly' | 'annual', year: number, month?: number) => void;
  deleteMembershipFee: (feeId: string) => void;
  addMembershipTransaction: (description: string, amount: number, type: 'sponsor' | 'donation' | 'other' | 'expense') => void;
  deleteMembershipTransaction: (transactionId: string) => void;
  addTreasuryExpense: (description: string, amount: number) => void;
  deleteTreasuryExpense: (expenseId: string) => void;
  recordClubhousePayment: (amount: number) => void;
  addFine: (playerId: string, reason: string, amount: number) => void;
  deleteFine: (fineId: string) => void;
  updateFineType: (id: string, name: string, amount: number) => Promise<void>;
  addFineType: (name: string, amount: number) => Promise<void>;
  deleteFineType: (id: string) => Promise<void>;
  addTeamEvent: (event: Omit<TeamEvent, 'id'>) => Promise<void>;
  updateTeamEvent: (id: string, updates: Partial<TeamEvent>) => Promise<void>;
  deleteTeamEvent: (id: string) => Promise<void>;
  addBezahlkiste: () => void;
  addPlayer: (name: string, email: string, role: Role, uid?: string) => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();

  const playersQuery = useMemo(() => db ? collection(db, 'players') : null, [db]);
  const { data: playersData, loading: playersLoading } = useCollection<Omit<Player, 'id'>>(playersQuery);

  const expensesQuery = useMemo(() => db ? query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(150)) : null, [db]);
  const { data: expensesData, loading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

  const paymentsQuery = useMemo(() => db ? query(collection(db, 'payments'), orderBy('date', 'desc'), limit(150)) : null, [db]);
  const { data: paymentsData, loading: paymentsLoading } = useCollection<Omit<Payment, 'id'>>(paymentsQuery);

  const feesQuery = useMemo(() => db ? collection(db, 'membershipFees') : null, [db]);
  const { data: feesData, loading: feesLoading } = useCollection<Omit<MembershipFee, 'id'>>(feesQuery);

  const mTransactionsQuery = useMemo(() => db ? query(collection(db, 'membershipTransactions'), orderBy('date', 'desc')) : null, [db]);
  const { data: mTransactionsData, loading: mTransactionsLoading } = useCollection<Omit<MembershipTransaction, 'id'>>(mTransactionsQuery);

  const tExpensesQuery = useMemo(() => db ? query(collection(db, 'treasuryExpenses'), orderBy('date', 'desc'), limit(150)) : null, [db]);
  const { data: tExpensesData, loading: tExpensesLoading } = useCollection<Omit<TreasuryExpense, 'id'>>(tExpensesQuery);

  const finesQuery = useMemo(() => db ? query(collection(db, 'fines'), orderBy('date', 'desc')) : null, [db]);
  const { data: finesData, loading: finesLoading } = useCollection<Omit<Fine, 'id'>>(finesQuery);

  const fineCatalogQuery = useMemo(() => db ? query(collection(db, 'fineCatalog'), orderBy('name', 'asc')) : null, [db]);
  const { data: fineCatalogData, loading: fineCatalogLoading } = useCollection<Omit<FineType, 'id'>>(fineCatalogQuery);

  const eventsQuery = useMemo(() => db ? query(collection(db, 'teamEvents'), orderBy('date', 'asc')) : null, [db]);
  const { data: eventsData, loading: eventsLoading } = useCollection<Omit<TeamEvent, 'id'>>(eventsQuery);

  const settingsRef = useMemo(() => db ? doc(db, 'settings', 'global') : null, [db]);
  const { data: settingsData, loading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  const players = useMemo(() => playersData?.map(d => ({ ...d.data, id: d.id })) || [], [playersData]);
  const expenses = useMemo(() => expensesData?.map(d => ({ ...d.data, id: d.id })) || [], [expensesData]);
  const payments = useMemo(() => paymentsData?.map(d => ({ ...d.data, id: d.id })) || [], [paymentsData]);
  const membershipFees = useMemo(() => feesData?.map(d => ({ ...d.data, id: d.id })) || [], [feesData]);
  const membershipTransactions = useMemo(() => mTransactionsData?.map(d => ({ ...d.data, id: d.id })) || [], [mTransactionsData]);
  const treasuryExpenses = useMemo(() => tExpensesData?.map(d => ({ ...d.data, id: d.id })) || [], [tExpensesData]);
  const fines = useMemo(() => finesData?.map(d => ({ ...d.data, id: d.id })) || [], [finesData]);
  const fineCatalog = useMemo(() => fineCatalogData?.map(d => ({ ...d.data, id: d.id })) || [], [fineCatalogData]);
  const teamEvents = useMemo(() => eventsData?.map(d => ({ ...d.data, id: d.id })) || [], [eventsData]);

  const settings = useMemo<AppSettings>(() => ({
    beerPrice: settingsData?.beerPrice ?? BEER_PRICE,
    cratePrice: settingsData?.cratePrice ?? CRATE_PRICE,
    monthlyFee: settingsData?.monthlyFee ?? MONTHLY_FEE,
    annualFee: settingsData?.annualFee ?? ANNUAL_FEE,
    paypalMeLink: settingsData?.paypalMeLink ?? PAYPAL_ME_LINK,
    clubhousePaypalEmail: settingsData?.clubhousePaypalEmail ?? CLUBHOUSE_PAYPAL_EMAIL,
    treasuryPaypalEmail: settingsData?.treasuryPaypalEmail ?? TREASURY_PAYPAL_EMAIL,
    footballDeLink: settingsData?.footballDeLink || "",
    fupaLink: settingsData?.fupaLink || "",
  }), [settingsData]);

  const currentUserProfile = useMemo(() => {
    if (!user || players.length === 0) return null;
    return players.find(p => p.id === user.uid) || null;
  }, [user, players]);

  const totalMannschaftskasse = useMemo(() => {
    const feeSum = membershipFees.reduce((sum, f) => sum + f.amount, 0);
    const finesSum = fines.reduce((sum, f) => sum + f.amount, 0);
    const transactionSum = membershipTransactions.reduce((sum, t) => {
      return t.type === 'expense' ? sum - t.amount : sum + t.amount;
    }, 0);
    return feeSum + finesSum + transactionSum;
  }, [membershipFees, membershipTransactions, fines]);

  const bierkasseLiquidity = useMemo(() => {
    const cashIn = payments.reduce((sum, p) => sum + p.amount, 0);
    const cashOut = treasuryExpenses.reduce((sum, t) => sum + t.amount, 0);
    return cashIn - cashOut;
  }, [payments, treasuryExpenses]);

  const totalBierkasse = useMemo(() => {
    const outstanding = players.reduce((sum, p) => p.balance < 0 ? sum + Math.abs(p.balance) : sum, 0);
    return bierkasseLiquidity + outstanding;
  }, [bierkasseLiquidity, players]);

  useEffect(() => {
    if (db && !fineCatalogLoading && fineCatalog.length === 0 && currentUserProfile?.role === 'admin') {
      const batch = writeBatch(db);
      DEFAULT_FINES.forEach(name => {
        const ref = doc(collection(db, 'fineCatalog'));
        batch.set(ref, { name, amount: 2.00 });
      });
      batch.commit();
    }
  }, [fineCatalogLoading, fineCatalog.length, db, currentUserProfile]);

  const addExpense = (playerId: string, itemType: 'beer' | 'crate') => {
    if (!db) return;
    const cost = itemType === 'beer' ? settings.beerPrice : settings.cratePrice;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    addDoc(collection(db, 'expenses'), { playerId, playerName: player.name, itemType, cost, date: new Date().toISOString() });
    setDoc(doc(db, 'players', playerId), { balance: (player.balance || 0) - cost }, { merge: true });
  };

  const deleteExpense = (expenseId: string) => {
    if (!db) return;
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    const player = players.find(p => p.id === expense.playerId);
    deleteDoc(doc(db, 'expenses', expenseId));
    if (player) setDoc(doc(db, 'players', player.id), { balance: (player.balance || 0) + expense.cost }, { merge: true });
  };

  const recordPayment = (playerId: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    addDoc(collection(db, 'payments'), { playerId, playerName: player.name, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id });
    setDoc(doc(db, 'players', playerId), { balance: (player.balance || 0) + amount }, { merge: true });
  };

  const deletePayment = (paymentId: string) => {
    if (!db) return;
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    const player = players.find(p => p.id === payment.playerId);
    deleteDoc(doc(db, 'payments', paymentId));
    if (player) setDoc(doc(db, 'players', player.id), { balance: (player.balance || 0) - payment.amount }, { merge: true });
  };

  const addMembershipFee = (playerId: string, type: 'monthly' | 'annual', year: number, month?: number) => {
    if (!db) return;
    const amount = type === 'monthly' ? settings.monthlyFee : settings.annualFee;
    addDoc(collection(db, 'membershipFees'), { playerId, type, year, month: type === 'monthly' ? month : null, amount, datePaid: new Date().toISOString() });
  };

  const deleteMembershipFee = (feeId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'membershipFees', feeId));
  };

  const addMembershipTransaction = (description: string, amount: number, type: 'sponsor' | 'donation' | 'other' | 'expense') => {
    if (!db || !currentUserProfile) return;
    addDoc(collection(db, 'membershipTransactions'), { description, amount, type, date: new Date().toISOString(), recordedBy: currentUserProfile.id });
  };

  const deleteMembershipTransaction = (transactionId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'membershipTransactions', transactionId));
  };

  const addTreasuryExpense = (description: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    addDoc(collection(db, 'treasuryExpenses'), { description, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id });
  };

  const recordClubhousePayment = (amount: number) => {
    if (!db || !currentUserProfile) return;
    addDoc(collection(db, 'treasuryExpenses'), { 
      description: "Abrechnung Vereinsheim (Marlene)", 
      amount, 
      date: new Date().toISOString(), 
      recordedBy: currentUserProfile.id 
    });
  };

  const deleteTreasuryExpense = (expenseId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'treasuryExpenses', expenseId));
  };

  const addFine = (playerId: string, reason: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    addDoc(collection(db, 'fines'), { playerId, playerName: player.name, reason, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id });
  };

  const deleteFine = (fineId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'fines', fineId));
  };

  const updateFineType = async (id: string, name: string, amount: number) => {
    if (!db) return;
    await setDoc(doc(db, 'fineCatalog', id), { name, amount }, { merge: true });
  };

  const addFineType = async (name: string, amount: number) => {
    if (!db) return;
    await addDoc(collection(db, 'fineCatalog'), { name, amount });
  };

  const deleteFineType = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'fineCatalog', id));
  };

  const addTeamEvent = async (event: Omit<TeamEvent, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'teamEvents'), event);
  };

  const updateTeamEvent = async (id: string, updates: Partial<TeamEvent>) => {
    if (!db) return;
    await setDoc(doc(db, 'teamEvents', id), updates, { merge: true });
  };

  const deleteTeamEvent = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'teamEvents', id));
  };

  const addBezahlkiste = () => {
    if (!db) return;
    addDoc(collection(db, 'expenses'), { 
      playerId: 'clubhouse', 
      playerName: 'Bezahlkiste (Mannschaft)', 
      itemType: 'crate', 
      cost: settings.cratePrice, 
      date: new Date().toISOString() 
    });
  };

  const addPlayer = async (name: string, email: string, role: Role, uid?: string) => {
    if (!db) return;
    const playerRef = uid ? doc(db, 'players', uid) : doc(collection(db, 'players'));
    await setDoc(playerRef, { name, email, role, balance: 0.00 }, { merge: true });
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    if (!db) return;
    setDoc(doc(db, 'players', id), updates, { merge: true });
  };

  const deletePlayer = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'players', id));
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!db) return;
    await setDoc(doc(db, 'settings', 'global'), updates, { merge: true });
  };

  return (
    <StoreContext.Provider value={{ 
      players, expenses, payments, membershipFees, membershipTransactions, treasuryExpenses, fines, fineCatalog, teamEvents, currentUserProfile, settings,
      loading: playersLoading || expensesLoading || paymentsLoading || feesLoading || mTransactionsLoading || tExpensesLoading || finesLoading || fineCatalogLoading || authLoading || settingsLoading || eventsLoading,
      totalMannschaftskasse,
      totalBierkasse,
      bierkasseLiquidity,
      addExpense, deleteExpense, recordPayment, deletePayment,
      addMembershipFee, deleteMembershipFee, addMembershipTransaction, deleteMembershipTransaction,
      addTreasuryExpense, deleteTreasuryExpense, recordClubhousePayment, addFine, deleteFine, updateFineType, addFineType, deleteFineType,
      addTeamEvent, updateTeamEvent, deleteTeamEvent,
      addBezahlkiste, addPlayer, updatePlayer, deletePlayer, updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const useContextResult = useContext(StoreContext);
  if (useContextResult === undefined) throw new Error('useStore must be used within a StoreProvider');
  return useContextResult;
}
