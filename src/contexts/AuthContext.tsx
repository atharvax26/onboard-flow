import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "@/lib/types";
import { api, getAuthToken, clearAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, company: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth token on mount and restore user session
  useEffect(() => {
    const restoreSession = async () => {
      console.log('🔄 Restoring session...');
      const token = getAuthToken();
      console.log('Token exists:', !!token);
      
      if (token) {
        try {
          // Try to get user data from localStorage first for faster load
          const storedUser = localStorage.getItem('currentUser');
          console.log('Stored user exists:', !!storedUser);
          
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log('✅ Restored user from localStorage:', parsedUser.email, 'Role:', parsedUser.role);
            setUser(parsedUser);
            
            // Refresh user data in background to verify session is still valid
            try {
              console.log('🔄 Refreshing user data from API...');
              const updatedUser = await api.getUser(parsedUser.email);
              console.log('✅ User data refreshed from API');
              setUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            } catch (error) {
              console.error('⚠️ Failed to refresh user data (using cached):', error);
              // If API call fails, check if it's an auth error
              if (error instanceof Error && error.message.includes('401')) {
                console.log('❌ Session expired, logging out');
                clearAuthToken();
                localStorage.removeItem('currentUser');
                setUser(null);
              }
              // Otherwise keep using cached user data
            }
          } else {
            console.log('⚠️ Token exists but no stored user data');
            clearAuthToken();
          }
        } catch (error) {
          console.error('❌ Failed to restore session:', error);
          clearAuthToken();
          localStorage.removeItem('currentUser');
        }
      } else {
        console.log('ℹ️ No token found, user not logged in');
      }
      
      setLoading(false);
      console.log('✅ Session restoration complete');
    };
    
    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Logging in:', email);
      const response = await api.login(email, password);
      setUser(response.user);
      
      // Store user data in localStorage for session persistence
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      console.log('✅ Login successful, user stored in localStorage');
      
      // Verify token was saved
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        console.log('✅ Auth token confirmed in localStorage');
      } else {
        console.error('❌ WARNING: Auth token NOT in localStorage!');
        // Force save it
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          console.log('✅ Token manually saved to localStorage');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string, company: string): Promise<boolean> => {
    try {
      const response = await api.register(email, password, name, company);
      setUser(response.user);
      // Store user data in localStorage for session persistence
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🔓 Logout called');
    console.log('Current user before logout:', user?.email);
    console.log('Clearing user state and localStorage...');
    
    // Clear localStorage FIRST, before anything else
    localStorage.removeItem('currentUser');
    clearAuthToken();
    
    // Then clear state
    setUser(null);
    
    console.log('✅ Logout complete');
    console.log('User after logout:', null);
    console.log('Token cleared:', !getAuthToken());
    console.log('localStorage cleared:', !localStorage.getItem('currentUser'));
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Refreshing user data for:', user.email);
      const updatedUser = await api.getUser(user.email);
      setUser(updatedUser);
      // Update localStorage with fresh user data
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      console.log('✅ User data refreshed and saved to localStorage');
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isAdmin: user?.role === "admin", loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
