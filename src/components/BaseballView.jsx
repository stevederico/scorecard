import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@stevederico/skateboard-ui/shadcn/ui/card';
import { Button } from '@stevederico/skateboard-ui/shadcn/ui/button';
import { Input } from '@stevederico/skateboard-ui/shadcn/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@stevederico/skateboard-ui/shadcn/ui/popover';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@stevederico/skateboard-ui/shadcn/ui/drawer';

const POSITIONS = {
  1: 'P', 2: 'C', 3: '1B', 4: '2B', 5: '3B', 6: 'SS', 7: 'LF', 8: 'CF', 9: 'RF'
};

const INITIAL_PLAYERS = [
  { num: '', name: '', pos: '' },
  { num: '', name: '', pos: '' },
  { num: '', name: '', pos: '' },
  { num: '', name: '', pos: '' },
  { num: '', name: '', pos: '' },
  { num: '', name: '', pos: '' },
  { num: '', name: '', pos: '' },
  { num: '', name: '', pos: '' },
  { num: '', name: '', pos: '' },
];

const INITIAL_ATBAT = { result: '', first: false, second: false, third: false, home: false, out: 0 };

/**
 * Creates a fresh team object with default players and at-bats.
 * @param {string} name - Team name
 * @returns {{ name: string, players: Array, atBats: Array }} Team object
 */
const createTeam = (name) => ({
  name,
  players: INITIAL_PLAYERS.map(p => ({ ...p })),
  atBats: Array(9).fill(null).map(() => Array(9).fill(null).map(() => ({ ...INITIAL_ATBAT })))
});

/**
 * Baseball scorecard component for official scoring.
 * Supports two teams (away/home) with tab switching.
 * Features diamond-based at-bat boxes, player lineup tracking,
 * and standard baseball notation (K, BB, 6-3, F8, etc).
 *
 * @component
 * @returns {JSX.Element} Baseball scorecard view
 */
