import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  type: "budget_alert" | "transaction_reminder" | "savings_milestone" | "credit_card_due";
  data: {
    amount?: number;
    category?: string;
    goalName?: string;
    dueDate?: string;
    description?: string;
    limit?: number;
    spent?: number;
    targetAmount?: number;
    currentAmount?: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: NotificationRequest = await req.json();

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      throw new Error("Twilio credentials not configured");
    }

    let message = "";

    switch (type) {
      case "budget_alert":
        const percent = ((data.spent || 0) / (data.limit || 1) * 100).toFixed(0);
        message = `Budget Alert: ${data.category || 'Your'} budget at ${percent}%. ₹${data.spent?.toFixed(0)}/₹${data.limit?.toFixed(0)}`;
        break;

      case "transaction_reminder":
        message = `Reminder: ${data.description} - ₹${data.amount?.toFixed(0)} on ${data.dueDate}`;
        break;

      case "savings_milestone":
        const progress = ((data.currentAmount || 0) / (data.targetAmount || 1) * 100).toFixed(0);
        message = `🎉 Milestone! ${data.goalName}: ${progress}% complete. ₹${data.currentAmount?.toFixed(0)}/₹${data.targetAmount?.toFixed(0)}`;
        break;

      case "credit_card_due":
        message = `Credit card payment due: ₹${data.amount?.toFixed(0)} on ${data.dueDate}`;
        break;
    }

    // Twilio API call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: twilioPhone,
        Body: message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", result);
      throw new Error(result.message || "Failed to send SMS");
    }

    console.log("SMS sent successfully:", result.sid);

    return new Response(JSON.stringify({ success: true, sid: result.sid }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-sms:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
