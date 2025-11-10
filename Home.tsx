import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Fire Risk Assessor</h1>
        <p className="text-slate-600 mb-8">
          Automated fire risk assessment with AI assistance. Conduct comprehensive fire safety assessments with voice input, image analysis, and intelligent recommendations.
        </p>
        <Button
          size="lg"
          onClick={() => window.location.href = getLoginUrl()}
          className="w-full"
        >
          Sign In to Get Started
        </Button>
      </div>
    </div>
  );
}
