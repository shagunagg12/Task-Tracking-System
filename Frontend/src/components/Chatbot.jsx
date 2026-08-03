import React, { useState, useEffect, useRef } from 'react';
import avatar from '../assets/chatbot-avatar.png';
import Preloader from './common/Preloader';
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5024/api';

const botConfigs = {
  daksh: {
    name: 'Daksh',
    role: 'Technical Lead & Code Expert',
    video: '/image/daksh.mp4',
    initialMessages: [
      { sender: 'bot', text: 'Hello, I am Daksh. How can I help you?' }
    ],
    suggestions: [
      'Help me debug a React error',
      'Explain how JWT authentication works in .NET',
      'Optimize a SQL query'
    ],
    getResponse: (input) => {
      const lower = input.toLowerCase();
      if (lower.includes('debug') || lower.includes('error') || lower.includes('fail') || lower.includes('bug')) {
        return "Ah, debugging time! Paste the error message or code snippet here. Let's check for common issues like null references, syntax errors, or incorrect imports.";
      }
      if (lower.includes('jwt') || lower.includes('auth') || lower.includes('login') || lower.includes('token')) {
        return "JWT (JSON Web Token) authentication is great for stateless APIs. In .NET, you set it up in Program.cs using `AddJwtBearer`. The client stores the token (like in localStorage) and sends it in the Authorization header. What part are you implementing?";
      }
      if (lower.includes('sql') || lower.includes('query') || lower.includes('database')) {
        return "To optimize a query, first check if you have proper indexes on the columns used in JOIN, WHERE, and ORDER BY clauses. Avoid `SELECT *` and use Execution Plans to find bottlenecks. Let's look at your query!";
      }
      return "Got it. Let's break down this technical challenge. Could you share some code or describe the system design you're targeting?";
    }
  },
  ayush: {
    name: 'Ayush',
    role: 'HR Specialist & Team Lead',
    video: '/image/Ayush%20Badola%20Video.mp4',
    initialMessages: [
      { sender: 'bot', text: 'Hello, I am Ayush. How can I help you?' }
    ],
    suggestions: [
      'Check my social scoring',
      'Write an appreciation post for a colleague',
      'Resolve a team conflict'
    ],
    getResponse: (input) => {
      const lower = input.toLowerCase();
      if (lower.includes('score') || lower.includes('social') || lower.includes('scoring')) {
        return "Your social scoring is calculated based on peer appreciation, timely task completions, and active collaboration. Keep sharing positive vibes and supporting your teammates to see it rise!";
      }
      if (lower.includes('appreciate') || lower.includes('appreciation') || lower.includes('post') || lower.includes('thank')) {
        return "Writing appreciation posts is a great way to build team trust! You can say: 'Shoutout to @[Name] for going above and beyond to help resolve the issue in our latest release. Truly appreciate the support!' Want me to customize one?";
      }
      if (lower.includes('conflict') || lower.includes('disagree') || lower.includes('team')) {
        return "Conflicts are natural in high-performing teams. I suggest hosting a quick 1-on-1 alignment sync. Keep it focus-oriented rather than person-oriented. Let me know if you want to draft an invite.";
      }
      return "Team culture is everything. Tell me more about what's on your mind regarding collaboration or peer recognition!";
    }
  },
  rachit: {
    name: 'Rachit',
    role: 'Operations & Efficiency Optimizer',
    video: '/image/rachit.mp4',
    initialMessages: [
      { sender: 'bot', text: 'Hello, I am Rachit. How can I help you?' }
    ],
    suggestions: [
      'Analyze my task bottlenecks',
      'Tips for better time management',
      'How is my efficiency calculated?'
    ],
    getResponse: (input) => {
      const lower = input.toLowerCase();
      if (lower.includes('bottleneck') || lower.includes('delay') || lower.includes('stuck')) {
        return "Bottlenecks usually occur when dependencies are not resolved early. I recommend using a Kanban board to visualize blocked items and tackling the most critical blockers first thing in the morning.";
      }
      if (lower.includes('time') || lower.includes('management') || lower.includes('focus')) {
        return "Try the Pomodoro technique: 25 minutes of deep focus followed by a 5-minute break. Also, time-block your calendar for deep work and decline non-essential meetings. What's draining your time most right now?";
      }
      if (lower.includes('efficiency') || lower.includes('calculate')) {
        return "Efficiency is tracked by comparing your estimated time for tasks against actual completion times, along with the frequency of revisions. Consistent deliveries boost your rating!";
      }
      return "Let's streamline that! Describe your current daily routine or task queue, and let's find ways to automate or prioritize.";
    }
  },
  kartik: {
    name: 'Kartik',
    role: 'Mentorship & Skill Advisor',
    video: '/image/kartik.mp4',
    initialMessages: [
      { sender: 'bot', text: 'Hello, I am Kartik. How can I help you?' }
    ],
    suggestions: [
      'Suggest a frontend learning path',
      'Prepare for a system design interview',
      'How to learn new tech quickly'
    ],
    getResponse: (input) => {
      const lower = input.toLowerCase();
      if (lower.includes('frontend') || lower.includes('react') || lower.includes('learning path')) {
        return "For modern frontend, master JavaScript (ES6+), then deep dive into React (hooks, state management, context API), learn Tailwind/Vanilla CSS styling patterns, and pick up Vite or Next.js. What's your current level?";
      }
      if (lower.includes('system design') || lower.includes('interview') || lower.includes('architecture')) {
        return "System design interviews focus on scalability. Start by understanding Load Balancers, Caching (Redis), Database Sharding, and Microservices vs Monoliths. Let's practice designing a specific service!";
      }
      if (lower.includes('learn') || lower.includes('fast') || lower.includes('quick')) {
        return "The best way to learn new tech is by building. Don't just watch tutorials; start a small project and build it step-by-step. Reading documentation beats watching long video courses. What tech are you learning?";
      }
      return "Continuous learning is key to growth. Let me know what skills or certifications you are aiming for, and I'll help structure a plan!";
    }
  }
};

