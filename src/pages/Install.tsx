import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, Download } from "lucide-react";
import { useEffect, useState } from "react";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <Smartphone className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h1 className="text-4xl font-bold mb-2">Install Budget Manager</h1>
        <p className="text-muted-foreground">
          Install this app on your phone for a better experience
        </p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Installation Instructions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Download className="w-5 h-5" />
              For Android (Chrome/Samsung Internet)
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-7">
              <li>Open this page in Chrome or Samsung Internet browser</li>
              <li>Tap the menu button (three dots) in the top right</li>
              <li>Tap "Add to Home screen" or "Install app"</li>
              <li>Tap "Add" or "Install" to confirm</li>
              <li>The app will appear on your home screen like a regular app</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Download className="w-5 h-5" />
              For iPhone/iPad (Safari)
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-7">
              <li>Open this page in Safari browser</li>
              <li>Tap the Share button (square with arrow up)</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
              <li>The app will appear on your home screen</li>
            </ol>
          </div>
        </div>

        {isInstallable && (
          <div className="mt-6 pt-6 border-t">
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Install Now
            </Button>
          </div>
        )}
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Once installed, you can use the app offline and it will feel like a native app!</p>
      </div>
    </div>
  );
};

export default Install;
