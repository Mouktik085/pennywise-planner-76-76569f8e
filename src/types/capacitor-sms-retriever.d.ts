declare module '@capacitor-community/sms-retriever' {
  export interface SmsRetrieverPlugin {
    requestPermission(): Promise<void>;
    startWatch(): Promise<void>;
    stopWatch(): Promise<void>;
    addListener(
      eventName: 'smsReceived',
      listenerFunc: (data: { message: string }) => void
    ): Promise<any>;
    removeAllListeners(): Promise<void>;
  }

  const SmsRetriever: SmsRetrieverPlugin;
  export { SmsRetriever };
}
