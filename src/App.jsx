import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import "./App.css";

const SUBJECTS = [
  {
    id: "mathematics",
    name: "Mathematics",
    tagline: "Geometry, logic, and worked solutions",
    accent: "var(--accent-blue)",
    glow: "rgba(76, 145, 255, 0.28)",
    prompt:
      "Help me solve this like an MYP 3 math coach. Explain the method, show the reasoning, and give one similar practice question.",
    checkpoints: ["Warm-up drill", "Worked example", "Mistake check"],
  },
  {
    id: "language-and-literature",
    name: "Language & Literature",
    tagline: "Analysis, themes, and stronger responses",
    accent: "var(--accent-coral)",
    glow: "rgba(255, 120, 89, 0.26)",
    prompt:
      "Coach me through a Language & Literature response. Focus on analysis, evidence, and how to sound sharper without overcomplicating it.",
    checkpoints: ["Annotate text", "Pick evidence", "Write insight"],
  },
  {
    id: "sciences",
    name: "Sciences",
    tagline: "Clear concepts, diagrams, and revision prompts",
    accent: "var(--accent-mint)",
    glow: "rgba(104, 226, 171, 0.25)",
    prompt:
      "Teach this science topic clearly for MYP 3. Use simple language first, then add keywords, real-world examples, and a quick recall quiz.",
    checkpoints: ["Concept map", "Keyword recap", "Rapid quiz"],
  },
  {
    id: "language-acquisition",
    name: "Language Acquisition",
    tagline: "Vocabulary, speaking prep, and writing support",
    accent: "var(--accent-gold)",
    glow: "rgba(255, 194, 76, 0.27)",
    prompt:
      "Act as a patient language coach. Help me improve vocabulary, sentence structure, and confidence for MYP 3 speaking and writing tasks.",
    checkpoints: ["Useful phrases", "Sentence upgrade", "Fluency check"],
  },
  {
    id: "individuals-and-societies",
    name: "Individuals & Societies",
    tagline: "Case studies, causes, effects, and argumentation",
    accent: "var(--accent-violet)",
    glow: "rgba(162, 123, 255, 0.26)",
    prompt:
      "Support me with Individuals & Societies revision. Break down the topic, compare perspectives, and help me structure a high-quality answer.",
    checkpoints: ["Context scan", "Compare views", "Answer frame"],
  },
];

const MODES = [
  {
    title: "Essay Rescue",
    blurb: "Turn vague ideas into a structured response with better evidence and stronger phrasing.",
  },
  {
    title: "Exam Sprint",
    blurb: "Generate high-focus revision prompts for your next 25-minute study block.",
  },
  {
    title: "Concept Repair",
    blurb: "Fix shaky understanding before it turns into repeated mistakes.",
  },
];

const ROADMAP = [
  {
    phase: "Discover",
    text: "Pick a subject, lock in your goal, and let the dashboard surface the right starting point.",
  },
  {
    phase: "Focus",
    text: "Run a timer, chip away at tasks, and work inside one calm, high-clarity study environment.",
  },
  {
    phase: "Refine",
    text: "Use the AI coach for explanations, feedback, and fast correction when you get stuck.",
  },
];

const INITIAL_TASKS = [
  { id: 1, text: "Review one weak topic before class", done: false },
  { id: 2, text: "Complete one past-paper style question", done: true },
  { id: 3, text: "Ask the coach for targeted feedback", done: false },
];

const QUICK_PROMPTS = [
  "Explain this topic like I am behind and need a clean reset.",
  "Quiz me with five medium questions and reveal answers after.",
  "Turn my notes into a compact revision sheet.",
  "Help me improve a short written response using MYP language.",
];

const SIGNALS = [
  "Vercel-ready API flow",
  "Responsive motion system",
  "Persistent daily planner",
];

const FALLBACK_REPLY =
  "The live AI route is not responding right now, but the workspace is ready. If you deploy with the serverless `/api/chat` endpoint configured, this panel will answer in real time.";

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

async function sendChatMessage(system, user) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text?.trim() || FALLBACK_REPLY;
}

