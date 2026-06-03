"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, FileText, Cookie, Check, Sparkles } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "privacy" | "cookies";
}

export default function LegalModal({ isOpen, onClose, initialTab = "terms" }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "cookies">(initialTab);
  
  // Cookie states saved in localStorage
  const [cookiesAllowed, setCookiesAllowed] = useState({
    performance: true,
    aesthetic: true,
  });
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Load saved preferences if available
      const saved = localStorage.getItem("luckify_cookie_consent");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCookiesAllowed({
            performance: parsed.performance ?? true,
            aesthetic: parsed.aesthetic ?? true,
          });
        } catch (e) {
          console.warn("Failed parsing cookie consent", e);
        }
      }
    }
  }, [isOpen, initialTab]);

  const handleSaveCookies = () => {
    const consent = {
      essential: true,
      performance: cookiesAllowed.performance,
      aesthetic: cookiesAllowed.aesthetic,
    };
    localStorage.setItem("luckify_cookie_consent", JSON.stringify(consent));
    
    // Set visual confirmation state
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const toggleCookie = (type: "performance" | "aesthetic") => {
    setCookiesAllowed((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-deep-violet/40 dark:bg-black/60 backdrop-blur-md pointer-events-auto"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full max-w-2xl bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-5 sm:p-7 shadow-2xl z-50 flex flex-col pointer-events-auto overflow-hidden text-deep-violet dark:text-cream-soft"
          >
            {/* Ambient gold glow in top right */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary-gold/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between pb-4 border-b border-deep-violet/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-pulse">🔮</span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-fredoka leading-none text-primary-gold">
                    Legal & Aura Settings
                  </h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
                    Play responsibly, protect your vibe state.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-deep-violet/5 dark:hover:bg-cream-soft/5 text-deep-violet/40 dark:text-cream-soft/40 hover:text-deep-violet dark:hover:text-cream-soft transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigators */}
            <div className="flex items-center gap-1.5 sm:gap-2 my-4 bg-deep-violet/5 dark:bg-white/5 p-1 rounded-2xl border border-deep-violet/10 dark:border-white/10">
              <button
                onClick={() => setActiveTab("terms")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 sm:px-3 rounded-xl text-xs font-bold font-fredoka transition-all cursor-pointer ${
                  activeTab === "terms"
                    ? "bg-white dark:bg-card text-primary-gold shadow-md scale-102 border-2 border-primary-gold/20"
                    : "text-deep-violet/60 dark:text-cream-soft/60 hover:text-deep-violet dark:hover:text-cream-soft hover:bg-white/40 dark:hover:bg-white/5"
                }`}
              >
                <FileText className="w-3.5 h-3.5 hidden xs:inline" />
                Terms
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 sm:px-3 rounded-xl text-xs font-bold font-fredoka transition-all cursor-pointer ${
                  activeTab === "privacy"
                    ? "bg-white dark:bg-card text-primary-gold shadow-md scale-102 border-2 border-primary-gold/20"
                    : "text-deep-violet/60 dark:text-cream-soft/60 hover:text-deep-violet dark:hover:text-cream-soft hover:bg-white/40 dark:hover:bg-white/5"
                }`}
              >
                <Shield className="w-3.5 h-3.5 hidden xs:inline" />
                Privacy
              </button>
              <button
                onClick={() => setActiveTab("cookies")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 sm:px-3 rounded-xl text-xs font-bold font-fredoka transition-all cursor-pointer ${
                  activeTab === "cookies"
                    ? "bg-white dark:bg-card text-primary-gold shadow-md scale-102 border-2 border-primary-gold/20"
                    : "text-deep-violet/60 dark:text-cream-soft/60 hover:text-deep-violet dark:hover:text-cream-soft hover:bg-white/40 dark:hover:bg-white/5"
                }`}
              >
                <Cookie className="w-3.5 h-3.5 hidden xs:inline" />
                Cookies
              </button>
            </div>

            {/* Scrollable Document Pane */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] min-h-[30vh] pr-2.5 text-xs sm:text-sm font-semibold text-deep-violet/80 dark:text-cream-soft/80 leading-relaxed font-sans scroll-smooth">
              <AnimatePresence mode="wait">
                {activeTab === "terms" && (
                  <motion.div
                    key="terms"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="bg-primary-gold/5 dark:bg-primary-gold/3 p-4 border border-primary-gold/20 rounded-2xl mb-4">
                      <p className="font-extrabold text-primary-gold flex items-center gap-1.5 text-sm font-fredoka mb-1">
                        🌟 Welcome to the Garden of Fortunes!
                      </p>
                      Please review these playful guidelines. By accessing Lucky Vibes, you align your karma and agree to ride these digital frequencies with joy.
                    </div>

                    <h4 className="font-black font-fredoka text-sm sm:text-base text-deep-violet dark:text-cream-soft flex items-center gap-2 pt-2 border-t border-deep-violet/5 dark:border-white/5">
                      <span className="text-base sm:text-lg">🌳</span> 1. Game Mechanics & Spirit
                    </h4>
                    <p>
                      All games on Lucky Vibes (including Shaking Tree, Fortune Wheel, Flip a Coin, and Number Picker) are designed strictly for entertainment, visualization, and cosmic amusement.
                    </p>
                    <p>
                      No real currency, digital assets, or real-world stakes are wagered or generated here. Your winnings are magical numbers, points, and digital tokens residing solely in your heart and your local browser storage.
                    </p>

                    <h4 className="font-black font-fredoka text-sm sm:text-base text-deep-violet dark:text-cream-soft flex items-center gap-2 pt-2 border-t border-deep-violet/5 dark:border-white/5">
                      <span className="text-base sm:text-lg">✨</span> 2. Local Aura & Storage
                    </h4>
                    <p>
                      Your stats, high scores, play counts, and win streaks are saved using standard browser Web Storage API (`localStorage`). 
                    </p>
                    <p>
                      These values are subject to clearing if you reset your browser cache or perform a site data wipe. We do not maintain offsite backups of your personal fortune milestones.
                    </p>

                    <h4 className="font-black font-fredoka text-sm sm:text-base text-deep-violet dark:text-cream-soft flex items-center gap-2 pt-2 border-t border-deep-violet/5 dark:border-white/5">
                      <span className="text-base sm:text-lg">⚖️</span> 3. Cosmic Disclaimers
                    </h4>
                    <p>
                      While rolling triple-sixes or pulling a perfect jackpot unicorn feels sensational, our algorithms are based on pseudo-random generators. They do not predict real-world outcomes, stock market movements, real lottery alignments, or actual physical weather events. 
                    </p>
                    <p>
                      Enjoy the thrills as standard whimsical animations. Play thoughtfully and keep your vibes positively grounded.
                    </p>
                  </motion.div>
                )}

                {activeTab === "privacy" && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="bg-accent-teal/5 dark:bg-accent-teal/3 p-4 border border-accent-teal/20 rounded-2xl mb-4 text-xs font-semibold">
                      <p className="font-extrabold text-accent-teal flex items-center gap-1.5 text-sm font-fredoka mb-1">
                        🔒 Privacy First — Your Aura is Protected
                      </p>
                      We believe privacy is the ultimate luck enhancer. Here is how we safeguard your digital soul:
                    </div>

                    <h4 className="font-black font-fredoka text-sm sm:text-base text-deep-violet dark:text-cream-soft flex items-center gap-2 pt-2 border-t border-deep-violet/5 dark:border-white/5">
                      <span className="text-base sm:text-lg">🛡️</span> 1. Zero Database Collection
                    </h4>
                    <p>
                      Lucky Vibes runs almost entirely client-side. We do not require account registration, passwords, email log-ins, phone numbers, or credit card inputs. 
                    </p>
                    <p>
                      Your personal data does not land on our servers because we don't have user database trackers. Everything is stored cleanly on your own device.
                    </p>

                    <h4 className="font-black font-fredoka text-sm sm:text-base text-deep-violet dark:text-cream-soft flex items-center gap-2 pt-2 border-t border-deep-violet/5 dark:border-white/5">
                      <span className="text-base sm:text-lg">💾</span> 2. Local Device Sandbox
                    </h4>
                    <p>
                      We read and write your statistics and lucky streaks directly to your browser's safe local sandboxed database (`localStorage`). This data never leaves your device and is not sold, distributed, or aggregated for target marketing campaigns.
                    </p>

                    <h4 className="font-black font-fredoka text-sm sm:text-base text-deep-violet dark:text-cream-soft flex items-center gap-2 pt-2 border-t border-deep-violet/5 dark:border-white/5">
                      <span className="text-base sm:text-lg">🌐</span> 3. Third-Party Integrations
                    </h4>
                    <p>
                      We use static assets and standard font integrations from reputable content networks (like Google Fonts). No malicious tracking pixels, fingerprinting technologies, or advertising pixels exist inside our code.
                    </p>
                  </motion.div>
                )}

                {activeTab === "cookies" && (
                  <motion.div
                    key="cookies"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <p className="text-xs sm:text-sm text-deep-violet/70 dark:text-cream-soft/70">
                      Customize how cookies and local storage state shape your lucky experiences. Adjust toggles to filter active vibe enhancements:
                    </p>

                    {/* Cookie Preference Rows */}
                    <div className="space-y-3.5 pt-2">
                      {/* Essential Cookie row */}
                      <div className="flex items-start justify-between gap-4 p-3 bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 rounded-2xl">
                        <div className="flex-1">
                          <h5 className="font-extrabold font-fredoka text-sm text-deep-violet dark:text-cream-soft flex items-center gap-1.5">
                            Essential Preferences
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-gold/20 text-primary-gold border border-primary-gold/10 font-bold uppercase tracking-wider">Required</span>
                          </h5>
                          <p className="text-[11px] sm:text-xs text-deep-violet/60 dark:text-cream-soft/60 mt-1">
                            Saves basic elements like your light/dark mode preference, core game state variables, and saves cookie toggle states locally.
                          </p>
                        </div>
                        <div className="relative flex items-center justify-center h-6 w-11 mt-1">
                          <div className="w-11 h-6 bg-primary-gold rounded-full transition-colors opacity-70" />
                          <div className="absolute left-6 w-4 h-4 bg-white dark:bg-card rounded-full shadow-md" />
                        </div>
                      </div>

                      {/* Performance Cookie row */}
                      <div className="flex items-start justify-between gap-4 p-3 bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 rounded-2xl hover:border-primary-gold/30 transition-colors">
                        <div className="flex-1">
                          <h5 className="font-extrabold font-fredoka text-sm text-deep-violet dark:text-cream-soft flex items-center gap-1.5">
                            Performance & Insights
                          </h5>
                          <p className="text-[11px] sm:text-xs text-deep-violet/60 dark:text-cream-soft/60 mt-1">
                            Keeps a tally of total plays and games chosen to help optimize client load speeds.
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCookie("performance")}
                          className="relative flex items-center justify-center h-6 w-11 mt-1 transition-transform active:scale-95 cursor-pointer bg-transparent border-none"
                          aria-label="Toggle Performance cookies"
                        >
                          <div className={`w-11 h-6 rounded-full transition-colors ${cookiesAllowed.performance ? "bg-accent-teal" : "bg-deep-violet/20 dark:bg-white/10"}`} />
                          <div className={`absolute w-4 h-4 bg-white dark:bg-card rounded-full shadow-md transition-all ${cookiesAllowed.performance ? "left-6" : "left-1"}`} />
                        </button>
                      </div>

                      {/* Aesthetic Cookie row */}
                      <div className="flex items-start justify-between gap-4 p-3 bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 rounded-2xl hover:border-primary-gold/30 transition-colors">
                        <div className="flex-1">
                          <h5 className="font-extrabold font-fredoka text-sm text-deep-violet dark:text-cream-soft flex items-center gap-1.5">
                            Aesthetic Customization
                          </h5>
                          <p className="text-[11px] sm:text-xs text-deep-violet/60 dark:text-cream-soft/60 mt-1">
                            Unlocks advanced interactive particle layouts and extra confetti sparkles when hitting jackpot states, creating premium visual feedbacks.
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCookie("aesthetic")}
                          className="relative flex items-center justify-center h-6 w-11 mt-1 transition-transform active:scale-95 cursor-pointer bg-transparent border-none"
                          aria-label="Toggle Aesthetic cookies"
                        >
                          <div className={`w-11 h-6 rounded-full transition-colors ${cookiesAllowed.aesthetic ? "bg-accent-teal" : "bg-deep-violet/20 dark:bg-white/10"}`} />
                          <div className={`absolute w-4 h-4 bg-white dark:bg-card rounded-full shadow-md transition-all ${cookiesAllowed.aesthetic ? "left-6" : "left-1"}`} />
                        </button>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-2">
                      <button
                        onClick={handleSaveCookies}
                        disabled={saveSuccess}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold font-fredoka text-sm shadow-md transition-all active:scale-98 cursor-pointer ${
                          saveSuccess 
                            ? "bg-accent-teal text-white" 
                            : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet"
                        }`}
                      >
                        {saveSuccess ? (
                          <>
                            <Check className="w-4 h-4 animate-bounce" />
                            Preferences Saved!
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Save Aura Settings
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
