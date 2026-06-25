// VideoInterview.jsx — Fully Automatic Video Interview
// Uses refs for all mutable values to avoid stale closure bugs.
// Flow: camera starts → question spoken → recording (30s) → auto-submit → next question

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";

const ANSWER_SECONDS = 30;

export default function VideoInterview() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  // UI state
  const [phase, setPhase] = useState("init"); // init | speaking | recording | processing | evaluating | done | error
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(ANSWER_SECONDS);
  const [evaluation, setEvaluation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // Refs — used inside async callbacks to always get fresh values
  const videoRef = useRef(null);
  const streamRef = useRef(null); // video preview stream
  const audioStreamRef = useRef(null); // separate mic stream, recorded and sent for transcription
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const interviewIdRef = useRef(null);
  const questionsRef = useRef([]);
  const indexRef = useRef(0);
  const phaseRef = useRef("init");

  function setPhaseSync(p) {
    phaseRef.current = p;
    setPhase(p);
  }

  // ─── STEP 1: Fetch questions on mount ───────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const res = await api.post("/interview/start", { application_id: applicationId });
        interviewIdRef.current = res.data.interview_id;
        questionsRef.current = res.data.questions;
        setQuestions(res.data.questions);
        startCamera();
      } catch (err) {
        setErrorMsg(err.response?.data?.error || "Failed to start interview");
        setPhaseSync("error");
      }
    }
    init();
    return () => cleanup();
  }, []);

  // ─── STEP 2: Start camera + mic ──────────────────────────────────────────────
  async function startCamera() {
    try {
      // Separate video (preview only) and audio (recorded + transcribed server-side) streams.
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = videoStream;
      if (videoRef.current) videoRef.current.srcObject = videoStream;

      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = audioStream;

      // Small delay then ask first question
      setTimeout(() => askQuestion(0), 1000);
    } catch {
      setErrorMsg("Camera/microphone access denied. Please allow and reload.");
      setPhaseSync("error");
    }
  }

  // ─── STEP 3: Speak question then auto-record ─────────────────────────────────
  function askQuestion(idx) {
    const q = questionsRef.current[idx];
    if (!q) return;

    indexRef.current = idx;
    setCurrentIndex(idx);
    setCurrentQuestion(q);
    setTranscript("");
    setPhaseSync("speaking");

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(q.question);
    utterance.rate = 0.85;
    utterance.pitch = 1;

    // Estimate reading time as fallback
    const readingMs = Math.max(3000, q.question.split(" ").length * 400);
    let started = false;

    function beginRecording() {
      if (started) return;
      started = true;
      startRecording(q);
    }

    utterance.onend = beginRecording;
    setTimeout(beginRecording, readingMs);
    window.speechSynthesis.speak(utterance);
  }

  // ─── STEP 4: Record answer for 30 seconds ────────────────────────────────────
  function startRecording(question) {
    if (phaseRef.current === "recording") return; // guard double call
    setPhaseSync("recording");
    setTimeLeft(ANSWER_SECONDS);
    setTranscript("");

    // Record the mic audio for the full 30s window; it's uploaded and transcribed
    // server-side (Groq Whisper) once recording stops — no live captions, but far
    // more accurate and not dependent on the browser keeping a live connection.
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(audioStreamRef.current);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;

    // Countdown
    let remaining = ANSWER_SECONDS;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        submitAnswer(question);
      }
    }, 1000);
  }

  // ─── STEP 5: Stop recording, transcribe, submit, move to next question ──────
  async function submitAnswer(question) {
    clearInterval(timerRef.current);
    setPhaseSync("processing");

    const audioBlob = await new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob(audioChunksRef.current, { type: "audio/webm" }));
        return;
      }
      recorder.onstop = () => resolve(new Blob(audioChunksRef.current, { type: "audio/webm" }));
      recorder.stop();
    });

    let answer = "(No speech detected)";
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");
      const transcribeRes = await api.post("/interview/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      answer = transcribeRes.data.transcript?.trim() || "(No speech detected)";
      setTranscript(answer);
    } catch (err) {
      console.warn("Transcription failed:", err.response?.data?.error || err.message);
    }

    try {
      await api.post("/interview/answer", {
        interview_id: interviewIdRef.current,
        question_id: question.id,
        question: question.question,
        answer,
        round: question.round,
      });

      const nextIdx = indexRef.current + 1;
      if (nextIdx >= questionsRef.current.length) {
        evaluate();
      } else {
        setTimeout(() => askQuestion(nextIdx), 800);
      }
    } catch (err) {
      // On submit error, skip to next question anyway
      const nextIdx = indexRef.current + 1;
      if (nextIdx >= questionsRef.current.length) {
        evaluate();
      } else {
        setTimeout(() => askQuestion(nextIdx), 1000);
      }
    }
  }

  // ─── STEP 6: Final evaluation ─────────────────────────────────────────────
  async function evaluate() {
    setPhaseSync("evaluating");
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach((t) => t.stop());

    try {
      const res = await api.post("/interview/evaluate", {
        interview_id: interviewIdRef.current,
      });
      setEvaluation(res.data);
      setPhaseSync("done");
    } catch (err) {
      setErrorMsg("Evaluation failed: " + (err.response?.data?.error || err.message));
      setPhaseSync("error");
    }
  }

  function cleanup() {
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();
    try { mediaRecorderRef.current?.stop(); } catch {}
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach((t) => t.stop());
  }

  // ─── RESULTS SCREEN ──────────────────────────────────────────────────────────
  if (phase === "done" && evaluation) {
    const recColor = evaluation.recommendation === "Strong Hire" ? "green"
      : evaluation.recommendation === "No Hire" ? "red" : "#b45309";

    return (
      <div>
        <Navbar />
        <div style={{ maxWidth: "680px", margin: "40px auto", padding: "0 24px" }}>
          <h2>Interview Complete</h2>
          <div style={{ border: "1px solid #000", padding: "24px", marginTop: "16px" }}>
            <h3 style={{ marginTop: 0 }}>Your Scores</h3>
            <table>
              <tbody>
                <tr><td style={{ padding: "8px 16px 8px 0" }}><strong>Technical</strong></td><td>{evaluation.technical_score}/100</td></tr>
                <tr><td style={{ padding: "8px 16px 8px 0" }}><strong>Communication</strong></td><td>{evaluation.communication_score}/100</td></tr>
                <tr><td style={{ padding: "8px 16px 8px 0" }}><strong>Overall</strong></td><td>{evaluation.overall_score}/100</td></tr>
                <tr>
                  <td style={{ padding: "8px 16px 8px 0" }}><strong>Recommendation</strong></td>
                  <td style={{ color: recColor, fontWeight: "bold" }}>{evaluation.recommendation}</td>
                </tr>
              </tbody>
            </table>
            <button className="btn-secondary" style={{ marginTop: "20px" }} onClick={() => navigate("/candidate/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ERROR SCREEN ─────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 24px" }}>
          <p style={{ color: "red" }}>{errorMsg}</p>
          <button className="btn-secondary" onClick={() => navigate("/candidate/jobs")}>Go Back</button>
        </div>
      </div>
    );
  }

  // ─── INTERVIEW SCREEN ─────────────────────────────────────────────────────
  const statusLabel = {
    init: "Starting...",
    speaking: "Interviewer is speaking...",
    recording: `Recording — ${timeLeft}s left`,
    processing: "Transcribing your answer...",
    evaluating: "Generating evaluation...",
  }[phase] || "Please wait...";

  const statusColor = phase === "recording" ? "#dc2626" : phase === "speaking" ? "#2563eb" : "#555";

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "960px", margin: "32px auto", padding: "0 24px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0 }}>Video Interview</h2>
            <p style={{ margin: "4px 0 0", color: "#555" }}>
              {questions.length > 0 ? `Question ${Math.min(currentIndex + 1, questions.length)} of ${questions.length}` : "Loading..."}
            </p>
          </div>
          <div style={{ padding: "6px 16px", border: `2px solid ${statusColor}`, color: statusColor, fontWeight: "bold", fontSize: "14px" }}>
            {statusLabel}
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px" }}>

          {/* Video feed */}
          <div style={{ flex: 1 }}>
            <video ref={videoRef} autoPlay muted style={{ width: "100%", border: "2px solid #000", background: "#111", display: "block" }} />

            {/* Timer bar */}
            {phase === "recording" && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ height: "8px", background: "#e5e7eb", border: "1px solid #000" }}>
                  <div style={{
                    height: "100%",
                    width: `${(timeLeft / ANSWER_SECONDS) * 100}%`,
                    background: timeLeft <= 10 ? "#dc2626" : "#2563eb",
                  }} />
                </div>
                <p style={{ textAlign: "right", fontSize: "12px", color: timeLeft <= 10 ? "red" : "#555", margin: "4px 0 0" }}>
                  {timeLeft}s remaining
                </p>
              </div>
            )}

            {/* Progress dots, grouped by round */}
            {questions.length > 0 && (
              <div style={{ display: "flex", gap: "14px", marginTop: "12px", flexWrap: "wrap" }}>
                {Object.entries(
                  questions.reduce((groups, q, i) => {
                    const key = q.round || "General";
                    (groups[key] = groups[key] || []).push(i);
                    return groups;
                  }, {})
                ).map(([round, indices]) => (
                  <div key={round}>
                    <p style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", margin: "0 0 4px" }}>{round}</p>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {indices.map((i) => (
                        <div key={i} style={{
                          width: "14px", height: "14px",
                          border: "1px solid #000",
                          background: i < currentIndex ? "#2563eb" : i === currentIndex ? "#000" : "#fff",
                        }} title={`Question ${i + 1}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Current question */}
            {currentQuestion && (
              <div style={{ border: "2px solid #000", padding: "16px" }}>
                <p style={{ fontSize: "11px", color: "#2563eb", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold" }}>
                  Round: {currentQuestion.round} — {currentQuestion.topic}
                </p>
                <p style={{ fontSize: "15px", fontWeight: "bold", margin: 0, lineHeight: "1.5" }}>
                  {currentQuestion.question}
                </p>
              </div>
            )}

            {/* Recording / transcript status */}
            {phase === "recording" && (
              <div style={{ border: "1px solid #ccc", padding: "12px", background: "#fafafa", minHeight: "100px" }}>
                <p style={{ fontWeight: "bold", margin: "0 0 6px", fontSize: "12px", textTransform: "uppercase" }}>Recording</p>
                <p style={{ margin: 0, color: "#333", fontSize: "14px", lineHeight: "1.6" }}>
                  Speak your answer now. It will be transcribed once the timer ends.
                </p>
              </div>
            )}
            {phase === "processing" && (
              <div style={{ border: "1px solid #ccc", padding: "12px", background: "#fafafa", minHeight: "100px" }}>
                <p style={{ fontWeight: "bold", margin: "0 0 6px", fontSize: "12px", textTransform: "uppercase" }}>Your Answer</p>
                <p style={{ margin: 0, color: "#333", fontSize: "14px", lineHeight: "1.6" }}>
                  {transcript || "Transcribing..."}
                </p>
              </div>
            )}

            {/* Waiting states */}
            {(phase === "init" || phase === "evaluating") && (
              <div style={{ border: "1px solid #ccc", padding: "16px", textAlign: "center", color: "#555" }}>
                {phase === "init" ? "Preparing your personalized interview..." : "Analyzing your responses and generating scores..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
