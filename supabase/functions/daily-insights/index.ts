import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Fetch recent transactions
    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    // Fetch budget info
    const { data: budgets } = await supabaseClient
      .from('budget')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    // Fetch savings goals
    const { data: goals } = await supabaseClient
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id);

    // Calculate insights
    const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const budget = budgets?.[0];
    const budgetUsage = budget ? (budget.current_spent / budget.monthly_limit) * 100 : 0;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Based on this financial data, provide ONE concise, actionable financial tip (max 2 sentences):
- Total Expenses (last 30 days): ₹${totalExpense}
- Total Income (last 30 days): ₹${totalIncome}
- Budget Usage: ${budgetUsage.toFixed(1)}%
- Savings Goals: ${goals?.length || 0}

Give a friendly, motivating tip to improve their finances.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a friendly financial advisor. Give short, practical money tips.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return new Response(JSON.stringify({ 
        insight: "💰 Track your spending daily to build better money habits!" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "💡 Keep up the good work with your finances!";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        insight: "💰 Remember: every small saving counts towards your goals!" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
