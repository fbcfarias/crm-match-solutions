import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary rounded-xl">
              <Building2 className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Match Solutions CRM</h1>
          <p className="text-muted-foreground">Sistema de Gestão de Vendas com Agente IA</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Entre com sua conta existente</CardDescription>
            </CardHeader>
            <CardContent>
              <SupabaseAuth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: "hsl(215 56% 40%)",
                        brandAccent: "hsl(215 72% 25%)",
                      },
                    },
                  },
                }}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: "Email",
                      password_label: "Senha",
                      button_label: "Entrar",
                      loading_button_label: "Entrando...",
                    },
                  },
                }}
                providers={[]}
                redirectTo={`${window.location.origin}/dashboard`}
                view="sign_in"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Conta</CardTitle>
              <CardDescription>Escolha o tipo de conta que deseja criar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/register/vendedor" className="block">
                <Button className="w-full" size="lg">
                  Cadastrar como Vendedor
                </Button>
              </Link>
              <Link to="/register/admin" className="block">
                <Button className="w-full" variant="outline" size="lg">
                  Cadastrar como Administrador
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;