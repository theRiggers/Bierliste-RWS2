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

export const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Lukas Müller', email: 'lukas@example.com', role: 'auditor', balance: -15.50 },
  { id: '2', name: 'Julian Schmidt', email: 'julian@example.com', role: 'player', balance: 0.00 },
  { id: '3', name: 'Mannschaftskasse', email: 'kasse@kickoff.de', role: 'player', balance: 145.00 },
  { id: '4', name: 'Finn Weber', email: 'finn@example.com', role: 'player', balance: -45.00 },
  { id: '5', name: 'Max Power', email: 'max@example.com', role: 'player', balance: -2.50 },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', playerId: '1', playerName: 'Lukas Müller', itemType: 'beer', cost: 1.50, date: '2024-05-20T18:30:00Z' },
  { id: 'e2', playerId: '4', playerName: 'Finn Weber', itemType: 'crate', cost: 35.00, date: '2024-05-19T20:15:00Z' },
  { id: 'e3', playerId: '1', playerName: 'Lukas Müller', itemType: 'crate', cost: 35.00, date: '2024-05-18T19:00:00Z' },
  { id: 'e4', playerId: '5', playerName: 'Max Power', itemType: 'beer', cost: 1.50, date: '2024-05-17T21:45:00Z' },
];

export const BEER_PRICE = 1.50;
export const CRATE_PRICE = 35.00;