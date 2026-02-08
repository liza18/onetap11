import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Mail, Lock, Eye, EyeOff, ChevronDown, Check, Globe } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "@/hooks/use-toast";
import { COUNTRY_OPTIONS, COUNTRY_CURRENCY_MAP, CURRENCY_SYMBOLS, CountryCode } from "@/types/settings";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const { setCountry } = useSettings();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("us");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : error.message,
          variant: "destructive",
        });
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message?.includes("already registered")) {
          toast({
            title: "Account Exists",
            description: "This email is already registered. Try signing in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Set country/currency on signup
        await setCountry(selectedCountry);
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your account.",
        });
      }
    }

    setIsSubmitting(false);
  };

  const selectedCountryOption = COUNTRY_OPTIONS.find((c) => c.code === selectedCountry)!;
  const inferredCurrency = COUNTRY_CURRENCY_MAP[selectedCountry];
  const currencySymbol = CURRENCY_SYMBOLS[inferredCurrency];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-accent/[0.04] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[18px] gradient-hero flex items-center justify-center mx-auto mb-4 shadow-elevated">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight">AgentCart</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Your AI shopping agent</p>
        </div>

        {/* Auth card */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <h2 className="font-display font-semibold text-lg tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isLogin
                ? "Sign in to continue shopping"
                : "Start shopping with AI assistance"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 h-11 rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 rounded-xl bg-secondary/40 border-border/50 focus-visible:ring-primary/30"
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Country picker — only shown on signup */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Country
                  </Label>
                  <div className="relative mt-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCountryPicker(!showCountryPicker)}
                      className="w-full h-11 rounded-xl bg-secondary/40 border border-border/50 px-4 flex items-center justify-between text-sm font-medium hover:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className="h-4 w-4 text-muted-foreground/50" />
                        <span>{selectedCountryOption.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({inferredCurrency} {currencySymbol})
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showCountryPicker ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {showCountryPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border/60 rounded-xl shadow-elevated overflow-hidden"
                        >
                          {COUNTRY_OPTIONS.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c.code);
                                setShowCountryPicker(false);
                              }}
                              className={`w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-secondary/50 transition-colors ${
                                selectedCountry === c.code ? "bg-primary/10" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-medium">{c.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({COUNTRY_CURRENCY_MAP[c.code]} {CURRENCY_SYMBOLS[COUNTRY_CURRENCY_MAP[c.code]]})
                                </span>
                              </div>
                              {selectedCountry === c.code && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-medium text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center pt-1">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
