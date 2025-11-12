import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  subject: string;
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
    const { to, subject, type, data }: NotificationRequest = await req.json();

    let htmlContent = "";

    switch (type) {
      case "budget_alert":
        htmlContent = `
          <h1>Budget Alert</h1>
          <p>You've used <strong>${((data.spent || 0) / (data.limit || 1) * 100).toFixed(0)}%</strong> of your ${data.category || ''} budget.</p>
          <p>Spent: ₹${data.spent?.toFixed(2)} / ₹${data.limit?.toFixed(2)}</p>
          <p>Consider reviewing your spending in this category.</p>
        `;
        break;

      case "transaction_reminder":
        htmlContent = `
          <h1>Transaction Reminder</h1>
          <p>You have an upcoming transaction:</p>
          <p><strong>${data.description}</strong></p>
          <p>Amount: ₹${data.amount?.toFixed(2)}</p>
          <p>Due: ${data.dueDate}</p>
        `;
        break;

      case "savings_milestone":
        const progress = ((data.currentAmount || 0) / (data.targetAmount || 1) * 100).toFixed(0);
        htmlContent = `
          <h1>🎉 Savings Milestone Reached!</h1>
          <p>Congratulations! You've reached ${progress}% of your <strong>${data.goalName}</strong> goal!</p>
          <p>Current Amount: ₹${data.currentAmount?.toFixed(2)}</p>
          <p>Target Amount: ₹${data.targetAmount?.toFixed(2)}</p>
          <p>Keep up the great work!</p>
        `;
        break;

      case "credit_card_due":
        htmlContent = `
          <h1>Credit Card Payment Due</h1>
          <p>Your credit card payment is due soon:</p>
          <p>Amount Due: ₹${data.amount?.toFixed(2)}</p>
          <p>Due Date: ${data.dueDate}</p>
          <p>Don't forget to make your payment on time to avoid late fees!</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Budget Manager <onboarding@resend.dev>",
      to: [to],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlContent}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="color: #888; font-size: 12px;">
            This is an automated email from Budget Manager. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email:", error);
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
