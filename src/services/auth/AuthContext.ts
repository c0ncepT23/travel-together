import React from 'react';

type AuthContextType = {
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (token: string) => Promise<void>;
};

// Create authentication context with default values
export const AuthContext = React.createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
});

// Hook to use auth context
export const useAuth = () => React.useContext(AuthContext);