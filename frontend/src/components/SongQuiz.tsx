import { useState, useEffect } from "react";
import WebPlayback from "./WebPlayback";
import "./SongQuiz.css";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  uri: string;
}

interface QuizData {
  correctId: string;
  options: Track[];
}

export default function SongQuiz() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>("");
  
  // Game State
  const [gameState, setGameState] = useState<"MENU" | "PLAYING" | "RESULT" | "GAME_OVER">("MENU");
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  
  // Round State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function getToken() {
      try {
        const response = await fetch(`${API_URL}/token`, { credentials: "include" });
        const json = await response.json();
        setToken(json.access_token);
      } catch (e) {
        console.error("Error fetching token", e);
      }
    }
    getToken();
  }, [API_URL]);

  const startGame = (rounds: number) => {
    setTotalRounds(rounds);
    setCurrentRound(1);
    setScore(0);
    setCorrectAnswers(0);
    setReactionTimes([]);
    fetchQuestion();
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setQuizData(null);
    setSelectedOption(null);
    setIsCorrect(null);
    setPlaying(false);
    setPlayingUri(null);
    setStartTime(null);
    setEarnedPoints(null);
    
    try {
      const res = await fetch(`${API_URL}/quiz/question`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch question");
      const data = await res.json();
      setQuizData(data);
      setGameState("PLAYING");
    } catch (err) {
      console.error("Failed to fetch quiz", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-play when quiz data is loaded
  useEffect(() => {
    if (quizData && token && gameState === "PLAYING") {
      const correctTrack = quizData.options.find(t => t.id === quizData.correctId);
      if (correctTrack) {
        setPlaying(true);
        setPlayingUri(correctTrack.uri);
        setStartTime(Date.now());
      }
    }
  }, [quizData, token, gameState]);

  const handleGuess = (trackId: string) => {
    if (gameState !== "PLAYING" || !quizData) return;

    // Stop playback immediately
    setPlayingUri(null);
    setPlaying(false);

    setSelectedOption(trackId);
    const correct = trackId === quizData.correctId;
    setIsCorrect(correct);
    setGameState("RESULT");

    if (correct && startTime) {
      const timeTaken = Date.now() - startTime;
      setReactionTimes(prev => [...prev, timeTaken]);
      setCorrectAnswers(prev => prev + 1);
      
      // Max score 1000, decreases by 50 points every second
      const points = Math.max(10, 1000 - Math.floor(timeTaken / 1000) * 50);
      setScore(s => s + points);
      setEarnedPoints(points);
    } else {
        setEarnedPoints(0);
    }
  };

  const nextRound = () => {
    if (currentRound >= totalRounds) {
      setGameState("GAME_OVER");
    } else {
      setCurrentRound(prev => prev + 1);
      fetchQuestion();
    }
  };

  const getAverageReactionTime = () => {
    if (reactionTimes.length === 0) return 0;
    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    return (sum / reactionTimes.length / 1000).toFixed(2);
  };

  if (gameState === "MENU") {
    return (
      <div className="app-content center-content">
        <h1 className="section-title">Song Quiz 🎵</h1>
        <p className="quiz-desc">Guess the song from your history!</p>
        <p className="quiz-desc">Select Rounds:</p>
        <div className="round-selection">
            {[5, 10, 20].map(r => (
                <button key={r} className="round-btn" onClick={() => startGame(r)}>
                    {r} Rounds
                </button>
            ))}
        </div>
      </div>
    );
  }

  if (gameState === "GAME_OVER") {
    return (
      <div className="app-content center-content">
        <h1 className="section-title">Game Over! 🏆</h1>
        <div className="stats-card">
            <div className="stat-item">
                <span className="stat-label">Final Score</span>
                <span className="stat-value gold">{score}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">{correctAnswers} / {totalRounds}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Avg Speed</span>
                <span className="stat-value">{getAverageReactionTime()}s</span>
            </div>
        </div>
        <button className="start-btn" onClick={() => setGameState("MENU")}>Play Again</button>
      </div>
    );
  }

  if (loading) {
    return <div className="app-content loading-container">Loading question...</div>;
  }

  if (!quizData) {
    return (
        <div className="app-content center-content">
            <p className="error-msg">Failed to load question. Try again.</p>
            <button className="start-btn" onClick={fetchQuestion}>Retry</button>
        </div>
    );
  }

  return (
    <div className="app-content quiz-container">
      <div className="quiz-header">
        <div className="quiz-meta">
            <span className="round-badge">Round {currentRound} / {totalRounds}</span>
            <span className="quiz-score">Score: {score}</span>
        </div>
        <p className="quiz-instruction">Guess the song playing now!</p>
      </div>

      <div className="options-grid">
        {quizData.options.map(track => (
          <button 
            key={track.id} 
            className={`option-card ${
              gameState === "RESULT" 
                ? track.id === quizData.correctId 
                  ? "correct" 
                  : track.id === selectedOption 
                    ? "wrong" 
                    : "dimmed"
                : ""
            }`}
            onClick={() => handleGuess(track.id)}
            disabled={gameState !== "PLAYING"}
          >
            {gameState === "RESULT" && (
                <img src={track.album.images[0].url} alt="" className="option-img" />
            )}
            <div className="option-info">
              <h3 className="option-name">{track.name}</h3>
              <p className="option-artist">{track.artists[0].name}</p>
            </div>
          </button>
        ))}
      </div>

      {gameState === "RESULT" && (
        <div className="result-actions">
          <h2 className="result-msg">
            {isCorrect ? "Correct! 🎉" : "Wrong! 😢"}
          </h2>
          {isCorrect && earnedPoints !== null && (
              <div className="points-earned">+{earnedPoints} pts</div>
          )}
          <button className="next-btn" onClick={nextRound}>
            {currentRound >= totalRounds ? "Finish Game" : "Next Question"}
          </button>
        </div>
      )}
      
      {/* Hidden WebPlayback to handle playback */}
      {token && playingUri && (
        <div style={{display:'none'}}>
            <WebPlayback token={token} trackUri={playingUri} />
        </div>
      )}
    </div>
  );
}
