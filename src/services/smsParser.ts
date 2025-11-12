import { supabase } from "@/integrations/supabase/client";

export interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  bankName: string;
  accountNumber?: string;
  description: string;
  date: Date;
  category: string;
}

export class SMSParser {
  // Common bank keywords and patterns
  private static readonly BANK_PATTERNS = {
    // UPI patterns
    upi: /(?:UPI|IMPS|NEFT|RTGS)/i,
    // Amount patterns
    amount: /(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
    // Credit/Debit patterns
    credited: /(?:credited|received|deposited|added)/i,
    debited: /(?:debited|paid|withdrawn|spent|sent)/i,
    // Bank name patterns
    bankName: /(?:from|at|to)\s+([A-Z]{2,}(?:\s+[A-Z]+)*(?:\s+Bank)?)/i,
    // Account number patterns
    accountNumber: /(?:A\/c|Account|Acc)\s*(?:No\.?|Number)?\s*[xX]*(\d{4,})/i,
    // Date patterns
    date: /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  };

  private static readonly COMMON_BANKS = [
    'HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'PNB', 'BOB', 'BOI',
    'CANARA', 'UNION', 'IDBI', 'YES', 'IndusInd', 'Federal', 'RBL',
    'Standard Chartered', 'HSBC', 'Citibank', 'DBS', 'Paytm', 'PhonePe',
    'Google Pay', 'Amazon Pay', 'Paytm Payments Bank'
  ];

  static parseSMS(message: string): ParsedTransaction | null {
    try {
      // Check if it's a bank transaction SMS
      if (!this.isBankSMS(message)) {
        return null;
      }

      // Extract amount
      const amount = this.extractAmount(message);
      if (!amount) return null;

      // Determine transaction type
      const type = this.getTransactionType(message);

      // Extract bank name
      const bankName = this.extractBankName(message);

      // Extract account number
      const accountNumber = this.extractAccountNumber(message);

      // Extract or infer date
      const date = this.extractDate(message);

      // Determine category
      const category = this.determineCategory(message, type);

      // Generate description
      const description = this.generateDescription(message, type, bankName);

      return {
        amount,
        type,
        bankName: bankName || 'Unknown Bank',
        accountNumber,
        description,
        date,
        category,
      };
    } catch (error) {
      console.error('Error parsing SMS:', error);
      return null;
    }
  }

  private static isBankSMS(message: string): boolean {
    // Check for common banking keywords
    const keywords = ['debited', 'credited', 'transaction', 'upi', 'imps', 
                     'neft', 'rtgs', 'account', 'balance', 'payment', 'received'];
    
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword)) &&
           (this.BANK_PATTERNS.amount.test(message) || /\d{3,}/.test(message));
  }

  private static extractAmount(message: string): number | null {
    const amountMatch = message.match(this.BANK_PATTERNS.amount);
    if (amountMatch) {
      const amountStr = amountMatch[1].replace(/,/g, '');
      return parseFloat(amountStr);
    }

    // Try to find any number that looks like an amount
    const numberMatch = message.match(/\b(\d{2,}(?:\.\d{2})?)\b/);
    if (numberMatch) {
      return parseFloat(numberMatch[1]);
    }

    return null;
  }

  private static getTransactionType(message: string): 'income' | 'expense' {
    if (this.BANK_PATTERNS.credited.test(message)) {
      return 'income';
    }
    if (this.BANK_PATTERNS.debited.test(message)) {
      return 'expense';
    }
    // Default to expense if unclear
    return 'expense';
  }

  private static extractBankName(message: string): string {
    // Try to match bank name from message
    const bankMatch = message.match(this.BANK_PATTERNS.bankName);
    if (bankMatch) {
      const extractedName = bankMatch[1].trim();
      // Check if it matches known banks
      const knownBank = this.COMMON_BANKS.find(bank => 
        extractedName.toUpperCase().includes(bank.toUpperCase())
      );
      if (knownBank) return knownBank;
      return extractedName;
    }

    // Check sender ID or common bank names in message
    for (const bank of this.COMMON_BANKS) {
      if (message.toUpperCase().includes(bank.toUpperCase())) {
        return bank;
      }
    }

    return 'Unknown Bank';
  }

  private static extractAccountNumber(message: string): string | undefined {
    const accountMatch = message.match(this.BANK_PATTERNS.accountNumber);
    if (accountMatch) {
      return accountMatch[1];
    }
    return undefined;
  }

  private static extractDate(message: string): Date {
    const dateMatch = message.match(this.BANK_PATTERNS.date);
    if (dateMatch) {
      try {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch {
        // Fall through to return current date
      }
    }
    return new Date();
  }

  private static determineCategory(message: string, type: 'income' | 'expense'): string {
    const lowerMessage = message.toLowerCase();

    if (type === 'income') {
      if (lowerMessage.includes('salary')) return 'Salary';
      if (lowerMessage.includes('refund')) return 'Refund';
      return 'Income';
    }

    // Expense categories
    if (lowerMessage.includes('food') || lowerMessage.includes('restaurant') || 
        lowerMessage.includes('zomato') || lowerMessage.includes('swiggy')) {
      return 'Food & Dining';
    }
    if (lowerMessage.includes('uber') || lowerMessage.includes('ola') || 
        lowerMessage.includes('fuel') || lowerMessage.includes('petrol')) {
      return 'Transport';
    }
    if (lowerMessage.includes('amazon') || lowerMessage.includes('flipkart') || 
        lowerMessage.includes('shopping')) {
      return 'Shopping';
    }
    if (lowerMessage.includes('electricity') || lowerMessage.includes('water') || 
        lowerMessage.includes('gas') || lowerMessage.includes('bill')) {
      return 'Bills & Utilities';
    }
    if (lowerMessage.includes('medicine') || lowerMessage.includes('hospital') || 
        lowerMessage.includes('doctor')) {
      return 'Healthcare';
    }
    if (lowerMessage.includes('movie') || lowerMessage.includes('entertainment')) {
      return 'Entertainment';
    }

    return 'Others';
  }

  private static generateDescription(message: string, type: string, bankName: string): string {
    // Try to extract merchant/recipient name
    const upiPattern = /(?:to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/;
    const match = message.match(upiPattern);
    
    if (match) {
      return `${type === 'income' ? 'Received from' : 'Paid to'} ${match[1]} via ${bankName}`;
    }

    return `${type === 'income' ? 'Credit' : 'Debit'} transaction via ${bankName}`;
  }

  static async processAndSave(message: string, userId: string): Promise<boolean> {
    try {
      const parsed = this.parseSMS(message);
      if (!parsed) return false;

      // Check for duplicate transactions (same amount, bank, and date)
      const dateStr = parsed.date.toISOString().split('T')[0];
      const { data: existingTransactions, error: checkError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("amount", parsed.amount)
        .eq("date", dateStr)
        .eq("type", parsed.type)
        .ilike("description", `%${parsed.bankName}%`);

      if (checkError) {
        console.error("Error checking duplicates:", checkError);
      } else if (existingTransactions && existingTransactions.length > 0) {
        console.log("Duplicate transaction detected, skipping import");
        return false;
      }

      // Find or create account
      const account = await this.findOrCreateAccount(userId, parsed.bankName, parsed.accountNumber);
      if (!account) return false;

      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          account_id: account.id,
          amount: parsed.amount,
          type: parsed.type,
          category: parsed.category,
          description: parsed.description,
          date: dateStr,
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        return false;
      }

      // Update account balance
      const balanceChange = parsed.type === 'income' ? parsed.amount : -parsed.amount;
      const { error: accountError } = await supabase
        .from('accounts')
        .update({ 
          balance: account.balance + balanceChange 
        })
        .eq('id', account.id);

      if (accountError) {
        console.error('Error updating account balance:', accountError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error processing SMS:', error);
      return false;
    }
  }

  private static async findOrCreateAccount(
    userId: string, 
    bankName: string, 
    accountNumber?: string
  ): Promise<{ id: string; balance: number } | null> {
    try {
      // Try to find existing account by bank name and account number
      let query = supabase
        .from('accounts')
        .select('id, balance')
        .eq('user_id', userId)
        .eq('bank_name', bankName);

      if (accountNumber) {
        query = query.eq('account_number', accountNumber);
      }

      const { data: existingAccounts } = await query;

      if (existingAccounts && existingAccounts.length > 0) {
        return existingAccounts[0];
      }

      // Create new account
      const accountName = accountNumber 
        ? `${bankName} (...${accountNumber.slice(-4)})`
        : bankName;

      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          name: accountName,
          bank_name: bankName,
          account_number: accountNumber,
          balance: 0,
          type: 'bank',
          icon: '🏦',
          color: '#3b82f6',
        })
        .select('id, balance')
        .single();

      if (error) {
        console.error('Error creating account:', error);
        return null;
      }

      return newAccount;
    } catch (error) {
      console.error('Error in findOrCreateAccount:', error);
      return null;
    }
  }
}
