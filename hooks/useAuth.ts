import { useAuthContext as useAuthContextRaw } from "@/components/AuthProvider";

// Fallback when used outside AuthProvider (e.g., on admin login page)
export function useAuth() {
  try {
    return useAuthContextRaw();
  } catch (error) {
    console.warn("useAuth() called outside AuthProvider, using fallback");
    return {
      session: null,
      user: null,
      profile: null,
      loading: false,
      profileLoading: false,
      signUp: async () => ({ success: false, error: "Not authenticated" }),
      signIn: async () => Promise.resolve(null),
      signOut: async () => {},
      refreshProfile: async () => {},
      updateProfile: () => Promise.resolve({ success: false, error: "Not authenticated" }),
    } as any;
  }
}
