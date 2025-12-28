import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import InfoCard from "@/components/InfoCard";
import ProgressIndicator from "@/components/ProgressIndicator";
import SurveyForm from "@/components/SurveyForm";

const Index = () => {
  const [responseCount, setResponseCount] = useState(0);
  const [deadline, setDeadline] = useState<string | undefined>();
  const [lockedBlock, setLockedBlock] = useState<{ block: string; label: string } | undefined>();
  const [isFormLocked, setIsFormLocked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase.functions.invoke("get-public-info");
        if (data) {
          setResponseCount(data.responseCount || 0);
          setDeadline(data.deadline);
          setLockedBlock(data.lockedBlock);
          setIsFormLocked(data.formLocked || false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen hero-gradient">
      <Hero />
      <InfoCard />
      <ProgressIndicator 
        responseCount={responseCount} 
        deadline={deadline}
        lockedBlock={lockedBlock}
      />
      <SurveyForm isLocked={isFormLocked || !!lockedBlock} />
    </main>
  );
};

export default Index;
