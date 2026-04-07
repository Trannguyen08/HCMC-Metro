import { useAuthStore } from "@/store/use-auth-store";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    register,
    verifyEmailOtp,
    logout,
    updateProfile,
    setError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    register,
    verifyEmailOtp,
    logout,
    updateProfile,
    setError,
  };
};
