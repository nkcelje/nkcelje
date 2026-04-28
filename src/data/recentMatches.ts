export interface RecentMatch {
  opponent: string;
  ha: 'H' | 'A';
  result: 'W' | 'D' | 'L';
  score: string;
  date: string;
  rating: number; // 0-10
}

/** Last 8 league matches — used by the right-rail form strip on the Squad page. */
export const RECENT_MATCHES: RecentMatch[] = [
  { opponent: 'Maribor',  ha: 'H', result: 'W', score: '2-1', date: 'Apr 19', rating: 7.6 },
  { opponent: 'Olimpija', ha: 'A', result: 'D', score: '1-1', date: 'Apr 12', rating: 7.1 },
  { opponent: 'Bravo',    ha: 'H', result: 'W', score: '3-0', date: 'Apr 05', rating: 8.2 },
  { opponent: 'Mura',     ha: 'A', result: 'W', score: '2-0', date: 'Mar 29', rating: 7.9 },
  { opponent: 'Koper',    ha: 'H', result: 'L', score: '0-1', date: 'Mar 22', rating: 6.4 },
  { opponent: 'Domžale',  ha: 'A', result: 'W', score: '1-0', date: 'Mar 15', rating: 7.4 },
  { opponent: 'Radomlje', ha: 'H', result: 'W', score: '4-1', date: 'Mar 08', rating: 8.5 },
  { opponent: 'Rogaška',  ha: 'A', result: 'W', score: '3-1', date: 'Mar 01', rating: 7.8 },
];
