import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useTheme = () => {
  const { user } = useAuth();
  const [themeColors, setThemeColors] = useState({
    primary: "#8B5CF6",
    accent: "#10B981",
  });

  useEffect(() => {
    if (user) {
      fetchTheme();
    }
  }, [user]);

  const fetchTheme = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("theme_primary_color, theme_accent_color")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setThemeColors({
          primary: data.theme_primary_color || "#8B5CF6",
          accent: data.theme_accent_color || "#10B981",
        });
        applyTheme(data.theme_primary_color, data.theme_accent_color);
      }
    } catch (error) {
      console.error("Error fetching theme:", error);
    }
  };

  const applyTheme = (primaryColor?: string, accentColor?: string) => {
    if (primaryColor) {
      const root = document.documentElement;
      const hsl = hexToHSL(primaryColor);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--sidebar-primary", hsl);
    }
    if (accentColor) {
      const root = document.documentElement;
      const hsl = hexToHSL(accentColor);
      root.style.setProperty("--accent", hsl);
    }
  };

  const hexToHSL = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "262 83% 58%";

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  return { themeColors, applyTheme };
};
