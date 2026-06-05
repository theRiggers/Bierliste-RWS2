
'use client';

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, addDoc, query, orderBy, limit, deleteDoc, writeBatch, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export type Role = 'player' | 'admin' | 'kassenwart' | 'strafenwart' | 'coach' | 'assistant_coach';

export interface Player {
  id: string;
  name: string;
  email: string;
  roles: Role[];
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
  isPaid?: boolean;
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
  lastClubhouseResetDate?: string;
}

export const BEER_PRICE = 1.50;
export const CRATE_PRICE = 35.00;
export const MONTHLY_FEE = 15.00;
export const ANNUAL_FEE = 150.00;

export const FEE_MONTHS = [7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

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
  markFineAsPaid: (fineId: string) => void;
  deleteFine: (fineId: string) => void;
  updateFineType: (id: string, name: string, amount: number) => Promise<void>;
  addFineType: (name: string, amount: number) => Promise<void>;
  deleteFineType: (id: string) => Promise<void>;
  addTeamEvent: (event: Omit<TeamEvent, 'id'>) => Promise<void>;
  updateTeamEvent: (id: string, updates: Partial<TeamEvent>) => Promise<void>;
  deleteTeamEvent: (id: string) => Promise<void>;
  addBezahlkiste: () => void;
  addPlayer: (name: string, email: string, roles: Role[], uid?: string) => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetClubhouseSeason: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();

  const playersQuery = useMemo(() => db ? collection(db, 'players') : null, [db]);
  const { data: playersData, loading: playersLoading } = useCollection<any>(playersQuery);

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

  const players = useMemo(() => playersData?.map(d => {
    const rawData = d.data;
    const roles = rawData.roles || (rawData.role ? [rawData.role] : ['player']);
    return { ...rawData, id: d.id, roles } as Player;
  }) || [], [playersData]);

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
    lastClubhouseResetDate: settingsData?.lastClubhouseResetDate || "",
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
    const totalPlayerBalanceSum = players.reduce((sum, p) => sum + (p.balance || 0), 0);
    return bierkasseLiquidity - totalPlayerBalanceSum;
  }, [bierkasseLiquidity, players]);

  useEffect(() => {
    if (db && !fineCatalogLoading && fineCatalog.length === 0 && currentUserProfile?.roles.includes('admin')) {
      const batch = writeBatch(db);
      DEFAULT_FINES.forEach(name => {
        const ref = doc(collection(db, 'fineCatalog'));
        batch.set(ref, { name, amount: 2.00 });
      });
      batch.commit();
    }
  }, [fineCatalogLoading, fineCatalog.length, db, currentUserProfile]);

  const handleMutationError = (path: string, operation: SecurityRuleContext['operation'], data?: any) => (error: any) => {
    const permissionError = new FirestorePermissionError({
      path,
      operation,
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  };

  const addExpense = (playerId: string, itemType: 'beer' | 'crate') => {
    if (!db) return;
    const cost = itemType === 'beer' ? settings.beerPrice : settings.cratePrice;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    const expenseData = { playerId, playerName: player.name, itemType, cost, date: new Date().toISOString() };
    addDoc(collection(db, 'expenses'), expenseData)
      .catch(handleMutationError('expenses', 'create', expenseData));
      
    const newBalance = (player.balance || 0) - cost;
    setDoc(doc(db, 'players', playerId), { balance: newBalance }, { merge: true })
      .catch(handleMutationError(`players/${playerId}`, 'update', { balance: newBalance }));
  };

  const deleteExpense = (expenseId: string) => {
    if (!db) return;
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    const player = players.find(p => p.id === expense.playerId);
    
    deleteDoc(doc(db, 'expenses', expenseId))
      .catch(handleMutationError(`expenses/${expenseId}`, 'delete'));
      
    if (player) {
      const newBalance = (player.balance || 0) + expense.cost;
      setDoc(doc(db, 'players', player.id), { balance: newBalance }, { merge: true })
        .catch(handleMutationError(`players/${player.id}`, 'update', { balance: newBalance }));
    }
  };

  const recordPayment = (playerId: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    const paymentData = { playerId, playerName: player.name, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id };
    addDoc(collection(db, 'payments'), paymentData)
      .catch(handleMutationError('payments', 'create', paymentData));
      
    const newBalance = (player.balance || 0) + amount;
    setDoc(doc(db, 'players', playerId), { balance: newBalance }, { merge: true })
      .catch(handleMutationError(`players/${playerId}`, 'update', { balance: newBalance }));
  };

  const deletePayment = (paymentId: string) => {
    if (!db) return;
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    const player = players.find(p => p.id === payment.playerId);
    
    deleteDoc(doc(db, 'payments', paymentId))
      .catch(handleMutationError(`payments/${paymentId}`, 'delete'));
      
    if (player) {
      const newBalance = (player.balance || 0) - payment.amount;
      setDoc(doc(db, 'players', player.id), { balance: newBalance }, { merge: true })
        .catch(handleMutationError(`players/${player.id}`, 'update', { balance: newBalance }));
    }
  };

  const addMembershipFee = (playerId: string, type: 'monthly' | 'annual', year: number, month?: number) => {
    if (!db) return;
    const amount = type === 'monthly' ? settings.monthlyFee : settings.annualFee;
    const feeData = { playerId, type, year, month: type === 'monthly' ? month : null, amount, datePaid: new Date().toISOString() };
    addDoc(collection(db, 'membershipFees'), feeData)
      .catch(handleMutationError('membershipFees', 'create', feeData));
  };

  const deleteMembershipFee = (feeId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'membershipFees', feeId))
      .catch(handleMutationError(`membershipFees/${feeId}`, 'delete'));
  };

  const addMembershipTransaction = (description: string, amount: number, type: 'sponsor' | 'donation' | 'other' | 'expense') => {
    if (!db || !currentUserProfile) return;
    const txData = { description, amount, type, date: new Date().toISOString(), recordedBy: currentUserProfile.id };
    addDoc(collection(db, 'membershipTransactions'), txData)
      .catch(handleMutationError('membershipTransactions', 'create', txData));
  };

  const deleteMembershipTransaction = (transactionId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'membershipTransactions', transactionId))
      .catch(handleMutationError(`membershipTransactions/${transactionId}`, 'delete'));
  };

  const addTreasuryExpense = (description: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    const expData = { description, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id };
    addDoc(collection(db, 'treasuryExpenses'), expData)
      .catch(handleMutationError('treasuryExpenses', 'create', expData));
  };

  const recordClubhousePayment = (amount: number) => {
    if (!db || !currentUserProfile) return;
    const expData = { 
      description: "Abrechnung Vereinsheim", 
      amount, 
      date: new Date().toISOString(), 
      recordedBy: currentUserProfile.id 
    };
    addDoc(collection(db, 'treasuryExpenses'), expData)
      .catch(handleMutationError('treasuryExpenses', 'create', expData));
  };

  const deleteTreasuryExpense = (expenseId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'treasuryExpenses', expenseId))
      .catch(handleMutationError(`treasuryExpenses/${expenseId}`, 'delete'));
  };

  const addFine = (playerId: string, reason: string, amount: number) => {
    if (!db || !currentUserProfile) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    const fineData = { playerId, playerName: player.name, reason, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id, isPaid: false };
    addDoc(collection(db, 'fines'), fineData)
      .catch(handleMutationError('fines', 'create', fineData));
  };

  const markFineAsPaid = (fineId: string) => {
    if (!db) return;
    setDoc(doc(db, 'fines', fineId), { isPaid: true }, { merge: true })
      .catch(handleMutationError(`fines/${fineId}`, 'update', { isPaid: true }));
  };

  const deleteFine = (fineId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'fines', fineId))
      .catch(handleMutationError(`fines/${fineId}`, 'delete'));
  };

  const updateFineType = async (id: string, name: string, amount: number) => {
    if (!db) return;
    setDoc(doc(db, 'fineCatalog', id), { name, amount }, { merge: true })
      .catch(handleMutationError(`fineCatalog/${id}`, 'update', { name, amount }));
  };

  const addFineType = async (name: string, amount: number) => {
    if (!db) return;
    addDoc(collection(db, 'fineCatalog'), { name, amount })
      .catch(handleMutationError('fineCatalog', 'create', { name, amount }));
  };

  const deleteFineType = async (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'fineCatalog', id))
      .catch(handleMutationError(`fineCatalog/${id}`, 'delete'));
  };

  const addTeamEvent = async (event: Omit<TeamEvent, 'id'>) => {
    if (!db) return;
    addDoc(collection(db, 'teamEvents'), event)
      .catch(handleMutationError('teamEvents', 'create', event));
  };

  const updateTeamEvent = async (id: string, updates: Partial<TeamEvent>) => {
    if (!db) return;
    setDoc(doc(db, 'teamEvents', id), updates, { merge: true })
      .catch(handleMutationError(`teamEvents/${id}`, 'update', updates));
  };

  const deleteTeamEvent = async (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'teamEvents', id))
      .catch(handleMutationError(`teamEvents/${id}`, 'delete'));
  };

  const addBezahlkiste = () => {
    if (!db) return;
    const crateData = { 
      playerId: 'clubhouse', 
      playerName: 'Bezahlkiste (Mannschaft)', 
      itemType: 'crate', 
      cost: settings.cratePrice, 
      date: new Date().toISOString() 
    };
    addDoc(collection(db, 'expenses'), crateData)
      .catch(handleMutationError('expenses', 'create', crateData));
  };

  const addPlayer = async (name: string, email: string, roles: Role[], uid?: string) => {
    if (!db) return;
    const playerRef = uid ? doc(db, 'players', uid) : doc(collection(db, 'players'));
    const playerData = { name, email, roles, balance: 0.00 };
    await setDoc(playerRef, playerData, { merge: true })
      .catch(handleMutationError(`players/${playerRef.id}`, uid ? 'update' : 'create', playerData));
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    if (!db) return;
    setDoc(doc(db, 'players', id), updates, { merge: true })
      .catch(handleMutationError(`players/${id}`, 'update', updates));
  };

  const deletePlayer = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'players', id))
      .catch(handleMutationError(`players/${id}`, 'delete'));
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!db) return;
    await setDoc(doc(db, 'settings', 'global'), updates, { merge: true })
      .catch(handleMutationError('settings/global', 'update', updates));
  };

  const resetClubhouseSeason = async () => {
    if (!db) return;
    const updates = { lastClubhouseResetDate: new Date().toISOString() };
    await setDoc(doc(db, 'settings', 'global'), updates, { merge: true })
      .catch(handleMutationError('settings/global', 'update', updates));
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
      addTreasuryExpense, deleteTreasuryExpense, recordClubhousePayment, addFine, markFineAsPaid, deleteFine, updateFineType, addFineType, deleteFineType,
      addTeamEvent, updateTeamEvent, deleteTeamEvent,
      addBezahlkiste, addPlayer, updatePlayer, deletePlayer, updateSettings, resetClubhouseSeason
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
