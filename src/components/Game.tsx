import { useEffect, useState, useRef } from 'react';
import { ref, onValue, runTransaction } from 'firebase/database';
import { database } from '../firebase';
import useSound from 'use-sound';
import redSound from '../assets/red.mp3';
import blueSound from '../assets/blue.mp3';

const Game = () => {
    const [score, setScore] = useState(0);
    const [winner, setWinner] = useState<'blue' | 'red' | null>(null);
    const [userTeam, setUserTeam] = useState<'blue' | 'red' | null>(null);

    const [playRed] = useSound(redSound);
    const [playBlue] = useSound(blueSound);

    // Keep refs to play functions to avoid stale closures in onValue
    const playRedRef = useRef(playRed);
    const playBlueRef = useRef(playBlue);

    useEffect(() => {
        playRedRef.current = playRed;
        playBlueRef.current = playBlue;
    }, [playRed, playBlue]);

    const previousScore = useRef<number>(0);
    // lastPullTime logic removed as we are relying on server updates now
    const isFirstLoad = useRef(true);

    useEffect(() => {
        const scoreRef = ref(database, 'game/score');

        const unsubscribe = onValue(scoreRef, (snapshot) => {
            const data = snapshot.val();
            if (data !== null) {
                // If it's the first load, just sync the state and don't play sound
                if (isFirstLoad.current) {
                    isFirstLoad.current = false;
                    previousScore.current = data;
                    setScore(data);
                    // Update winner status on first load too
                    if (data <= -100) setWinner('blue');
                    else if (data >= 100) setWinner('red');
                    else setWinner(null);
                    return;
                }

                if (data > previousScore.current) {
                    playRedRef.current();
                } else if (data < previousScore.current) {
                    playBlueRef.current();
                }

                previousScore.current = data;
                setScore(data);
                if (data <= -100) setWinner('blue');
                else if (data >= 100) setWinner('red');
                else setWinner(null);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && userTeam && !winner && !e.repeat) {
                e.preventDefault();
                handlePull(userTeam);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [userTeam, winner]);

    const handlePull = (team: 'blue' | 'red' | 'left' | 'right') => {
        if (winner) return;

        const effectiveDirection = team === 'blue' || team === 'left' ? 'left' : 'right';

        // Local sound removed to rely purely on server state updates for consistency
        // This ensures everyone hears the exact same processing of events

        const scoreRef = ref(database, 'game/score');

        runTransaction(scoreRef, (currentScore) => {
            const safeScore = currentScore || 0;

            if (safeScore <= -100 || safeScore >= 100) return undefined;

            if (effectiveDirection === 'left') {
                return Math.max(safeScore - 1, -100);
            } else {
                return Math.min(safeScore + 1, 100);
            }
        });
    };

    const handleRestart = () => {
        const scoreRef = ref(database, 'game/score');
        runTransaction(scoreRef, () => 0);
        setWinner(null);
    };

    const progress = Math.min(Math.max(((score + 100) / 200) * 100, 0), 100);

    if (!userTeam) {
        return (
            <div className="cyber-container selection-screen">
                <h1 className="cyber-title">CHOOSE YOUR ALLIANCE</h1>
                <div className="team-selection">
                    <button
                        className="cyber-button blue-team big-btn"
                        onClick={() => setUserTeam('blue')}
                    >
                        JOIN BLUE TEAM
                    </button>
                    <button
                        className="cyber-button red-team big-btn"
                        onClick={() => setUserTeam('red')}
                    >
                        JOIN RED TEAM
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`cyber-container ${userTeam}-theme`}>
            <h1 className="cyber-title">CYBER TUG OF WAR</h1>
            <h3 className="team-indicator">YOU ARE: <span className={userTeam === 'blue' ? 'text-blue' : 'text-red'}>{userTeam.toUpperCase()} TEAM</span></h3>

            <div className="score-display">
                <span className="score-value">{score}</span>
            </div>

            <div className="tug-bar-container">
                <div className="tug-bar-background">
                    <div
                        className="tug-bar-fill"
                        style={{ width: `${progress}%` }}
                    />
                    <div className="center-marker" />
                </div>
            </div>

            <div className="controls">
                <button
                    className={`cyber-button ${userTeam}-team pull-btn`}
                    onClick={() => handlePull(userTeam)}
                    disabled={!!winner}
                >
                    {userTeam === 'blue' ? '<< PULL LEFT' : 'PULL RIGHT >>'}
                    <br />
                    <span className="key-hint">[SPACEBAR]</span>
                </button>
            </div>

            {winner && (
                <div className="victory-overlay">
                    <div className={`victory-content ${winner}-win`}>
                        <h2>{winner === 'blue' ? 'BLUE TEAM' : 'RED TEAM'} WINS!</h2>
                        <button className="cyber-button restart-btn" onClick={handleRestart}>
                            RESTART SYSTEM
                        </button>
                    </div>
                </div>
            )}

            <div className="instructions">
                <p>Spam SPACEBAR or CLICK to win!</p>
            </div>
        </div>
    );
};

export default Game;
