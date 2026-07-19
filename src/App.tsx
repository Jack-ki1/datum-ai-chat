import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/chat/CommandPalette";
import { KeyboardShortcuts } from "@/components/chat/KeyboardShortcuts";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import DataViewer from "./pages/DataViewer";
import NotFound from "./pages/NotFound";
import SamplePrompts from "./pages/SamplePrompts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CommandPalette />
          <KeyboardShortcuts />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:sessionId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/data/:view" element={<ProtectedRoute><DataViewer /></ProtectedRoute>} />
            <Route path="/prompts" element={<ProtectedRoute><SamplePrompts /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
