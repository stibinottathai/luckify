"use client";

import { useEffect, useState } from "react";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Coins, 
  Compass, 
  Heart, 
  Briefcase, 
  RefreshCw, 
  TrendingUp, 
  HelpCircle,
  ArrowRight,
  Lock
} from "lucide-react";
import { playWinChime, playCoinDeducted } from "@/lib/audio";
import confetti from "canvas-confetti";
import Link from "next/link";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface ZodiacInfo {
  id: string;
  name: string;
  emoji: string;
  symbol: string;
  dateRange: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  description: string;
}

const ZODIAC_SIGNS: ZodiacInfo[] = [
  { id: "aries", name: "Aries", emoji: "🐏", symbol: "♈", dateRange: "Mar 21 - Apr 19", element: "Fire", description: "Bold, passionate, and pioneering leader." },
  { id: "taurus", name: "Taurus", emoji: "🐂", symbol: "♉", dateRange: "Apr 20 - May 20", element: "Earth", description: "Reliable, patient, and lover of stability." },
  { id: "gemini", name: "Gemini", emoji: "👥", symbol: "♊", dateRange: "May 21 - Jun 20", element: "Air", description: "Expressive, curious, and quick-witted." },
  { id: "cancer", name: "Cancer", emoji: "🦀", symbol: "♋", dateRange: "Jun 21 - Jul 22", element: "Water", description: "Intuitive, protective, and sentimental." },
  { id: "leo", name: "Leo", emoji: "🦁", symbol: "♌", dateRange: "Jul 23 - Aug 22", element: "Fire", description: "Dramatic, outgoing, and self-assured." },
  { id: "virgo", name: "Virgo", emoji: "🌾", symbol: "♍", dateRange: "Aug 23 - Sep 22", element: "Earth", description: "Loyal, analytical, and hardworking." },
  { id: "libra", name: "Libra", emoji: "⚖️", symbol: "♎", dateRange: "Sep 23 - Oct 22", element: "Air", description: "Diplomatic, fair-minded, and social." },
  { id: "scorpio", name: "Scorpio", emoji: "🦂", symbol: "♏", dateRange: "Oct 23 - Nov 21", element: "Water", description: "Resourceful, brave, and passionate." },
  { id: "sagittarius", name: "Sagittarius", emoji: "🏹", symbol: "♐", dateRange: "Nov 22 - Dec 21", element: "Fire", description: "Generous, idealistic, and adventurous." },
  { id: "capricorn", name: "Capricorn", emoji: "🐐", symbol: "♑", dateRange: "Dec 22 - Jan 19", element: "Earth", description: "Responsible, disciplined, and self-controlled." },
  { id: "aquarius", name: "Aquarius", emoji: "🏺", symbol: "♒", dateRange: "Jan 20 - Feb 18", element: "Air", description: "Progressive, original, and independent." },
  { id: "pisces", name: "Pisces", emoji: "🐟", symbol: "♓", dateRange: "Feb 19 - Mar 20", element: "Water", description: "Compassionate, artistic, and wise." }
];

const COSMIC_INTROS = [
  "The celestial spheres are perfectly aligned today.",
  "A powerful planetary shift triggers major clarity.",
  "Mystical cosmic vibrations envelop your star sign.",
  "An auspicious lunar phase highlights your daily path.",
  "The universe is sending subtle signals in your direction.",
  "A harmonious energy transition dominates your alignment today."
];

const COSMIC_FOCUSES = [
  "A sudden wave of creative inspiration will help you tackle old challenges,",
  "A peaceful moment of quiet introspection will clear your thoughts,",
  "An energetic social connection will bring unexpected cosmic guidance,",
  "A strong current of financial confidence urges you to trust your luck,",
  "A cosmic window of pure clarity opens, amplifying your communication,",
  "A minor cosmic detour shifts your daily plans into a luckier direction,",
  "A stellar alignment in your ambition sector highlights career dedication,",
  "An adventurous spark encourages you to step out of your comfort zone,"
];

const COSMIC_OUTCOMES = [
  "leading you straight to a hidden prize or breakthrough.",
  "so keep your mind open to positive surprises and guidance.",
  "and a minor calculated risk today will pay off beautifully.",
  "reminding you that patience holds the key to the ultimate jackpot.",
  "winning you admiration and opening up a brand-new doorway.",
  "revealing that small daily steps lead to massive long-term successes.",
  "and your positive vibrations will attract abundance to your pocket.",
  "which will reveal a lucky pathway you didn't even notice before."
];

