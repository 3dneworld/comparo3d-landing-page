import { createContext, useContext, useState, type ReactNode } from "react";

export type Audience = "particular" | "empresa";

interface AudienceContextType {
  audience: Audience;
  setAudience: (a: Audience) => void;
}

const AudienceContext = createContext<AudienceContextType>({
  audience: "particular",
  setAudience: () => {},
});

export const useAudience = () => useContext(AudienceContext);

export const AudienceProvider = ({ children }: { children: ReactNode }) => {
  const [audience, setAudience] = useState<Audience>("particular");
  return (
    <AudienceContext.Provider value={{ audience, setAudience }}>
      {children}
    </AudienceContext.Provider>
  );
};
