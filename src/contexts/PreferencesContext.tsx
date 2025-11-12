import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PreferencesContextType {
  currency: string;
  language: string;
  setCurrency: (currency: string) => void;
  setLanguage: (language: string) => void;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<string>('INR');
  const [language, setLanguageState] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_currency, preferred_language')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setCurrencyState(profile.preferred_currency || 'INR');
          setLanguageState(profile.preferred_language || 'en');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_currency: newCurrency })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating currency:', error);
      }
    }
  };

  const setLanguage = async (newLanguage: string) => {
    setLanguageState(newLanguage);
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: newLanguage })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        currency,
        language,
        setCurrency,
        setLanguage,
        isLoading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
