import AsyncStorage from '@react-native-async-storage/async-storage';

function keyForUser(userId: string) {
  return `draft_quote_id:${userId}`;
}

export async function getDraftQuoteId(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(keyForUser(userId));
  } catch {
    return null;
  }
}

export async function setDraftQuoteId(userId: string, quoteId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(keyForUser(userId), quoteId);
  } catch {
    // noop
  }
}

export async function clearDraftQuoteId(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyForUser(userId));
  } catch {
    // noop
  }
}

