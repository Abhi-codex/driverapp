class FirebaseConfirmationStore {
  private static confirmations: Map<string, any> = new Map();

  static store(verificationId: string, confirmation: any): void {
    this.confirmations.set(verificationId, confirmation);
  }

  static get(verificationId: string): any | null {
    return this.confirmations.get(verificationId) || null;
  }

  static remove(verificationId: string): void {
    this.confirmations.delete(verificationId);
  }

  static clear(): void {
    this.confirmations.clear();
  }
}

export default FirebaseConfirmationStore;
