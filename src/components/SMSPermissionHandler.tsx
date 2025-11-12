import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/hooks/useAuth";
import { SMSParser } from "@/services/smsParser";
import { SmsRetriever } from "@capacitor-community/sms-retriever";

export const SMSPermissionHandler = () => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const [manualSMS, setManualSMS] = useState("");
  const [showManualImport, setShowManualImport] = useState(false);

  useEffect(() => {
    // Check if running on native platform
    setIsNativePlatform(Capacitor.isNativePlatform());
  }, []);

  const requestSMSPermission = async () => {
    if (!isNativePlatform) {
      toast.error("SMS reading is only available on mobile devices");
      return;
    }

    try {
      // Request permission to read SMS
      await SmsRetriever.requestPermission();
      toast.success("SMS permission granted!");
      setHasPermission(true);
      
      // Start monitoring
      startSMSMonitoring();
    } catch (error) {
      console.error("Error requesting SMS permission:", error);
      toast.error("Failed to get SMS permission. Please enable it in app settings.");
    }
  };

  const startSMSMonitoring = async () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    setIsMonitoring(true);
    toast.success("SMS monitoring started! Bank transactions will be automatically imported.");
    
    // Listen to incoming SMS messages
    try {
      await SmsRetriever.startWatch();
      
      SmsRetriever.addListener('smsReceived', async (data: any) => {
        console.log('SMS received:', data.message);
        
        // Process and save the transaction
        if (user) {
          const success = await SMSParser.processAndSave(data.message, user.id);
          if (success) {
            toast.success("Transaction imported from SMS!");
          }
        }
      });
    } catch (error) {
      console.error("Error starting SMS watch:", error);
      toast.error("Failed to start SMS monitoring");
    }
  };

  const stopSMSMonitoring = async () => {
    try {
      await SmsRetriever.stopWatch();
      SmsRetriever.removeAllListeners();
      setIsMonitoring(false);
      toast.info("SMS monitoring stopped");
    } catch (error) {
      console.error("Error stopping SMS watch:", error);
    }
  };

  const testSMSParser = async () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    // Test with sample SMS messages
    const sampleSMS = [
      "Rs 500.00 debited from HDFC Bank A/c XX1234 on 11-Jan-25 for UPI transaction to PhonePe",
      "Your A/c XX5678 credited with Rs 2500.00 on 10-Jan-25. SBI Bank",
      "ICICI Bank: Rs 1200 spent at Amazon on 11-Jan-25 from card XX9012",
    ];

    let successCount = 0;
    for (const sms of sampleSMS) {
      const success = await SMSParser.processAndSave(sms, user.id);
      if (success) successCount++;
    }

    if (successCount > 0) {
      toast.success(`${successCount} test transactions imported successfully!`);
    } else {
      toast.error("Failed to import test transactions");
    }
  };

  const handleManualImport = async () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    if (!manualSMS.trim()) {
      toast.error("Please paste an SMS message");
      return;
    }

    const success = await SMSParser.processAndSave(manualSMS, user.id);
    if (success) {
      toast.success("Transaction imported successfully!");
      setManualSMS("");
      setShowManualImport(false);
    } else {
      toast.error("Could not parse this SMS. Make sure it's a bank transaction SMS.");
    }
  };

  if (!isNativePlatform) {
    return (
      <Card className="p-4 md:p-6 bg-muted/50">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-primary/10 rounded-lg">
            <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-bold text-base md:text-lg mb-1">SMS Auto-Import</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                SMS auto-import is only available when the app is installed as an APK.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setShowManualImport(!showManualImport)} 
                variant="outline" 
                className="w-full"
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {showManualImport ? "Hide Manual Import" : "Manual SMS Import"}
              </Button>

              {showManualImport && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Paste your bank SMS here..."
                    value={manualSMS}
                    onChange={(e) => setManualSMS(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <Button onClick={handleManualImport} className="w-full" size="sm">
                    Import Transaction
                  </Button>
                </div>
              )}

              <Button onClick={testSMSParser} variant="outline" className="w-full" size="sm">
                Test with Sample SMS
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="p-2 md:p-3 bg-primary/10 rounded-lg">
          <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-3 md:space-y-4">
          <div>
            <h3 className="font-bold text-base md:text-lg mb-1 flex items-center gap-2">
              SMS Auto-Import
              {hasPermission && (
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              )}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Automatically import bank transactions from SMS
            </p>
          </div>

          {!hasPermission ? (
            <div className="space-y-3">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs md:text-sm font-semibold text-primary mb-2">📱 Features</p>
                <ul className="text-xs md:text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Reads bank SMS automatically</li>
                  <li>Duplicate detection prevents double entries</li>
                  <li>Creates accounts automatically</li>
                  <li>Updates balance in real-time</li>
                  <li>Smart categorization</li>
                </ul>
              </div>
              <Button onClick={requestSMSPermission} className="w-full" size="sm">
                Enable SMS Auto-Import
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                  {isMonitoring ? "✓ Monitoring Active" : "✓ Permission Granted"}
                </p>
                <p className="text-xs md:text-sm text-green-600 dark:text-green-500">
                  {isMonitoring 
                    ? "Auto-importing bank transactions with duplicate detection"
                    : "SMS permission granted. Monitoring will start automatically."
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => setShowManualImport(!showManualImport)} 
                  variant="outline" 
                  className="w-full"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Manual SMS Import
                </Button>

                {showManualImport && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Paste your bank SMS here..."
                      value={manualSMS}
                      onChange={(e) => setManualSMS(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                    <Button onClick={handleManualImport} className="w-full" size="sm">
                      Import Transaction
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={testSMSParser} variant="outline" size="sm">
                    Test Import
                  </Button>
                  <Button 
                    onClick={stopSMSMonitoring} 
                    variant="outline" 
                    size="sm"
                    disabled={!isMonitoring}
                  >
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Only bank SMS will be read. Duplicates are automatically detected.
          </div>
        </div>
      </div>
    </Card>
  );
};
