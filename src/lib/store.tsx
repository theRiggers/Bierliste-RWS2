
'use client';

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useCollection, useDoc, useUser, useFirestore } from '@/firebase';
import { collection, doc, setDoc, addDoc, query, orderBy, limit, deleteDoc, writeBatch, serverTimestamp, Firestore, Query, DocumentReference } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { isWithinInterval, parseISO, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';

export type Role = 'player' | 'admin' | 'kassenwart' | 'strafenwart' | 'coach' | 'assistant_coach';

export interface Player {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  balance: number;
  treasuryBalance: number; 
  isFeeExempt?: boolean;
  lastIntroSeenRoles?: Role[];
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
  month?: number; 
  year: number; 
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
  targetPlayerId?: string;
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

export interface Attendance {
  id: string;
  eventId: string;
  playerId: string;
  playerName: string;
  status: 'going' | 'declined';
  reason?: string;
  updatedAt: string;
}

export interface Absence {
  id: string;
  playerId: string;
  playerName: string;
  type: 'vacation' | 'injury' | 'illness' | 'work' | 'other';
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LineupPosition {
  playerId: string;
  positionId: string;
}

export interface Lineup {
  id: string;
  eventId: string;
  formation: string;
  startingEleven: LineupPosition[];
  substitutes: string[]; 
  updatedAt: string;
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
  attendance: Attendance[];
  lineups: Lineup[];
  absences: Absence[];
  currentUserProfile: Player | null;
  settings: AppSettings;
  loading: boolean;
  totalMannschaftskasse: number;
  totalBierkasse: number;
  bierkasseLiquidity: number;
  addExpense: (playerId: string, itemType: 'beer' | 'crate') => void;
  deleteExpense: (expenseId: string) => void;
  recordPayment: (playerId: string, amount: number, account?: 'drinks' | 'treasury') => void;
  deletePayment: (paymentId: string) => void;
  addMembershipFee: (playerId: string, type: 'monthly' | 'annual', year: number, month?: number) => void;
  deleteMembershipFee: (feeId: string) => void;
  addMembershipTransaction: (description: string, amount: number, type: 'sponsor' | 'donation' | 'other' | 'expense', targetPlayerId?: string) => void;
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
  upsertAttendance: (eventId: string, status: 'going' | 'declined', reason?: string) => Promise<void>;
  updatePlayerAttendance: (eventId: string, playerId: string, playerName: string, status: 'going' | 'declined' | null, reason?: string) => Promise<void>;
  addAbsence: (data: Omit<Absence, 'id' | 'playerId' | 'playerName'>) => Promise<void>;
  deleteAbsence: (id: string) => Promise<void>;
  upsertLineup: (eventId: string, data: Omit<Lineup, 'id' | 'eventId' | 'updatedAt'>) => Promise<void>;
  addBezahlkiste: () => void;
  addPlayer: (name: string, email: string, roles: Role[], uid?: string, isFeeExempt?: boolean) => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetClubhouseSeason: () => Promise<void>;
  markIntroSeen: (roles: Role[]) => Promise<void>;
  closeSeason: (year: number) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();

  const playersQuery = useMemo(() => db ? collection(db, 'players') as Query<Omit<Player, 'id'>> : null, [db]);
  const { data: playersData, loading: playersLoading } = useCollection<Omit<Player, 'id'>>(playersQuery);

  const expensesQuery = useMemo(() => db ? query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(150)) as Query<Omit<Expense, 'id'>> : null, [db]);
  const { data: expensesData, loading: expensesLoading } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

  const paymentsQuery = useMemo(() => db ? query(collection(db, 'payments'), orderBy('date', 'desc'), limit(150)) as Query<Omit<Payment, 'id'>> : null, [db]);
  const { data: paymentsData, loading: paymentsLoading } = useCollection<Omit<Payment, 'id'>>(paymentsQuery);

  const feesQuery = useMemo(() => db ? collection(db, 'membershipFees') as Query<Omit<MembershipFee, 'id'>> : null, [db]);
  const { data: feesData, loading: feesLoading } = useCollection<Omit<MembershipFee, 'id'>>(feesQuery);

  const mTransactionsQuery = useMemo(() => db ? query(collection(db, 'membershipTransactions'), orderBy('date', 'desc')) as Query<Omit<MembershipTransaction, 'id'>> : null, [db]);
  const { data: mTransactionsData, loading: mTransactionsLoading } = useCollection<Omit<MembershipTransaction, 'id'>>(mTransactionsQuery);

  const tExpensesQuery = useMemo(() => db ? query(collection(db, 'treasuryExpenses'), orderBy('date', 'desc'), limit(150)) as Query<Omit<TreasuryExpense, 'id'>> : null, [db]);
  const { data: tExpensesData, loading: tExpensesLoading } = useCollection<Omit<TreasuryExpense, 'id'>>(tExpensesQuery);

  const finesQuery = useMemo(() => db ? query(collection(db, 'fines'), orderBy('date', 'desc')) as Query<Omit<Fine, 'id'>> : null, [db]);
  const { data: finesData, loading: finesLoading } = useCollection<Omit<Fine, 'id'>>(finesQuery);

  const fineCatalogQuery = useMemo(() => db ? query(collection(db, 'fineCatalog'), orderBy('name', 'asc')) as Query<Omit<FineType, 'id'>> : null, [db]);
  const { data: fineCatalogData, loading: fineCatalogLoading } = useCollection<Omit<FineType, 'id'>>(fineCatalogQuery);

  const teamEventsQuery = useMemo(() => db ? query(collection(db, 'teamEvents'), orderBy('date', 'asc')) as Query<Omit<TeamEvent, 'id'>> : null, [db]);
  const { data: teamEventsData, loading: teamEventsLoading } = useCollection<Omit<TeamEvent, 'id'>>(teamEventsQuery);

  const attendanceQuery = useMemo(() => db ? collection(db, 'eventAttendance') as Query<Omit<Attendance, 'id'>> : null, [db]);
  const { data: attendanceData, loading: attendanceLoading } = useCollection<Omit<Attendance, 'id'>>(attendanceQuery);

  const absencesQuery = useMemo(() => db ? collection(db, 'absences') as Query<Omit<Absence, 'id'>> : null, [db]);
  const { data: absencesData, loading: absencesLoading } = useCollection<Omit<Absence, 'id'>>(absencesQuery);

  const lineupsQuery = useMemo(() => db ? collection(db, 'lineups') as Query<Omit<Lineup, 'id'>> : null, [db]);
  const { data: lineupsData, loading: lineupsLoading } = useCollection<Omit<Lineup, 'id'>>(lineupsQuery);

  const settingsRef = useMemo(() => db ? doc(db, 'settings', 'global') as DocumentReference<AppSettings> : null, [db]);
  const { data: settingsData, loading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  const players = useMemo(() => playersData?.map(d => {
    const rawData = d.data as any;
    const roles = rawData.roles || (rawData.role ? [rawData.role] : ['player']);
    return { ...rawData, id: d.id, roles, treasuryBalance: rawData.treasuryBalance || 0 } as Player;
  }) || [], [playersData]);

  // Essential filtering: only include data associated with existing players
  const activePlayerIds = useMemo(() => new Set(players.map(p => p.id)), [players]);

  const expenses = useMemo(() => expensesData?.map(d => ({ ...d.data, id: d.id })) || [], [expensesData]);
  const payments = useMemo(() => paymentsData?.map(d => ({ ...d.data, id: d.id })) || [], [paymentsData]);
  const membershipFees = useMemo(() => feesData?.map(d => ({ ...d.data, id: d.id })) || [], [feesData]);
  const membershipTransactions = useMemo(() => mTransactionsData?.map(d => ({ ...d.data, id: d.id })) || [], [mTransactionsData]);
  const treasuryExpenses = useMemo(() => tExpensesData?.map(d => ({ ...d.data, id: d.id })) || [], [tExpensesData]);
  const fines = useMemo(() => finesData?.map(d => ({ ...d.data, id: d.id })) || [], [finesData]);
  const fineCatalog = useMemo(() => fineCatalogData?.map(d => ({ ...d.data, id: d.id })) || [], [fineCatalogData]);
  const teamEvents = useMemo(() => teamEventsData?.map(d => ({ ...d.data, id: d.id })) || [], [teamEventsData]);
  
  const attendance = useMemo(() => {
    const raw = attendanceData?.map(d => ({ ...d.data, id: d.id })) || [];
    return raw.filter(a => activePlayerIds.has(a.playerId));
  }, [attendanceData, activePlayerIds]);

  const absences = useMemo(() => {
    const raw = absencesData?.map(d => ({ ...d.data, id: d.id })) || [];
    return raw.filter(a => activePlayerIds.has(a.playerId));
  }, [absencesData, activePlayerIds]);

  const lineups = useMemo(() => {
    const raw = lineupsData?.map(d => ({ ...d.data, id: d.id })) || [];
    return raw.map(l => ({
      ...l,
      startingEleven: (l.startingEleven || []).filter(pos => activePlayerIds.has(pos.playerId)),
      substitutes: (l.substitutes || []).filter(id => activePlayerIds.has(id))
    }));
  }, [lineupsData, activePlayerIds]);

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

  const recordPayment = (playerId: string, amount: number, account: 'drinks' | 'treasury' = 'drinks') => {
    if (!db || !currentUserProfile) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    if (account === 'drinks') {
      const paymentData = { playerId, playerName: player.name, amount, date: new Date().toISOString(), recordedBy: currentUserProfile.id };
      addDoc(collection(db, 'payments'), paymentData)
        .catch(handleMutationError('payments', 'create', paymentData));
        
      const newBalance = (player.balance || 0) + amount;
      setDoc(doc(db, 'players', playerId), { balance: newBalance }, { merge: true })
        .catch(handleMutationError(`players/${playerId}`, 'update', { balance: newBalance }));
    } else {
      addMembershipTransaction(
        `Zahlung: ${player.name}`,
        amount,
        'other',
        playerId
      );
    }
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
    const feeData: any = { playerId, type, year, amount, datePaid: new Date().toISOString() };
    if (month !== undefined) feeData.month = month;

    addDoc(collection(db, 'membershipFees'), feeData)
      .catch(handleMutationError('membershipFees', 'create', feeData));
  };

  const deleteMembershipFee = (feeId: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'membershipFees', feeId))
      .catch(handleMutationError('membershipFees', 'delete'));
  };

  const addMembershipTransaction = (description: string, amount: number, type: 'sponsor' | 'donation' | 'other' | 'expense', targetPlayerId?: string) => {
    if (!db || !currentUserProfile) return;
    
    const txData: any = { 
      description, 
      amount, 
      type, 
      date: new Date().toISOString(), 
      recordedBy: currentUserProfile.id 
    };
    
    if (targetPlayerId && targetPlayerId !== "none") {
      txData.targetPlayerId = targetPlayerId;
    }

    addDoc(collection(db, 'membershipTransactions'), txData)
      .catch(handleMutationError('membershipTransactions', 'create', txData));

    if (txData.targetPlayerId) {
      const player = players.find(p => p.id === txData.targetPlayerId);
      if (player) {
        const adjustment = type === 'expense' ? -amount : amount;
        const newTreasuryBalance = (player.treasuryBalance || 0) + adjustment;
        setDoc(doc(db, 'players', txData.targetPlayerId), { treasuryBalance: newTreasuryBalance }, { merge: true })
          .catch(handleMutationError(`players/${txData.targetPlayerId}`, 'update', { treasuryBalance: newTreasuryBalance }));
      }
    }
  };

  const deleteMembershipTransaction = (transactionId: string) => {
    if (!db) return;
    const tx = membershipTransactions.find(t => t.id === transactionId);
    if (!tx) return;
    
    deleteDoc(doc(db, 'membershipTransactions', transactionId))
      .catch(handleMutationError('membershipTransactions', 'delete'));

    if (tx.targetPlayerId) {
      const player = players.find(p => p.id === tx.targetPlayerId);
      if (player) {
        const adjustment = tx.type === 'expense' ? tx.amount : -tx.amount;
        const newTreasuryBalance = (player.treasuryBalance || 0) + adjustment;
        setDoc(doc(db, 'players', tx.targetPlayerId), { treasuryBalance: newTreasuryBalance }, { merge: true })
          .catch(handleMutationError(`players/${tx.targetPlayerId}`, 'update', { treasuryBalance: newTreasuryBalance }));
      }
    }
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
    
    const eventData: any = { ...event };
    if (eventData.description === undefined) delete eventData.description;
    if (eventData.location === undefined) delete eventData.location;

    const newDoc = await addDoc(collection(db, 'teamEvents'), eventData)
      .catch(handleMutationError('teamEvents', 'create', eventData));

    if (newDoc) {
      const eventDate = startOfDay(parseISO(event.date));
      absences.forEach(abs => {
        const start = startOfDay(parseISO(abs.startDate));
        const end = endOfDay(parseISO(abs.endDate));
        if (eventDate >= start && eventDate <= end) {
          const typeLabels: any = { vacation: 'Urlaub', injury: 'Verletzung', illness: 'Krankheit', work: 'Arbeit', other: 'Abwesenheit' };
          updatePlayerAttendance(newDoc.id, abs.playerId, abs.playerName, 'declined', `Abwesend: ${typeLabels[abs.type] || abs.type}`);
        }
      });
    }
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

  const upsertAttendance = async (eventId: string, status: 'going' | 'declined', reason?: string) => {
    if (!db || !currentUserProfile) return;
    const docId = `${eventId}_${currentUserProfile.id}`;
    const attendanceData: any = {
      eventId,
      playerId: currentUserProfile.id,
      playerName: currentUserProfile.name,
      status,
      updatedAt: new Date().toISOString(),
    };
    if (status === 'declined' && reason) attendanceData.reason = reason;

    setDoc(doc(db, 'eventAttendance', docId), attendanceData, { merge: true })
      .catch(handleMutationError(`eventAttendance/${docId}`, 'write', attendanceData));
  };

  const updatePlayerAttendance = async (eventId: string, playerId: string, playerName: string, status: 'going' | 'declined' | null, reason?: string) => {
    if (!db) return;
    const docId = `${eventId}_${playerId}`;
    
    if (status === null) {
      deleteDoc(doc(db, 'eventAttendance', docId))
        .catch(handleMutationError(`eventAttendance/${docId}`, 'delete'));
      return;
    }

    const attendanceData: any = {
      eventId,
      playerId,
      playerName,
      status,
      updatedAt: new Date().toISOString(),
    };
    if (status === 'declined' && reason) attendanceData.reason = reason;

    setDoc(doc(db, 'eventAttendance', docId), attendanceData, { merge: true })
      .catch(handleMutationError(`eventAttendance/${docId}`, 'write', attendanceData));
  };

  const addAbsence = async (data: Omit<Absence, 'id' | 'playerId' | 'playerName'>) => {
    if (!db || !currentUserProfile) return;
    const absenceData: any = { 
      ...data, 
      playerId: currentUserProfile.id, 
      playerName: currentUserProfile.name 
    };
    if (absenceData.reason === undefined) delete absenceData.reason;

    await addDoc(collection(db, 'absences'), absenceData)
      .catch(handleMutationError('absences', 'create', absenceData));

    const start = startOfDay(parseISO(data.startDate));
    const end = endOfDay(parseISO(data.endDate));
    
    teamEvents.forEach(event => {
      const eventDate = parseISO(event.date);
      if (eventDate >= start && eventDate <= end) {
        const typeLabels: any = { vacation: 'Urlaub', injury: 'Verletzung', illness: 'Krankheit', work: 'Arbeit', other: 'Abwesenheit' };
        updatePlayerAttendance(event.id, currentUserProfile.id, currentUserProfile.name, 'declined', `Abwesend: ${typeLabels[data.type] || data.type}`);
      }
    });
  };

  const deleteAbsence = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'absences', id))
      .catch(handleMutationError(`absences/${id}`, 'delete'));
  };

  const upsertLineup = async (eventId: string, data: Omit<Lineup, 'id' | 'eventId' | 'updatedAt'>) => {
    if (!db) return;
    const lineupData = {
      ...data,
      eventId,
      updatedAt: new Date().toISOString()
    };
    setDoc(doc(db, 'lineups', eventId), lineupData, { merge: true })
      .catch(handleMutationError(`lineups/${eventId}`, 'write', lineupData));
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

  const addPlayer = async (name: string, email: string, roles: Role[], uid?: string, isFeeExempt: boolean = false) => {
    if (!db) return;
    const playerRef = uid ? doc(db, 'players', uid) : doc(collection(db, 'players'));
    const playerData = { name, email, roles, balance: 0.00, treasuryBalance: 0.00, isFeeExempt };
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

  const markIntroSeen = async (roles: Role[]) => {
    if (!db || !currentUserProfile) return;
    const updates = { lastIntroSeenRoles: roles };
    await setDoc(doc(db, 'players', currentUserProfile.id), updates, { merge: true })
      .catch(handleMutationError(`players/${currentUserProfile.id}`, 'update', updates));
  };

  const closeSeason = async (year: number) => {
    if (!db || !currentUserProfile) return;
    const batch = writeBatch(db);

    players.forEach(player => {
      if (player.isFeeExempt || player.email === 'kasse@kickoff.de') return;
      
      const playerFees = membershipFees.filter(f => f.playerId === player.id && f.year === year);
      const isAnnual = playerFees.some(f => f.type === 'annual');
      
      if (!isAnnual) {
        const paidMonths = playerFees.filter(f => f.type === 'monthly').length;
        const unpaidCount = 10 - paidMonths; 
        
        if (unpaidCount > 0) {
          const debt = unpaidCount * settings.monthlyFee;
          const newTreasuryBalance = (player.treasuryBalance || 0) - debt;
          const playerRef = doc(db, 'players', player.id);
          batch.update(playerRef, { treasuryBalance: newTreasuryBalance });
        }
      }
    });

    const currentTotal = totalMannschaftskasse;
    const carryoverRef = doc(collection(db, 'membershipTransactions'));
    batch.set(carryoverRef, {
      description: `Saisonübertrag aus ${year}/${(year+1)%100}`,
      amount: currentTotal,
      type: 'other',
      date: new Date().toISOString(),
      recordedBy: currentUserProfile.id
    });

    await batch.commit();
  };

  const criticalDataLoading = authLoading || playersLoading || settingsLoading || teamEventsLoading;

  return (
    <StoreContext.Provider value={{ 
      players, expenses, payments, membershipFees, membershipTransactions, treasuryExpenses, fines, fineCatalog, teamEvents, attendance, absences, lineups, currentUserProfile, settings,
      loading: criticalDataLoading,
      totalMannschaftskasse,
      totalBierkasse,
      bierkasseLiquidity,
      addExpense, deleteExpense, recordPayment, deletePayment,
      addMembershipFee, deleteMembershipFee, addMembershipTransaction, deleteMembershipTransaction,
      addTreasuryExpense, deleteTreasuryExpense, recordClubhousePayment, addFine, markFineAsPaid, deleteFine, updateFineType, addFineType, deleteFineType,
      addTeamEvent, updateTeamEvent, deleteTeamEvent, upsertAttendance, updatePlayerAttendance, 
      addAbsence, deleteAbsence, upsertLineup,
      addBezahlkiste, addPlayer, updatePlayer, deletePlayer, updateSettings, resetClubhouseSeason, markIntroSeen, closeSeason
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
