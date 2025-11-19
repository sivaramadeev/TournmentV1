
export type TournamentStatus = 'Draft' | 'Publishing' | 'Published';

export type View = 'login' | 'admin' | 'player';

export enum MatchStatus {
  Scheduled = 'Scheduled',
  InProgress = 'In-Progress',
  Completed = 'Completed',
  WalkoverP1 = 'Walkover P1',
  WalkoverP2 = 'Walkover P2',
  Disqualified = 'Disqualified'
}

export interface Player {
  id: string;
  name: string;
  mobileNumber: string;
  categories: string[];
  feePaid: boolean;
}

export interface MatchHistoryEntry {
  timestamp: string;
  changedBy: string;
  oldState: { scoreP1: number | null; scoreP2: number | null; status: MatchStatus };
  newState: { scoreP1: number | null; scoreP2: number | null; status: MatchStatus };
  reason: string;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  scoreP1: number | null;
  scoreP2: number | null;
  status: MatchStatus;
  history: MatchHistoryEntry[];
  // Future proofing for knockouts
  roundName?: string; 
  nextMatchId?: string;
}

export interface Group {
  id: string;
  name: string;
  playerIds: string[];
  matches: Match[];
}

export interface CategoryFixture {
  category: string;
  type: string;
  groups: Group[];
  knockoutMatches?: Match[];
}

export interface TournamentSettings {
  name: string;
  types: string[];
  categories: string[];
}

export interface Tournament {
  id: string;
  createdAt: string;
  settings: TournamentSettings;
  players: Player[];
  fixtures: CategoryFixture[];
  isPublished: boolean;
  status: TournamentStatus;
  gistId?: string; // Tracks the GitHub Gist ID for cloud syncing
}