"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Credenciais inválidas. Verifique seu e-mail e senha.");
                toast.error("Erro ao entrar", {
                    description: "Credenciais inválidas."
                });
            } else {
                toast.success("Login realizado com sucesso!", {
                    description: "Bem-vindo de volta à Plataforma de BI."
                });
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Ocorreu um erro inesperado.");
            toast.error("Erro inesperado", {
                description: "Tente novamente mais tarde."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-chart-2/10 rounded-full blur-[120px]" />

            <Card className="w-full max-w-[400px] bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl relative z-10 mx-4">
                <CardHeader className="space-y-1 text-center pb-8 border-b border-border/20">
                    <div className="mx-auto w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 border border-primary/30">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-chart-2">
                        Plataforma de BI
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">
                        Entre com suas credenciais para acessar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 px-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-background/50 border-input h-11 focus-visible:ring-primary/30"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-background/50 border-input h-11 focus-visible:ring-primary/30"
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-2 pb-8 pt-4">
                    <p className="text-xs text-muted-foreground">
                        © 2026 - BI Platform v2.0
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