const ZODIAC_COSMIC_ADVICE: Record<string, string> = {
  aries: "As a Fire sign, your initiative is extremely high today. Action leads to victory—spin the wheel first!",
  taurus: "Your Earth element keeps you grounded. Take a slow, calculated choice today—let the Pendulum decide your next move.",
  gemini: "Air energies swirl around your communications. Ask a deep cosmic question today; your mind is ready to receive answers.",
  cancer: "Your Water element heightens your intuition. Trust your gut completely today—especially when picking mystery boxes.",
  leo: "Fire elements boost your charisma and star power. Choose a high-reward game today and chase the jackpot with confidence!",
  virgo: "Earth energies favor detail and analysis. Use your precision in prediction games today—predict the coin flips carefully.",
  libra: "Air elements bring harmony and balance. It's a perfect day to balance your luck score and test your vibes score.",
  scorpio: "Water energies spark passionate insights. Trust a mystery choice today; the hidden depths hold great coin rewards.",
  sagittarius: "Fire elements boost your adventurous spirit. Play a game you haven't played in a while; luck favors the bold traveler.",
  capricorn: "Earth elements bring stability and endurance. Your steady persistence will win the day. Accumulate points step-by-step.",
  aquarius: "Air elements favor originality and progress. Break your daily pattern and try a random luck test with a fresh mindset.",
  pisces: "Water elements bring high spiritual connection. Divination tools like the Pendulum are calling your name today."
};

const GAME_RECOMMENDATIONS = [
  { name: "Fortune Wheel", href: "/wheel", emoji: "🎡" },
  { name: "Lucky Gift Hunt", href: "/gift-hunt", emoji: "🎁" },
  { name: "Pendulum Divination", href: "/pendulum", emoji: "🔮" },
  { name: "Lucky Envelope", href: "/lucky-envelope", emoji: "✉️" },
  { name: "Magic 8-Ball", href: "/magic-8-ball", emoji: "🎱" },
  { name: "Message in a Bottle", href: "/message-in-bottle", emoji: "🍾" }
];

