import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const Analytics = () => {
  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">Métricas e relatórios de desempenho</p>
        </div>

        <Card className="p-12">
          <div className="text-center space-y-4">
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/50" />
            <h3 className="text-xl font-semibold">Analytics em Desenvolvimento</h3>
            <p className="text-muted-foreground">
              Gráficos e relatórios detalhados serão implementados em breve
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;