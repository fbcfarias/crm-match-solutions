import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const Chat = () => {
  return (
    <Layout>
      <div className="h-screen p-8">
        <div className="h-full flex flex-col">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-foreground mb-2">Chat</h1>
            <p className="text-muted-foreground">Conversas com seus leads</p>
          </div>

          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <h3 className="text-xl font-semibold">Chat em Desenvolvimento</h3>
              <p className="text-muted-foreground">
                Interface de chat será implementada em breve
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;