const botSystemPrompts = {
  daksh: "You are Daksh, the Technical Lead & Code Expert for this team. You are highly knowledgeable about React, JavaScript/TypeScript, .NET Core C#, database optimization, and software architecture. Keep your replies concise, helpful, and developer-friendly. Help the user debug, write, or refactor code.",
  ayush: "You are Ayush, the HR Specialist & Team Lead. You focus on team collaboration, workplace satisfaction, peer recognition, social scoring, conflict resolution, and understanding company culture and policies. Be warm, empathetic, encouraging, and professional.",
  rachit: "You are Rachit, the Operations & Efficiency Optimizer. Your goal is to help users optimize their schedules, eliminate bottlenecks, improve productivity (e.g., using the Pomodoro technique or time blocking), and streamline their workflows. Be structured, analytical, and highly direct.",
  kartik: "You are Kartik, the Mentorship & Skill Advisor. You guide users on learning paths (especially modern frontend/backend stacks), skill acquisition, continuous learning, and system design interview preparation. Be supportive, informative, and inspiring."
};

const Chatbot = ({ isSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [chatHistories, setChatHistories] = useState(() => {
    const saved = localStorage.getItem('dark_chat_histories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      daksh: [...botConfigs.daksh.initialMessages],
      ayush: [...botConfigs.ayush.initialMessages],
      rachit: [...botConfigs.rachit.initialMessages],
      kartik: [...botConfigs.kartik.initialMessages]
    };
  });
  const [sessionStartLengths] = useState(() => ({
    daksh: chatHistories.daksh?.length || 1,
    ayush: chatHistories.ayush?.length || 1,
    rachit: chatHistories.rachit?.length || 1,
    kartik: chatHistories.kartik?.length || 1
  }));
  const [showPrevious, setShowPrevious] = useState({});
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('dark_chat_histories', JSON.stringify(chatHistories));
  }, [chatHistories]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistories, selectedBot, isTyping]);

  const handleToggle = () => {
    if (!isOpen) {
      setIsLoading(true);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const detectDepartment = (input, currentBot) => {
    const lower = input.toLowerCase();
    const depts = [
      {
        bot: 'daksh',
        name: 'Daksh',
        role: 'Tech Lead',
        keywords: ['code', 'debug', 'react', 'auth', 'jwt', 'database', 'query', 'sql', 'c#', 'dotnet', 'javascript', 'backend', 'frontend', 'bug', 'error', 'api', 'compil']
      },
      {
        bot: 'ayush',
        name: 'Ayush',
        role: 'HR Specialist',
        keywords: ['leave', 'voucher', 'appreciat', 'thank', 'social score', 'holiday', 'policy', 'benefits', 'salary', 'hr', 'appraisal', 'culture', 'vibe']
      },
      {
        bot: 'rachit',
        name: 'Rachit',
        role: 'Operations Optimizer',
        keywords: ['workflow', 'efficien', 'time', 'productivity', 'priority', 'bottleneck', 'automat', 'optimise', 'optimize', 'performance', 'pomodoro']
      },
      {
        bot: 'kartik',
        name: 'Kartik',
        role: 'Mentorship Advisor',
        keywords: ['learn', 'study', 'frontend path', 'skill', 'mentor', 'interview', 'prep', 'career', 'study', 'acqui', 'certification']
      }
    ];

    for (const dept of depts) {
      if (dept.bot === currentBot) continue;
      if (dept.keywords.some(kw => lower.includes(kw))) {
        return dept;
      }
    }
    return null;
  };

  const handleTransfer = (targetBot, originalText) => {
    setSelectedBot(targetBot);
    
    const transferMsg = {
      sender: 'bot',
      text: `🔄 Transferred conversation to ${botConfigs[targetBot].name} (${botConfigs[targetBot].role}).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistories(prev => ({
      ...prev,
      [targetBot]: [...prev[targetBot], transferMsg]
    }));

    setIsTyping(true);
    setTimeout(async () => {
      let botResponseText = "";
      try {
        const response = await fetch(`${API_URL}/chatbot/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bot: targetBot,
            text: originalText,
            messages: [
              { role: 'user', content: originalText }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          botResponseText = data.reply;
        } else {
          botResponseText = botConfigs[targetBot].getResponse(originalText);
        }
      } catch (err) {
        console.error("NVIDIA API transfer call failed, using fallback:", err);
        botResponseText = botConfigs[targetBot].getResponse(originalText);
      }

      const botMessage = {
        sender: 'bot',
        text: `Hey, I received your transferred query! Regarding your question:\n\n${botResponseText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistories(prev => ({
        ...prev,
        [targetBot]: [...prev[targetBot], botMessage]
      }));
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedBot) return;

    // Add user message
    const userMessage = { sender: 'user', text: text.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    
    const updatedHistory = [...chatHistories[selectedBot], userMessage];
    setChatHistories(prev => ({
      ...prev,
      [selectedBot]: updatedHistory
    }));

    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const otherDept = detectDepartment(text, selectedBot);
      let transferInfo = null;
      let botResponseText = "";

      const apiMessages = updatedHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await fetch(`${API_URL}/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot: selectedBot,
          text: text,
          messages: apiMessages
        })
      });

      if (response.ok) {
        const data = await response.json();
        botResponseText = data.reply;
      } else {
        botResponseText = botConfigs[selectedBot].getResponse(text);
      }

      if (otherDept) {
        botResponseText = `${botResponseText}\n\n*Note:* This sounds like a question for the **${otherDept.role}** department.`;
        transferInfo = {
          targetBot: otherDept.bot,
          targetName: otherDept.name,
          userQuery: text
        };
      }

      const botMessage = { 
        sender: 'bot', 
        text: botResponseText, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        transferInfo: transferInfo
      };
      
      setChatHistories(prev => ({
        ...prev,
        [selectedBot]: [...prev[selectedBot], botMessage]
      }));
    } catch (error) {
      console.error("Error calling NVIDIA API, using fallback:", error);
      const otherDept = detectDepartment(text, selectedBot);
      let transferInfo = null;
      let botResponseText = botConfigs[selectedBot].getResponse(text);

      if (otherDept) {
        botResponseText = `${botResponseText}\n\n*Note:* This sounds like a question for the **${otherDept.role}** department.`;
        transferInfo = {
          targetBot: otherDept.bot,
          targetName: otherDept.name,
          userQuery: text
        };
      }

      const botMessage = { 
        sender: 'bot', 
        text: botResponseText, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        transferInfo: transferInfo
      };
      
      setChatHistories(prev => ({
        ...prev,
        [selectedBot]: [...prev[selectedBot], botMessage]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes floatAnim { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulseAnim { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes swayAnim { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        @keyframes bounceAnim { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulseDot { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
      `}</style>
      {isLoading && <Preloader onFinish={() => setIsLoading(false)} />}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: isSidebarOpen ? '320px' : '20px', 
        zIndex: 9999,
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {isOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--bg-dark)',
            color: 'var(--text-main)',
            zIndex: 99998,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-main)'
          }}>
            {/* HEADER */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', height: '80px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {selectedBot ? (
                  <button 
                    onClick={() => setSelectedBot(null)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  >
                    ← Back to Friends
                  </button>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>
                    <path d="M 50 10 C 22.4 10 0 30 0 55 C 0 69.5 7.8 82.5 20 90 L 15 100 L 32 93.5 C 38 95.3 44 96 50 96 C 77.6 96 100 76 100 55 C 100 30 77.6 10 50 10 Z" fill="var(--accent-green)" />
                    <text x="50" y="66" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="30" fill="#111" textAnchor="middle" letterSpacing="1">DARK</text>
                  </svg>
                )}
                
                {selectedBot && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-green)' }}>
                      <video src={botConfigs[selectedBot].video} autoPlay muted playsInline loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {botConfigs[selectedBot].name}
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2ecc71', display: 'inline-block' }} />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{botConfigs[selectedBot].role}</div>
                    </div>
                  </div>
                )}
                {!selectedBot && <span style={{ fontWeight: '600', fontSize: '20px', color: 'var(--text-main)' }}>AI Assistant Selection</span>}
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '36px', lineHeight: '1' }}>&times;</button>
            </div>

            {/* CHAT WINDOW OR GRID SELECTION */}
            {selectedBot ? (
              /* ACTIVE CHAT INTERFACE */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)', height: 'calc(100vh - 80px)' }}>
                {/* MESSAGES AREA */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {!showPrevious[selectedBot] && sessionStartLengths[selectedBot] > botConfigs[selectedBot].initialMessages.length && (
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <button 
                        onClick={() => setShowPrevious({ ...showPrevious, [selectedBot]: true })}
                        style={{ 
                          padding: '8px 16px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', 
                          border: '1px solid var(--border-color)', borderRadius: '20px', cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Load Previous Chat
                      </button>
                    </div>
                  )}
                  {(showPrevious[selectedBot] 
                    ? chatHistories[selectedBot] 
                    : [ ...botConfigs[selectedBot].initialMessages, ...(chatHistories[selectedBot] || []).slice(sessionStartLengths[selectedBot]) ]
                  ).map((msg, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '12px', maxWidth: '70%', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                        {msg.sender === 'bot' && (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid var(--accent-green)' }}>
                            <video src={botConfigs[selectedBot].video} autoPlay muted playsInline loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div>
                          <div style={{
                            padding: '14px 18px',
                            borderRadius: msg.sender === 'user' ? '18px 18px 0px 18px' : '18px 18px 18px 0px',
                            backgroundColor: msg.sender === 'user' ? 'var(--accent-green)' : 'var(--bg-card)',
                            color: msg.sender === 'user' ? '#111' : 'var(--text-main)',
                            fontWeight: msg.sender === 'user' ? '500' : 'normal',
                            fontSize: '15px',
                            lineHeight: '1.5',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            whiteSpace: 'pre-line'
                          }}>
                            {msg.sender === 'bot' ? (
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            ) : (
                              msg.text
                            )}
                          </div>
                          {msg.transferInfo && (
                            <button
                              onClick={() => handleTransfer(msg.transferInfo.targetBot, msg.transferInfo.userQuery)}
                              style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                                border: '1px solid #ffd700',
                                color: '#ffd700',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'block',
                                transition: 'all 0.2s ease',
                                outline: 'none'
                              }}
                            >
                              🔄 Transfer to {msg.transferInfo.targetName}
                            </button>
                          )}
                          {msg.timestamp && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                              {msg.timestamp}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '12px', maxWidth: '70%' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid var(--accent-green)' }}>
                          <video src={botConfigs[selectedBot].video} autoPlay muted playsInline loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{
                          padding: '14px 20px',
                          borderRadius: '18px 18px 18px 0px',
                          backgroundColor: 'var(--bg-card)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', animation: 'pulseDot 1.2s infinite 0s' }} />
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', animation: 'pulseDot 1.2s infinite 0.2s' }} />
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', animation: 'pulseDot 1.2s infinite 0.4s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* SUGGESTION PILLS & INPUT BOX */}
                <div style={{ padding: '20px 40px 30px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                  {/* Suggestions */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {botConfigs[selectedBot].suggestions.map((sug, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '20px',
                          padding: '8px 16px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input 
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message ${botConfigs[selectedBot].name}...`}
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--bg-dark)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '14px 20px',
                        color: 'var(--text-main)',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    <button 
                      type="submit"
                      style={{
                        backgroundColor: 'var(--accent-green)',
                        color: '#111',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '14px 28px',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.4)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* FRIEND SELECTION GRID */
              <div style={{ flex: 1, padding: '60px 40px', overflowY: 'auto', backgroundColor: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '80px', textAlign: 'center' }}>
                  Choose your friend according to the task you intend to do today
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', width: '100%', maxWidth: '1000px' }}>
                  
                  {/* Option 1 - Daksh */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={() => setSelectedBot('daksh')}>
                    <h3 style={{ margin: 0, textAlign: 'center', fontFamily: '"Norwester", sans-serif', color: 'var(--text-main)' }}>
                      <span style={{ fontSize: '48px', fontWeight: 'bold' }}>D</span><span style={{ fontSize: '24px' }}>aksh</span>
                    </h3>
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                         onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                         onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <video src="/image/daksh.mp4" autoPlay muted playsInline loop ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                    </div>
                  </div>
                  
                  {/* Option 2 - Ayush */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={() => setSelectedBot('ayush')}>
                    <h3 style={{ margin: 0, textAlign: 'center', fontFamily: '"Norwester", sans-serif', color: 'var(--text-main)' }}>
                      <span style={{ fontSize: '48px', fontWeight: 'bold' }}>A</span><span style={{ fontSize: '24px' }}>yush</span>
                    </h3>
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                         onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                         onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <video src="/image/Ayush%20Badola%20Video.mp4" autoPlay muted playsInline loop ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                    </div>
                  </div>
                  
                  {/* Option 3 - Rachit */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={() => setSelectedBot('rachit')}>
                    <h3 style={{ margin: 0, textAlign: 'center', fontFamily: '"Norwester", sans-serif', color: 'var(--text-main)' }}>
                      <span style={{ fontSize: '48px', fontWeight: 'bold' }}>R</span><span style={{ fontSize: '24px' }}>achit</span>
                    </h3>
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                         onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                         onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <video src="/image/rachit.mp4" autoPlay muted playsInline loop ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                    </div>
                  </div>
                  
                  {/* Option 4 - Kartik */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={() => setSelectedBot('kartik')}>
                    <h3 style={{ margin: 0, textAlign: 'center', fontFamily: '"Norwester", sans-serif', color: 'var(--text-main)' }}>
                      <span style={{ fontSize: '48px', fontWeight: 'bold' }}>K</span><span style={{ fontSize: '24px' }}>artik</span>
                    </h3>
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                         onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                         onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <video src="/image/kartik.mp4" autoPlay muted playsInline loop ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <button 
          onClick={handleToggle}
          style={{
            width: '100px',
            height: '100px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            float: 'right',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))',
            animation: 'floatAnim 3s ease-in-out infinite'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = 'drop-shadow(0 12px 30px var(--accent-green))';
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))';
            e.currentTarget.style.animationPlayState = 'running';
          }}
          title="Chat with AI"
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M 50 10 C 22.4 10 0 30 0 55 C 0 69.5 7.8 82.5 20 90 L 15 100 L 32 93.5 C 38 95.3 44 96 50 96 C 77.6 96 100 76 100 55 C 100 30 77.6 10 50 10 Z" fill="var(--accent-green)" />
            <text x="50" y="66" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="30" fill="#111" textAnchor="middle" letterSpacing="1">DARK</text>
          </svg>
        </button>
      </div>
    </>
  );
};

export default Chatbot;