export default function App() {
  const [activeSubjectId, setActiveSubjectId] = useState(SUBJECTS[0].id);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "I’m your study co-pilot. Pick a subject, choose a focus mode, and I’ll help you revise, explain, or sharpen answers.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [tasks, setTasks] = useState(() => {
    const stored = localStorage.getItem("myp3-study-tasks");
    return stored ? JSON.parse(stored) : INITIAL_TASKS;
  });
  const [taskDraft, setTaskDraft] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [focusLength, setFocusLength] = useState(25);
  const [selectedMode, setSelectedMode] = useState(MODES[0].title);
  const [dailyTarget, setDailyTarget] = useState("Finish two focused study blocks");
  const chatEndRef = useRef(null);

  const activeSubject = useMemo(
    () => SUBJECTS.find((subject) => subject.id === activeSubjectId) ?? SUBJECTS[0],
    [activeSubjectId],
  );

  useEffect(() => {
    localStorage.setItem("myp3-study-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setTimerSeconds(focusLength * 60);
  }, [focusLength]);

  const onTimerFinish = useEffectEvent(() => {
    setTimerActive(false);
  });

  useEffect(() => {
    if (!timerActive) return undefined;

    const intervalId = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          onTimerFinish();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerActive]);

  function addTask() {
    const trimmed = taskDraft.trim();
    if (!trimmed) return;

    setTasks((current) => [
      ...current,
      { id: Date.now(), text: trimmed, done: false },
    ]);
    setTaskDraft("");
  }

  function toggleTask(taskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function queuePrompt(prompt) {
    setChatInput(prompt);
  }

  async function handleSend(customText) {
    const content = (customText ?? chatInput).trim();
    if (!content || isSending) return;

    const nextUserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((current) => [...current, nextUserMessage]);
    setChatInput("");
    setIsSending(true);

    const systemPrompt = `You are MyP3 Study, an elite but kind study assistant for MYP 3 learners. Current subject: ${activeSubject.name}. Current study mode: ${selectedMode}. Daily target: ${dailyTarget}. Give practical, motivating help with clear structure and no fluff.`;

    try {
      const reply = await sendChatMessage(systemPrompt, content);
      startTransition(() => {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: reply,
          },
        ]);
      });
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: FALLBACK_REPLY,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const completedTasks = tasks.filter((task) => task.done).length;
  const completionRate = Math.round((completedTasks / Math.max(tasks.length, 1)) * 100);

  return (
    <div className="app-shell">
      <div className="backdrop-grid" aria-hidden="true" />
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="hero">
        <nav className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">M3</div>
            <div>
              <p className="eyebrow">Study Command Center</p>
              <h1>myp3-study</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="status-pill">Live AI Coach</span>
            <button
              type="button"
              className="ghost-button"
              onClick={() => queuePrompt(activeSubject.prompt)}
            >
              Use Subject Prompt
            </button>
          </div>
        </nav>

        <div className="hero-grid">
          <section className="hero-copy panel panel-hero reveal" style={{ "--delay": "0.05s" }}>
            <p className="eyebrow">Built for momentum, not clutter</p>
            <h2>Study sessions that feel sharp, calm, and actually useful.</h2>
            <p className="hero-text">
              This redesign turns the site into a premium study cockpit for MYP 3
              students: one place for revision planning, focus blocks, and an AI
              coach that can explain, quiz, and improve work on demand.
            </p>

            <div className="signal-row" aria-label="product highlights">
              {SIGNALS.map((signal, index) => (
                <span
                  key={signal}
                  className="signal-pill reveal"
                  style={{ "--delay": `${0.12 + index * 0.08}s` }}
                >
                  {signal}
                </span>
              ))}
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => queuePrompt("Build me a study plan for today based on my current subject.")}
              >
                Start Today&apos;s Plan
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setFocusLength(45);
                  setTimerSeconds(45 * 60);
                }}
              >
                Switch To 45 Min Deep Focus
              </button>
            </div>

            <div className="stats-row">
              <article className="stat-card reveal" style={{ "--delay": "0.18s" }}>
                <span>Task progress</span>
                <strong>{completionRate}%</strong>
                <small>{completedTasks} completed today</small>
              </article>
              <article className="stat-card reveal" style={{ "--delay": "0.26s" }}>
                <span>Current mode</span>
                <strong>{selectedMode}</strong>
                <small>{activeSubject.name}</small>
              </article>
              <article className="stat-card reveal" style={{ "--delay": "0.34s" }}>
                <span>Focus timer</span>
                <strong>{formatTime(timerSeconds)}</strong>
                <small>{timerActive ? "In session" : "Ready to begin"}</small>
              </article>
            </div>
          </section>

          <aside className="panel panel-spotlight reveal" style={{ "--delay": "0.12s" }}>
            <p className="eyebrow">Active subject</p>
            <h3>{activeSubject.name}</h3>
            <p className="muted">{activeSubject.tagline}</p>

            <div
              className="subject-glow"
              style={{ "--subject-accent": activeSubject.accent, "--subject-glow": activeSubject.glow }}
            />

            <div className="checkpoints">
              {activeSubject.checkpoints.map((checkpoint) => (
                <div key={checkpoint} className="checkpoint">
                  <span className="checkpoint-dot" />
                  <span>{checkpoint}</span>
                </div>
              ))}
            </div>

            <div className="target-box">
              <label htmlFor="daily-target">Daily target</label>
              <input
                id="daily-target"
                value={dailyTarget}
                onChange={(event) => setDailyTarget(event.target.value)}
                placeholder="What matters most today?"
              />
            </div>
          </aside>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel reveal" style={{ "--delay": "0.08s" }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Subjects</p>
              <h3>Choose your lane</h3>
            </div>
            <p className="muted">Each track primes the coach and shifts the workspace emphasis.</p>
          </div>

          <div className="subjects-grid">
            {SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                type="button"
                className={`subject-card reveal ${subject.id === activeSubjectId ? "active" : ""}`}
                onClick={() => setActiveSubjectId(subject.id)}
                style={{
                  "--subject-accent": subject.accent,
                  "--subject-glow": subject.glow,
                  "--delay": `${0.12 + SUBJECTS.indexOf(subject) * 0.06}s`,
                }}
              >
                <span className="subject-title">{subject.name}</span>
                <span className="subject-tagline">{subject.tagline}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="panel reveal" style={{ "--delay": "0.1s" }}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Study modes</p>
                <h3>Pick the kind of help you need</h3>
              </div>
            </div>

            <div className="mode-list">
              {MODES.map((mode) => (
                <button
                  key={mode.title}
                  type="button"
                  className={`mode-card reveal ${selectedMode === mode.title ? "selected" : ""}`}
                  onClick={() => setSelectedMode(mode.title)}
                  style={{ "--delay": `${0.16 + MODES.indexOf(mode) * 0.08}s` }}
                >
                  <strong>{mode.title}</strong>
                  <span>{mode.blurb}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="panel reveal" style={{ "--delay": "0.18s" }}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Focus timer</p>
                <h3>Run a deliberate session</h3>
              </div>
            </div>

            <div className={`timer-orb ${timerActive ? "active" : ""}`}>
              <span>{formatTime(timerSeconds)}</span>
            </div>

            <div className="timer-presets">
              {[15, 25, 45].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={focusLength === minutes ? "preset active" : "preset"}
                  onClick={() => {
                    setFocusLength(minutes);
                    setTimerActive(false);
                    setTimerSeconds(minutes * 60);
                  }}
                >
                  {minutes} min
                </button>
              ))}
            </div>

            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => setTimerActive((current) => !current)}
              >
                {timerActive ? "Pause" : "Start Focus"}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setTimerActive(false);
                  setTimerSeconds(focusLength * 60);
                }}
              >
                Reset
              </button>
            </div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel reveal" style={{ "--delay": "0.1s" }}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Planner</p>
                <h3>Keep today small and winnable</h3>
              </div>
            </div>

            <div className="task-compose">
              <input
                value={taskDraft}
                onChange={(event) => setTaskDraft(event.target.value)}
                placeholder="Add a study task"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addTask();
                }}
              />
              <button type="button" className="primary-button" onClick={addTask}>
                Add
              </button>
            </div>

            <div className="task-list">
              {tasks.map((task) => (
                <label key={task.id} className={`task-item ${task.done ? "done" : ""}`}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span>{task.text}</span>
                </label>
              ))}
            </div>
          </article>

          <article className="panel roadmap-panel reveal" style={{ "--delay": "0.18s" }}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Workflow</p>
                <h3>How the product now feels</h3>
              </div>
            </div>

            <div className="roadmap">
              {ROADMAP.map((item, index) => (
                <div key={item.phase} className="roadmap-step">
                  <div className="roadmap-marker">{index + 1}</div>
                  <div>
                    <strong>{item.phase}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel chat-panel reveal" style={{ "--delay": "0.12s" }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI Coach</p>
              <h3>Ask for help without breaking focus</h3>
            </div>
            <p className="muted">Powered through the existing serverless chat endpoint.</p>
          </div>

          <div className="prompt-row">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="prompt-chip"
                onClick={() => queuePrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="chat-log">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`message reveal ${message.role === "user" ? "user" : "assistant"}`}
                style={{ "--delay": "0s" }}
              >
                <span className="message-role">
                  {message.role === "user" ? "You" : "Coach"}
                </span>
                <p>{message.content}</p>
              </article>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-compose">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder={`Ask for help with ${activeSubject.name.toLowerCase()}...`}
              rows={4}
            />

            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => handleSend(activeSubject.prompt)}
                disabled={isSending}
              >
                Subject Boost
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleSend()}
                disabled={isSending}
              >
                {isSending ? "Thinking..." : "Send To Coach"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
