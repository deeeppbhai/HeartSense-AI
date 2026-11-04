import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, X, Send, Bot, User, Sparkles, Heart,
  ShieldAlert, HelpCircle, ArrowRight
} from 'lucide-react';
import api from '../services/api';

const KNOWLEDGE_BASE = [
  {
    triggers: ['risk score', 'risk level', 'percentage', 'probability', 'what does risk mean'],
    answer: "Cardiovascular risk in HeartSense AI is categorized into 4 tiers:\n• Low (<25%): Baseline cardiac risk within normal population parameters.\n• Moderate (25-50%): Mildly elevated risk markers. Lifestyle modifications and routine checkups recommended.\n• High (50-75%): Significant probability of coronary artery disease. Formal cardiology evaluation advised.\n• Severe (>75%): Critical ischemic indicators. Urgent clinical diagnostic follow-up recommended.\n\n*Note: Probability is derived from statistical algorithms, not a biological diagnosis.*"
  },
  {
    triggers: ['blood pressure', 'trestbps', 'hypertension', 'systolic', 'bp'],
    answer: "Clinical Blood Pressure Guidelines (AHA/ACC Standards):\n• Normal: < 120 / < 80 mmHg\n• Elevated: 120-129 / < 80 mmHg\n• Stage 1 HTN: 130-139 / 80-89 mmHg\n• Stage 2 HTN: >= 140 / >= 90 mmHg\n\nHigh resting blood pressure increases systemic vascular resistance and workload on the left ventricle."
  },
  {
    triggers: ['cholesterol', 'chol', 'lipid', 'ldl', 'hdl'],
    answer: "Serum Cholesterol (chol) Reference Targets:\n• Desirable: < 200 mg/dL\n• Borderline High: 200 - 239 mg/dL\n• High: >= 240 mg/dL\n\nElevated LDL and total cholesterol contribute to atheromatous plaque formation in coronary arteries."
  },
  {
    triggers: ['shap', 'explainable ai', 'xai', 'lime', 'feature importance'],
    answer: "SHAP (SHapley Additive exPlanations) is a game-theoretic approach that explains individual predictions:\n• Positive values (Red) push the prediction toward higher cardiac risk.\n• Negative values (Green) push toward lower cardiac risk.\n\n*Limitation:* SHAP attributions reflect statistical patterns within the trained model dataset and do not prove biological medical causation."
  },
  {
    triggers: ['st depression', 'oldpeak', 'ecg', 'electrocardiogram', 'slope'],
    answer: "ST Depression (oldpeak) measures the deviation of the ST segment below the baseline on an exercise stress ECG:\n• Normal: < 1.0 mm\n• Significant Ischemia: >= 1.5 mm\n\nST depression during physical exertion is a classic clinical hallmark of sub-endocardial myocardial ischemia."
  },
  {
    triggers: ['models', 'algorithm', 'random forest', 'xgboost', 'svm', 'logistic regression'],
    answer: "HeartSense AI trains and compares 4 machine learning pipelines:\n1. Random Forest (Ensemble bagging trees)\n2. XGBoost (Gradient boosting trees)\n3. Logistic Regression (Linear probabilistic classifier)\n4. Support Vector Machine (RBF Kernel)\n\nAdministrators can evaluate metrics (ROC-AUC, Sensitivity, Specificity, F1) and select the active inference engine in the Admin portal."
  },
  {
    triggers: ['pdf', 'report', 'download', 'print'],
    answer: "You can download an official clinical decision support PDF report by navigating to your assessment result and clicking 'Download Clinical PDF'. The report includes verified patient demographics, biomarkers table, SHAP breakdown, and physician recommendations."
  },
  {
    triggers: ['doctor', 'license', 'physician', 'approval'],
    answer: "Doctors register with their medical license number and clinical specialization. For regulatory governance, hospital administrators can inspect and verify physician credentials in the Admin User Management dashboard."
  }
];

const QUICK_PROMPTS = [
  "What does my Risk Score mean?",
  "What are normal BP & cholesterol ranges?",
  "What do SHAP explainability values mean?",
  "What are the 4 AI algorithms used?",
  "How do I download my PDF clinical report?"
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am CardioGuide, HeartSense AI's educational assistant. I can explain cardiac biomarkers, SHAP scores, risk tiers, and application features.\n\n*Educational notice: I do not provide medical diagnoses or prescribe medications.*",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const findBestAnswer = (query) => {
    const q = query.toLowerCase();
    for (const item of KNOWLEDGE_BASE) {
      if (item.triggers.some(t => q.includes(t))) {
        return item.answer;
      }
    }
    return "Thank you for asking. HeartSense AI provides clinical decision support estimates for cardiovascular risk stratification. For questions regarding your personal health symptoms or specific treatments, please consult your attending cardiologist or primary healthcare provider directly.";
  };

  const handleSend = (userText) => {
    const text = userText || input;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = findBestAnswer(text);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      // Persist to Table 7 (AIChat) via backend
      api.post('/clinical/chat/', {
        question: text.trim(),
        ai_response: botResponse
      }).catch(() => {
        // Silently handle if unauthenticated or offline
      });
    }, 600);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-brand-700 to-cyan-600 text-white font-bold text-xs shadow-elevated hover:scale-105 transition-all group"
          title="Open CardioGuide Educational Assistant"
        >
          <div className="relative">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"></span>
          </div>
          <span className="hidden sm:inline">Ask CardioGuide</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[550px] bg-white rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-brand-800 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  CardioGuide Assistant
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                    FAQ
                  </span>
                </h3>
                <span className="text-[10px] text-slate-300">Educational Heart Decision Support</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="bg-amber-50 px-3 py-1.5 border-b border-amber-200/70 text-[10px] text-amber-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Provides educational guidance only. Not a substitute for medical diagnosis.</span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                  <div className={`text-[9px] mt-1 text-right ${m.sender === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                    {m.time}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    U
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <span>CardioGuide is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="p-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium whitespace-nowrap transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about heart risk, BP, SHAP..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