export default function BaseballView() {
  const [teams, setTeams] = useState([createTeam('AWAY'), createTeam('HOME')]);
  const [activeTeam, setActiveTeam] = useState(0);
  const [openPopover, setOpenPopover] = useState(null);
  const [mobilePlayerIdx, setMobilePlayerIdx] = useState(0);
  const [mobileInningIdx, setMobileInningIdx] = useState(0);
  const [mobileView, setMobileView] = useState('card');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const players = teams[activeTeam].players;
  const atBats = teams[activeTeam].atBats;

  /**
   * Counts outs in a specific inning.
   * @param {number} inning - Inning index
   * @returns {number} Number of outs
   */
  const getInningOuts = (inning) => {
    return atBats.reduce((sum, player) => sum + (player[inning].out || 0), 0);
  };

  /**
   * Gets the ordinal out number for a specific cell within its inning.
   * Counts outs from players above in the batting order.
   * @param {number} playerIdx - Player index
   * @param {number} inning - Inning index
   * @returns {number} The out number (1, 2, or 3) for this cell
   */
  const getOutNumber = (playerIdx, inning) => {
    let outsBeforeThis = 0;
    for (let i = 0; i < playerIdx; i++) {
      outsBeforeThis += atBats[i][inning].out || 0;
    }
    return outsBeforeThis + 1;
  };

  /**
   * Checks if a result is an out.
   * @param {string} result - At-bat result
   * @returns {boolean} True if result is an out
   */
  const isOutResult = (result) => {
    return ['K', 'F', 'GO', 'PO'].some(r => result.includes(r)) ||
           result.includes('-') ||
           result === 'DP';
  };

  /**
   * Updates player info in the active team's lineup.
   * @param {number} idx - Player index
   * @param {string} field - Field to update
   * @param {string} value - New value
   */
  const updatePlayer = (idx, field, value) => {
    const newTeams = [...teams];
    const newPlayers = [...newTeams[activeTeam].players];
    newPlayers[idx] = { ...newPlayers[idx], [field]: value };
    newTeams[activeTeam] = { ...newTeams[activeTeam], players: newPlayers };
    setTeams(newTeams);
  };

  /**
   * Updates at-bat result for a specific cell.
   * Enforces 3-out limit per inning.
   * @param {number} playerIdx - Player index
   * @param {number} inning - Inning index
   * @param {string} result - At-bat result notation
   */
  const updateAtBat = (playerIdx, inning, result) => {
    const currentOuts = getInningOuts(inning);
    const currentCellIsOut = atBats[playerIdx][inning].out > 0;
    const newResultIsOut = isOutResult(result);
    const dpOuts = result === 'DP' ? 2 : (newResultIsOut ? 1 : 0);

    if (newResultIsOut && !currentCellIsOut && currentOuts + dpOuts > 3) {
      return;
    }

    const newTeams = [...teams];
    const newAtBats = [...newTeams[activeTeam].atBats];
    newAtBats[playerIdx] = [...newAtBats[playerIdx]];
    newAtBats[playerIdx][inning] = {
      ...newAtBats[playerIdx][inning],
      result,
      first: ['1B', '2B', '3B', 'HR', 'BB', 'HBP', 'E'].some(r => result.includes(r)),
      second: ['2B', '3B', 'HR'].some(r => result.includes(r)),
      third: ['3B', 'HR'].some(r => result.includes(r)),
      home: result.includes('HR'),
      out: dpOuts
    };
    newTeams[activeTeam] = { ...newTeams[activeTeam], atBats: newAtBats };
    setTeams(newTeams);
    setOpenPopover(null);
  };

  /**
   * Toggles base advancement for a runner on the active team.
   * @param {number} playerIdx - Player index
   * @param {number} inning - Inning index
   * @param {string} base - Base to toggle
   */
  const toggleBase = (playerIdx, inning, base) => {
    const newTeams = [...teams];
    const newAtBats = [...newTeams[activeTeam].atBats];
    newAtBats[playerIdx] = [...newAtBats[playerIdx]];
    newAtBats[playerIdx][inning] = {
      ...newAtBats[playerIdx][inning],
      [base]: !newAtBats[playerIdx][inning][base]
    };
    newTeams[activeTeam] = { ...newTeams[activeTeam], atBats: newAtBats };
    setTeams(newTeams);
  };

  /**
   * Resets both teams back to initial state.
   */
  const resetScorecard = () => {
    setTeams([createTeam('AWAY'), createTeam('HOME')]);
    setActiveTeam(0);
  };

  /**
   * Updates the active team's name.
   * @param {number} idx - Team index (0=away, 1=home)
   * @param {string} name - New team name
   */
  const updateTeamName = (idx, name) => {
    const newTeams = [...teams];
    newTeams[idx] = { ...newTeams[idx], name };
    setTeams(newTeams);
  };

  /**
   * Calculates runs scored in an inning.
   * @param {number} inning - Inning index
   * @returns {number} Runs scored
   */
  const getInningRuns = (inning) => {
    return atBats.reduce((sum, player) => sum + (player[inning].home ? 1 : 0), 0);
  };

  /**
   * Calculates total hits.
   * @returns {number} Total hits
   */
  const getTotalHits = () => {
    return atBats.flat().filter(ab =>
      ['1B', '2B', '3B', 'HR'].some(h => ab.result.includes(h))
    ).length;
  };

  const innings = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const quickResults = ['K', 'BB', '1B', '2B', '3B', 'HR', 'F7', 'F8', 'F9', '6-3', '4-3', '5-3', 'DP'];

  /**
   * Handles result selection on mobile — updates at-bat and closes drawer.
   * @param {string} result - At-bat result notation
   */
  const handleMobileResult = (result) => {
    updateAtBat(mobilePlayerIdx, mobileInningIdx, result);
    setDrawerOpen(false);
  };

  const mobileAb = atBats[mobilePlayerIdx]?.[mobileInningIdx] || INITIAL_ATBAT;
  const mobileInningOuts = getInningOuts(mobileInningIdx);
  const mobileCellIsOut = mobileAb.out > 0;
  const mobileInningClosed = mobileInningOuts >= 3 && !mobileAb.result;

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex flex-col flex-1 md:hidden overflow-hidden pb-20">
        {mobileView === 'card' ? (
          <>
            {/* Top bar: team tabs + stats button */}
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-1">
                {teams.map((team, idx) => (
                  <button
                    key={idx}
                    className={`px-2 py-1 text-sm font-mono rounded transition-colors ${activeTeam === idx ? 'bg-foreground text-background font-bold' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTeam(idx)}
                  >
                    {idx === 0 ? '⚾' : '🏟️'} {team.name}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setMobileView('stats')}>
                Stats
              </Button>
            </div>

            {/* Inning dots */}
            <div className="flex justify-center gap-1 py-2">
              {innings.map((_, i) => (
                <button
                  key={i}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${mobileInningIdx === i ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}
                  onClick={() => setMobileInningIdx(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Big diamond — tap to open drawer */}
            <div
              className={`flex-1 flex items-center justify-center px-12 ${mobileInningClosed ? 'opacity-30' : 'cursor-pointer active:scale-95 transition-transform'}`}
              onClick={() => !mobileInningClosed && setDrawerOpen(true)}
            >
              <svg viewBox="0 0 68 56" className="w-full max-w-xs">
                <path
                  d="M34 4 L56 28 L34 52 L12 28 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-foreground/40"
                />
                {mobileAb.first && (
                  <line x1="34" y1="52" x2="56" y2="28" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                )}
                {mobileAb.second && (
                  <line x1="56" y1="28" x2="34" y2="4" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                )}
                {mobileAb.third && (
                  <line x1="34" y1="4" x2="12" y2="28" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                )}
                {mobileAb.home && (
                  <>
                    <line x1="12" y1="28" x2="34" y2="52" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                    <path d="M34 8 L52 28 L34 48 L16 28 Z" fill="currentColor" className="text-foreground/20" />
                  </>
                )}
                <text x="34" y="28" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold" fill="currentColor">
                  {mobileAb.result}
                </text>
                {mobileCellIsOut && (
                  <>
                    <circle cx="57" cy="46" r="8" fill="currentColor" className="text-foreground" />
                    <text x="57" y="46" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="white">
                      {getOutNumber(mobilePlayerIdx, mobileInningIdx)}
                    </text>
                  </>
                )}
              </svg>
            </div>

            {/* Player info */}
            <div className="px-4 py-2 text-center">
              <p className="font-mono font-bold text-lg">
                {players[mobilePlayerIdx].num ? `#${players[mobilePlayerIdx].num} ` : ''}
                {players[mobilePlayerIdx].name || `Batter ${mobilePlayerIdx + 1}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {players[mobilePlayerIdx].pos || '--'} · Batting {mobilePlayerIdx + 1} of 9
              </p>
            </div>

            {/* Bottom nav: prev/next batter + inning arrows */}
            <div className="flex items-center justify-between px-3 py-3 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={mobilePlayerIdx === 0}
                onClick={() => setMobilePlayerIdx(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={mobileInningIdx === 0}
                  onClick={() => setMobileInningIdx(i => i - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono font-bold w-12 text-center">Inn {mobileInningIdx + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={mobileInningIdx === 8}
                  onClick={() => setMobileInningIdx(i => i + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={mobilePlayerIdx === 8}
                onClick={() => setMobilePlayerIdx(p => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Drawer for result entry */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>
                    {players[mobilePlayerIdx].name || `Batter ${mobilePlayerIdx + 1}`} — Inning {mobileInningIdx + 1}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-6 space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                    {quickResults.map(r => {
                      const rIsOut = isOutResult(r);
                      const rOuts = r === 'DP' ? 2 : (rIsOut ? 1 : 0);
                      const wouldExceed = rIsOut && !mobileCellIsOut && mobileInningOuts + rOuts > 3;
                      return (
                        <Button
                          key={r}
                          variant="outline"
                          className="h-10 text-sm font-mono"
                          disabled={wouldExceed}
                          onClick={() => handleMobileResult(r)}
                        >
                          {r}
                        </Button>
                      );
                    })}
                  </div>
                  {mobileInningOuts >= 3 && !mobileCellIsOut && (
                    <p className="text-xs text-destructive font-semibold text-center">3 outs recorded in inning {mobileInningIdx + 1}</p>
                  )}
                  <Input
                    placeholder="Custom..."
                    className="h-10 text-sm font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleMobileResult(e.target.value.toUpperCase());
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Bases:</span>
                    {['first', 'second', 'third', 'home'].map((base, i) => (
                      <Button
                        key={base}
                        variant={mobileAb[base] ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleBase(mobilePlayerIdx, mobileInningIdx, base)}
                      >
                        {i === 3 ? 'H' : i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleMobileResult('')}
                  >
                    Clear
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          /* STATS VIEW */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Stats header */}
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <Button variant="ghost" size="sm" onClick={() => setMobileView('card')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div className="flex items-center gap-1">
                {teams.map((team, idx) => (
                  <button
                    key={idx}
                    className={`px-2 py-1 text-sm font-mono rounded transition-colors ${activeTeam === idx ? 'bg-foreground text-background font-bold' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTeam(idx)}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={resetScorecard}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Linescore */}
            <div className="flex items-center px-3 py-2 bg-muted text-xs font-mono border-b">
              <span className="w-20 font-bold truncate">{teams[activeTeam].name}</span>
              {innings.map((_, i) => (
                <span key={i} className="w-6 text-center">{getInningRuns(i) || '-'}</span>
              ))}
              <span className="w-8 text-center font-bold ml-2">
                {atBats.flat().filter(ab => ab.home).length}R
              </span>
            </div>

            {/* Player rows */}
            <div className="flex-1 overflow-auto">
              {players.map((player, pIdx) => {
                const pAB = atBats[pIdx].filter(ab => ab.result && !['BB', 'HBP'].includes(ab.result)).length;
                const pH = atBats[pIdx].filter(ab => ['1B', '2B', '3B', 'HR'].some(h => ab.result.includes(h))).length;
                const pR = atBats[pIdx].filter(ab => ab.home).length;
                return (
                  <div
                    key={pIdx}
                    className="flex items-center justify-between px-3 py-3 border-b cursor-pointer active:bg-accent/50 transition-colors"
                    onClick={() => { setMobilePlayerIdx(pIdx); setMobileView('card'); }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground w-4">{pIdx + 1}</span>
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-sm truncate">
                          {player.num ? `#${player.num} ` : ''}{player.name || `Batter ${pIdx + 1}`}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">{player.pos || '--'}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs font-mono shrink-0">
                      <span>AB:{pAB}</span>
                      <span>H:{pH}</span>
                      <span>R:{pR}</span>
                    </div>
                  </div>
                );
              })}
              {/* Totals row */}
              <div className="flex items-center justify-between px-3 py-3 bg-muted/50 font-bold">
                <span className="text-sm">TOTALS</span>
                <div className="flex gap-3 text-xs font-mono">
                  <span>AB:{atBats.flat().filter(ab => ab.result && !['BB', 'HBP'].includes(ab.result)).length}</span>
                  <span>H:{getTotalHits()}</span>
                  <span>R:{atBats.flat().filter(ab => ab.home).length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP LAYOUT (existing, unchanged) */}
      <div className="hidden md:flex flex-1 flex-col p-2 md:p-4 overflow-auto">
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {teams.map((team, idx) => (
                  <div
                    key={idx}
                    className={`cursor-pointer px-1 pb-1 transition-all flex items-center gap-1 ${activeTeam === idx ? 'border-b-2 border-foreground' : 'text-muted-foreground opacity-50 hover:opacity-75'}`}
                    onClick={() => setActiveTeam(idx)}
                  >
                    <span className="text-lg">{idx === 0 ? '⚾' : '🏟️'}</span>
                    <Input
                      value={team.name}
                      onChange={(e) => updateTeamName(idx, e.target.value.toUpperCase())}
                      onClick={(e) => { setActiveTeam(idx); e.stopPropagation(); }}
                      className={`h-8 w-28 font-mono text-sm border-0 bg-transparent text-center ${activeTeam === idx ? 'font-bold' : ''}`}
                      maxLength={12}
                    />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={resetScorecard}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {/* Scorecard Grid */}
            <div className="overflow-x-auto">
              <table className="border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-foreground/30 p-1 w-8 text-center">#</th>
                    <th className="border border-foreground/30 p-1 w-28 text-left">PLAYER</th>
                    <th className="border border-foreground/30 p-1 w-8 text-center">POS</th>
                    {innings.map(i => (
                      <th key={i} className="border border-foreground/30 p-1 w-16 text-center font-bold">{i}</th>
                    ))}
                    <th className="border border-foreground/30 p-1 w-8 text-center bg-muted/80">AB</th>
                    <th className="border border-foreground/30 p-1 w-8 text-center bg-muted/80">H</th>
                    <th className="border border-foreground/30 p-1 w-8 text-center bg-muted/80">R</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, pIdx) => (
                    <tr key={pIdx}>
                      {/* Jersey Number */}
                      <td className="border border-foreground/30 p-0">
                        <Input
                          value={player.num}
                          onChange={(e) => updatePlayer(pIdx, 'num', e.target.value)}
                          className="h-14 w-full text-center text-xs border-0 bg-transparent p-0"
                          maxLength={2}
                          placeholder="--"
                        />
                      </td>
                      {/* Player Name */}
                      <td className="border border-foreground/30 p-0">
                        <Input
                          value={player.name}
                          onChange={(e) => updatePlayer(pIdx, 'name', e.target.value)}
                          className="h-14 w-full text-xs border-0 bg-transparent px-1"
                          placeholder={`Batter ${pIdx + 1}`}
                        />
                      </td>
                      {/* Position */}
                      <td className="border border-foreground/30 p-0">
                        <Input
                          value={player.pos}
                          onChange={(e) => updatePlayer(pIdx, 'pos', e.target.value.toUpperCase())}
                          className="h-14 w-full text-center text-xs border-0 bg-transparent p-0"
                          maxLength={2}
                          placeholder="--"
                        />
                      </td>
                      {/* At-Bat Boxes with Diamonds */}
                      {innings.map((_, iIdx) => {
                        const ab = atBats[pIdx][iIdx];
                        const cellKey = `${pIdx}-${iIdx}`;
                        const inningOuts = getInningOuts(iIdx);
                        const cellIsOut = ab.out > 0;
                        const cellHasResult = ab.result !== '';
                        const inningClosed = inningOuts >= 3 && !cellHasResult;
                        return (
                          <td key={iIdx} className={`border border-foreground/30 p-0 [&>button]:p-0 ${inningClosed ? 'bg-muted/50' : ''}`}>
                            <Popover open={openPopover === cellKey} onOpenChange={(open) => !inningClosed && setOpenPopover(open ? cellKey : null)}>
                              <PopoverTrigger asChild>
                                <div className={`w-full h-14 transition-colors cursor-pointer ${inningClosed ? 'cursor-not-allowed opacity-30' : 'hover:bg-accent/30'}`}>
                                  {/* Diamond Shape */}
                                  <svg viewBox="0 0 68 56" className="w-full h-full">
                                    {/* Diamond outline */}
                                    <path
                                      d="M34 4 L56 28 L34 52 L12 28 Z"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      className="text-foreground/40"
                                    />
                                    {/* Base lines when reached */}
                                    {ab.first && (
                                      <line x1="34" y1="52" x2="56" y2="28" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                                    )}
                                    {ab.second && (
                                      <line x1="56" y1="28" x2="34" y2="4" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                                    )}
                                    {ab.third && (
                                      <line x1="34" y1="4" x2="12" y2="28" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                                    )}
                                    {ab.home && (
                                      <>
                                        <line x1="12" y1="28" x2="34" y2="52" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                                        {/* Fill diamond for run scored */}
                                        <path d="M34 8 L52 28 L34 48 L16 28 Z" fill="currentColor" className="text-foreground/20" />
                                      </>
                                    )}
                                    {/* Result text in center */}
                                    <text x="34" y="28" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="currentColor">
                                      {ab.result}
                                    </text>
                                    {/* Out number in filled circle, bottom right */}
                                    {cellIsOut && (
                                      <>
                                        <circle cx="57" cy="46" r="8" fill="currentColor" className="text-foreground" />
                                        <text x="57" y="46" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="white">
                                          {getOutNumber(pIdx, iIdx)}
                                        </text>
                                      </>
                                    )}
                                  </svg>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-2">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground">Quick Entry:</p>
                                  <div className="grid grid-cols-5 gap-1">
                                    {quickResults.map(r => {
                                      const rIsOut = isOutResult(r);
                                      const rOuts = r === 'DP' ? 2 : (rIsOut ? 1 : 0);
                                      const wouldExceed = rIsOut && !cellIsOut && inningOuts + rOuts > 3;
                                      return (
                                        <Button
                                          key={r}
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs font-mono"
                                          disabled={wouldExceed}
                                          onClick={() => updateAtBat(pIdx, iIdx, r)}
                                        >
                                          {r}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                  {inningOuts >= 3 && !cellIsOut && (
                                    <p className="text-xs text-destructive font-semibold">3 outs recorded in inning {iIdx + 1}</p>
                                  )}
                                  <div className="flex gap-1 mt-2">
                                    <Input
                                      placeholder="Custom..."
                                      className="h-7 text-xs font-mono"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          updateAtBat(pIdx, iIdx, e.target.value.toUpperCase());
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">Bases:</p>
                                    {['first', 'second', 'third', 'home'].map((base, i) => (
                                      <Button
                                        key={base}
                                        variant={ab[base] ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-6 w-6 p-0 text-xs"
                                        onClick={() => toggleBase(pIdx, iIdx, base)}
                                      >
                                        {i === 3 ? 'H' : i + 1}
                                      </Button>
                                    ))}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-6 text-xs"
                                    onClick={() => updateAtBat(pIdx, iIdx, '')}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                        );
                      })}
                      {/* Stats */}
                      <td className="border border-foreground/30 p-1 text-center bg-muted/30">
                        {atBats[pIdx].filter(ab => ab.result && !['BB', 'HBP'].includes(ab.result)).length}
                      </td>
                      <td className="border border-foreground/30 p-1 text-center bg-muted/30">
                        {atBats[pIdx].filter(ab => ['1B', '2B', '3B', 'HR'].some(h => ab.result.includes(h))).length}
                      </td>
                      <td className="border border-foreground/30 p-1 text-center bg-muted/30">
                        {atBats[pIdx].filter(ab => ab.home).length}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-muted/50 font-bold">
                    <td colSpan={3} className="border border-foreground/30 p-1 text-right pr-2">TOTALS</td>
                    {innings.map((_, iIdx) => (
                      <td key={iIdx} className="border border-foreground/30 p-1 text-center">
                        {getInningRuns(iIdx) || ''}
                      </td>
                    ))}
                    <td className="border border-foreground/30 p-1 text-center">
                      {atBats.flat().filter(ab => ab.result && !['BB', 'HBP'].includes(ab.result)).length}
                    </td>
                    <td className="border border-foreground/30 p-1 text-center">{getTotalHits()}</td>
                    <td className="border border-foreground/30 p-1 text-center">
                      {atBats.flat().filter(ab => ab.home).length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs font-mono grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><strong>K</strong> = Strikeout</div>
              <div><strong>BB</strong> = Walk</div>
              <div><strong>1B/2B/3B</strong> = Single/Double/Triple</div>
              <div><strong>HR</strong> = Home Run</div>
              <div><strong>F7/F8/F9</strong> = Fly out to LF/CF/RF</div>
              <div><strong>6-3</strong> = SS to 1B groundout</div>
              <div><strong>DP</strong> = Double Play</div>
              <div><strong>Positions</strong>: 1-P 2-C 3-1B 4-2B 5-3B 6-SS 7-LF 8-CF 9-RF</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