export default function AstroVibesClient() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Firebase Google Sign-in failed:", error);
    }
  };

  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);
  
  const setZodiacSign = useLuckStore((s) => s.setZodiacSign);
  const claimAstroBonus = useLuckStore((s) => s.claimAstroBonus);
  const spendCoins = useLuckStore((s) => s.spendCoins);

  const [hoveredSign, setHoveredSign] = useState<string | null>(null);
  const [hasNavigatedToDashboard, setHasNavigatedToDashboard] = useState(false);
  const [horoscopeData, setHoroscopeData] = useState<{
    forecast: string;
    luckyScore: number;
    loveScore: number;
    careerScore: number;
    recommendedGame: string;
    cosmicAdvice: string;
    isFallback: boolean;
  } | null>(null);
  const [isFetchingHoroscope, setIsFetchingHoroscope] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedSignId = currentProfile?.zodiacSign || "";
  const currentZodiac = ZODIAC_SIGNS.find((z) => z.id === selectedSignId);

  // Deterministic ratings generation (local fallbacks)
  const getRating = (zodiacId: string, metric: string) => {
    const str = `${zodiacId}-${metric}-${todayStr}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 45 + Math.abs(hash % 56); // Range 45 to 100
  };

  const getOracleReading = (zodiacId: string) => {
    const str = `${zodiacId}-${todayStr}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const introIdx = Math.abs((hash * 13) % COSMIC_INTROS.length);
    const focusIdx = Math.abs((hash * 29) % COSMIC_FOCUSES.length);
    const outcomeIdx = Math.abs((hash * 47) % COSMIC_OUTCOMES.length);

    const introText = COSMIC_INTROS[introIdx];
    const focusText = COSMIC_FOCUSES[focusIdx];
    const outcomeText = COSMIC_OUTCOMES[outcomeIdx];
    const adviceText = ZODIAC_COSMIC_ADVICE[zodiacId] || "";
    return `${introText} ${focusText} ${outcomeText} ${adviceText}`;
  };

  const getRecommendedGame = (zodiacId: string) => {
    const str = `${zodiacId}-${todayStr}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash % GAME_RECOMMENDATIONS.length);
    return GAME_RECOMMENDATIONS[idx];
  };

  useEffect(() => {
    if (!selectedSignId) {
      setHoroscopeData(null);
      return;
    }

    const cacheKey = `astro-vibe-v2-${selectedSignId}-${todayStr}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        setHoroscopeData(JSON.parse(cached));
        return;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    const fetchHoroscope = async () => {
      setIsFetchingHoroscope(true);
      try {
        const res = await fetch("/api/horoscope", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sign: selectedSignId, date: todayStr }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch horoscope");
        }

        const data = await res.json();
        setHoroscopeData(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        console.error("Failed to load Gemini horoscope, using local formula:", err);
        const localFallback = {
          forecast: getOracleReading(selectedSignId),
          luckyScore: getRating(selectedSignId, "luck"),
          loveScore: getRating(selectedSignId, "love"),
          careerScore: getRating(selectedSignId, "career"),
          recommendedGame: getRecommendedGame(selectedSignId).name,
          cosmicAdvice: ZODIAC_COSMIC_ADVICE[selectedSignId] || "Trust the cosmic vibes today.",
          isFallback: true,
        };
        setHoroscopeData(localFallback);
      } finally {
        setIsFetchingHoroscope(false);
      }
    };

    fetchHoroscope();
  }, [selectedSignId, todayStr]);

  const handleClaim = () => {
    if (!user || user.uid === "guest") return;
    
    // Play sound & Confetti
    playWinChime();
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#F5B700", "#FFD700", "#FFFFFF"] });
    
    claimAstroBonus(todayStr, 200);
  };

  const handleSelectSign = (signId: string) => {
    // If they already have this sign active in their profile, skip charging coins
    if (currentProfile?.zodiacSign === signId) {
      setHasNavigatedToDashboard(true);
      return;
    }

    const success = spendCoins(500);
    if (!success) {
      alert("💰 You need 500 coins to align your celestial vibes!");
      return;
    }
    playCoinDeducted();
    setZodiacSign(signId);
    setHasNavigatedToDashboard(true);
  };

  const handleResetSign = () => {
    setZodiacSign("");
    setHasNavigatedToDashboard(false);
  };

  const alreadyClaimed = currentProfile?.lastAstroClaimDate === todayStr;

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto h-[450px] bg-white/70 dark:bg-[#1B103E]/70 border border-white/20 dark:border-white/5 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-soft-cream/30 font-fredoka font-black">
        <span>Aligning daily horoscope signals... 🌌</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto select-none font-fredoka">
      <AnimatePresence mode="wait">
        {!hasNavigatedToDashboard || !selectedSignId ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border-2 border-deep-violet/10 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-xl flex flex-col items-center gap-6"
          >
            <div className="text-center space-y-2 max-w-md">
              <Compass className="w-10 h-10 text-primary-gold mx-auto animate-spin" style={{ animationDuration: "10s" }} />
              <h2 className="text-2xl font-black text-deep-violet dark:text-soft-cream uppercase tracking-wider">
                Select Your Zodiac Sign
              </h2>
              <p className="text-xs font-semibold text-deep-violet/60 dark:text-soft-cream/60">
                To align your celestial energy, pick your horoscope sign. Each alignment costs <span className="text-primary-gold font-bold">500 🪙</span>. This locks in your daily forecast and unlocks a +200 coin alignment reward.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 w-full pt-4">
              {ZODIAC_SIGNS.map((sign) => {
                const isHovered = hoveredSign === sign.id;
                
                return (
                  <button
                    key={sign.id}
                    onClick={() => handleSelectSign(sign.id)}
                    onMouseEnter={() => setHoveredSign(sign.id)}
                    onMouseLeave={() => setHoveredSign(null)}
                    className="aspect-auto min-h-[115px] sm:aspect-[4/5] rounded-2xl bg-white/50 dark:bg-black/20 border border-deep-violet/10 dark:border-white/5 flex flex-col items-center justify-center p-2 sm:p-3 text-center transition-all duration-300 hover:border-primary-gold/75 hover:bg-white dark:hover:bg-[#120A2C] shadow-sm hover:shadow-md hover:-translate-y-1 relative overflow-hidden cursor-pointer"
                  >
                    {/* Hover Glow */}
                    {isHovered && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary-gold/5 via-transparent to-transparent pointer-events-none" />
                    )}
                    <span className="text-2xl sm:text-3xl filter drop-shadow-sm select-none pointer-events-none mb-1">
                      {sign.emoji}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-deep-violet dark:text-soft-cream select-none pointer-events-none break-words leading-tight max-w-full">
                      {sign.name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-deep-violet/40 dark:text-soft-cream/40 uppercase tracking-widest font-black mt-0.5 select-none pointer-events-none">
                      {sign.symbol}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-deep-violet/50 dark:text-soft-cream/50 mt-0.5 select-none pointer-events-none whitespace-nowrap">
                      {sign.dateRange.split(" - ").map(d => d.slice(0, 3)).join("-")}
                    </span>
                    <div className="mt-1 flex items-center gap-0.5 bg-primary-gold/10 px-1 py-0.5 rounded border border-primary-gold/25 text-primary-gold text-[8px] sm:text-[9px] font-black select-none pointer-events-none">
                      <span>500</span>
                      <span>🪙</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          currentZodiac && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-6"
            >
              {/* Profile Sign Header Card */}
              <div className="w-full bg-gradient-to-br from-[#2D1B69] to-[#1E1145] dark:from-[#1B0F40] dark:to-[#0D0725] border-4 border-primary-gold rounded-[2.5rem] p-6 shadow-xl text-white relative overflow-hidden flex flex-col sm:flex-row items-center gap-6 select-none">
                <div className="absolute inset-0 bg-radial from-violet-500/10 via-transparent to-transparent pointer-events-none animate-hue-sweep opacity-50" />
                
                <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-primary-gold flex items-center justify-center text-5xl relative z-10 shrink-0 select-none">
                  {currentZodiac.emoji}
                </div>

                <div className="space-y-1.5 text-center sm:text-left relative z-10 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-primary-gold leading-none">
                      {currentZodiac.name}
                    </h2>
                    <span className="text-lg bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 tracking-widest leading-none">
                      {currentZodiac.symbol}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                      currentZodiac.element === "Fire" ? "bg-red-500/20 border-red-500/30 text-red-300" :
                      currentZodiac.element === "Earth" ? "bg-amber-500/20 border-amber-500/30 text-amber-300" :
                      currentZodiac.element === "Air" ? "bg-sky-500/20 border-sky-500/30 text-sky-300" :
                      "bg-blue-500/20 border-blue-500/30 text-blue-300"
                    }`}>
                      {currentZodiac.element}
                    </span>
                  </div>
                  <p className="text-[10px] text-soft-cream/60 uppercase tracking-widest font-black">
                    Date range: {currentZodiac.dateRange}
                  </p>
                  <p className="text-xs text-soft-cream/80 max-w-md">
                    {currentZodiac.description}
                  </p>
                </div>

                <button
                  onClick={handleResetSign}
                  className="py-1.5 px-3 rounded-xl border border-white/20 bg-white/5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10 transition-all active:scale-95 shrink-0 z-10 self-center sm:self-auto cursor-pointer"
                >
                  Change Sign
                </button>
              </div>

              {/* Daily Horoscope Metrics Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Forecast Readings & Recommended Game */}
                <div className="bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border-2 border-deep-violet/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-lg space-y-4 flex flex-col justify-between min-h-[300px]">
                  <div className="space-y-2 w-full">
                    <h3 className="text-base font-black text-deep-violet dark:text-soft-cream uppercase tracking-wider flex items-center justify-between gap-1.5 w-full">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4.5 h-4.5 text-primary-gold animate-pulse" />
                        Daily Cosmic Forecast
                      </span>
                      {horoscopeData && !horoscopeData.isFallback && !isFetchingHoroscope && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 dark:text-violet-300 animate-pulse flex items-center gap-1 font-fredoka select-none tracking-widest shrink-0">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                          Gemini Aligned
                        </span>
                      )}
                    </h3>
                    
                    {isFetchingHoroscope || !horoscopeData ? (
                      <div className="animate-pulse space-y-2.5 pt-2">
                        <div className="h-4 bg-deep-violet/10 dark:bg-white/10 rounded-full w-3/4" />
                        <div className="h-4 bg-deep-violet/10 dark:bg-white/10 rounded-full w-5/6" />
                        <div className="h-4 bg-deep-violet/10 dark:bg-white/10 rounded-full w-2/3" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs sm:text-[13px] text-deep-violet/70 dark:text-soft-cream/75 leading-relaxed font-semibold">
                          {horoscopeData.forecast}
                        </p>
                        <p className="text-[11px] italic text-deep-violet/50 dark:text-soft-cream/50 leading-relaxed font-bold">
                          {horoscopeData.cosmicAdvice}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-deep-violet/10 dark:border-white/10 pt-4 space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-deep-violet/40 dark:text-soft-cream/45">
                        Zodiac Game Recommendation
                      </span>
                      {isFetchingHoroscope || !horoscopeData ? (
                        <div className="animate-pulse flex items-center gap-2.5 pt-1">
                          <div className="w-9 h-9 rounded-full bg-deep-violet/10 dark:bg-white/10" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3 bg-deep-violet/10 dark:bg-white/10 rounded-full w-1/3" />
                            <div className="h-2.5 bg-deep-violet/10 dark:bg-white/10 rounded-full w-1/2" />
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const resolvedGame = GAME_RECOMMENDATIONS.find(
                            (g) => g.name.toLowerCase() === horoscopeData.recommendedGame.toLowerCase()
                          ) || GAME_RECOMMENDATIONS[0];
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{resolvedGame.emoji}</span>
                              <div className="flex-1">
                                <span className="text-xs font-black text-deep-violet dark:text-soft-cream">
                                  {resolvedGame.name}
                                </span>
                                <p className="text-[10px] text-deep-violet/50 dark:text-soft-cream/50">
                                  Aligned with your celestial energy today!
                                </p>
                              </div>
                              <Link
                                href={resolvedGame.href}
                                className="py-1.5 px-3.5 rounded-full bg-primary-gold hover:bg-amber-300 text-[#1E1145] font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                              >
                                <span>Play</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* Ratings & Alignment Bonus */}
                <div className="bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border-2 border-deep-violet/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-lg flex flex-col justify-between gap-6 min-h-[300px]">
                  <div className="space-y-4 w-full">
                    <h3 className="text-base font-black text-deep-violet dark:text-soft-cream uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4.5 h-4.5 text-primary-gold" />
                      Celestial Vibe Ratings
                    </h3>
                    
                    {isFetchingHoroscope || !horoscopeData ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between w-full">
                              <div className="h-3 bg-deep-violet/10 dark:bg-white/10 rounded-full w-1/4 animate-pulse" />
                              <div className="h-3 bg-deep-violet/10 dark:bg-white/10 rounded-full w-1/12 animate-pulse" />
                            </div>
                            <div className="h-2.5 bg-deep-violet/5 dark:bg-white/5 rounded-full w-full overflow-hidden relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-deep-violet/5 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[
                          { name: "Luck Vibes", value: horoscopeData.luckyScore, icon: Sparkles, color: "from-amber-400 to-orange-500" },
                          { name: "Love Vibes", value: horoscopeData.loveScore, icon: Heart, color: "from-pink-500 to-rose-600" },
                          { name: "Career Vibes", value: horoscopeData.careerScore, icon: Briefcase, color: "from-sky-400 to-blue-600" }
                        ].map((metric) => {
                          const IconComponent = metric.icon;

                          return (
                            <div key={metric.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-black text-deep-violet dark:text-soft-cream">
                                <span className="flex items-center gap-1">
                                  <IconComponent className="w-3.5 h-3.5 opacity-60" />
                                  {metric.name}
                                </span>
                                <span className="tabular-nums font-black text-primary-gold">{metric.value}%</span>
                              </div>
                              {/* Shimmering bar container */}
                              <div className="w-full h-2.5 bg-deep-violet/5 dark:bg-white/5 rounded-full border border-deep-violet/10 dark:border-white/5 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${metric.value}%` }}
                                  transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                  className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Alignment Bonus Block */}
                  <div className="border-t border-deep-violet/10 dark:border-white/10 pt-4 flex flex-col items-center text-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-deep-violet/40 dark:text-soft-cream/45">
                        Celestial Alignment Reward
                      </span>
                      <p className="text-[11px] font-semibold text-deep-violet/60 dark:text-soft-cream/60 mt-1 max-w-[220px]">
                        Align your celestial charts daily to secure your bonus coins.
                      </p>
                    </div>

                    {!user ? (
                      <button
                        onClick={handleSignIn}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-deep-violet to-[#4f3583] hover:from-primary-gold hover:to-[#dfa72b] hover:text-deep-violet text-white border border-primary-gold/30 flex items-center justify-center gap-2 w-full text-xs font-bold transition-all duration-300 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
                      >
                        <Lock className="w-3.5 h-3.5 text-primary-gold animate-pulse" />
                        <span>Sign In to Claim +200 Vibe Coins!</span>
                      </button>
                    ) : alreadyClaimed ? (
                      <div className="py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center gap-1.5 w-full text-xs font-black uppercase tracking-wider">
                        <span>✓ Alignment Bonus Claimed</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleClaim}
                        className="py-3 px-6 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-deep-violet font-black text-xs tracking-wider uppercase shadow-md active:scale-95 transition-all w-full flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Coins className="w-4 h-4" />
                        <span>Claim +200 Coins!</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
