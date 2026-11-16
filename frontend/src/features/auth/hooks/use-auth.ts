import { useAuthStore } from "@/store/use-auth-store";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    hasHydrated,
    login,
    loginWithGoogle,
    register,
    verifyEmailOtp,
    logout,
    updateProfile,
    setError,
    syncSession,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    hasHydrated,
    login,
    loginWithGoogle,
    register,
    verifyEmailOtp,
    logout,
    updateProfile,
    setError,
    syncSession,
  };
};
