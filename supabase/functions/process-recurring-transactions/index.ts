import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting recurring transactions processing...");

    // Get all recurring transactions that need processing
    const today = new Date().toISOString().split('T')[0];
    
    const { data: recurringTransactions, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("is_recurring", true)
      .lte("next_occurrence_date", today)
      .not("next_occurrence_date", "is", null);

    if (fetchError) {
      console.error("Error fetching recurring transactions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringTransactions?.length || 0} transactions to process`);

    const processedTransactions = [];

    // Process each recurring transaction
    for (const transaction of recurringTransactions || []) {
      try {
        console.log(`Processing transaction: ${transaction.description} (${transaction.recurring_frequency})`);

        // Create new transaction entry
        const { data: newTransaction, error: insertError } = await supabase
          .from("transactions")
          .insert({
            user_id: transaction.user_id,
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            description: transaction.description,
            account_id: transaction.account_id,
            date: today,
            is_recurring: false, // The new instance is not recurring
            is_planned: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating transaction: ${insertError.message}`);
          continue;
        }

        console.log(`Created new transaction: ${newTransaction.id}`);

        // Update account balance
        if (transaction.account_id) {
          const { data: account } = await supabase
            .from("accounts")
            .select("balance, is_credit_card, credit_used")
            .eq("id", transaction.account_id)
            .single();

          if (account) {
            let updateData: any = {};
            
            if (account.is_credit_card) {
              // For credit cards, update credit_used
              if (transaction.type === "expense") {
                updateData.credit_used = Number(account.credit_used) + Number(transaction.amount);
              } else {
                // Payment towards credit card
                updateData.credit_used = Math.max(0, Number(account.credit_used) - Number(transaction.amount));
              }
            } else {
              // For regular accounts, update balance
              if (transaction.type === "income") {
                updateData.balance = Number(account.balance) + Number(transaction.amount);
              } else {
                updateData.balance = Number(account.balance) - Number(transaction.amount);
              }
            }

            await supabase
              .from("accounts")
              .update(updateData)
              .eq("id", transaction.account_id);

            console.log(`Updated account balance`);
          }
        }

        // Calculate next occurrence date
        let nextDate = new Date(transaction.next_occurrence_date);
        
        switch (transaction.recurring_frequency) {
          case "daily":
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case "weekly":
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case "monthly":
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case "yearly":
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        const nextDateStr = nextDate.toISOString().split('T')[0];

        // Update original recurring transaction
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            last_processed_date: today,
            next_occurrence_date: nextDateStr,
          })
          .eq("id", transaction.id);

        if (updateError) {
          console.error(`Error updating recurring transaction: ${updateError.message}`);
          continue;
        }

        console.log(`Next occurrence: ${nextDateStr}`);

        processedTransactions.push({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          nextDate: nextDateStr,
        });
      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error);
      }
    }

    console.log(`✅ Successfully processed ${processedTransactions.length} recurring transactions`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: processedTransactions.length,
        transactions: processedTransactions,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in process-recurring-transactions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
