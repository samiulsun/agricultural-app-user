// import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   User as FirebaseUser,
//   updateProfile
// } from 'firebase/auth';
// import { auth } from '../config/firebase';

// type User = {
//   id: string;
//   name: string;
//   email: string;
// };

// type AuthContextType = {
//   user: User | null;
//   login: (email: string, password: string) => Promise<void>;
//   register: (email: string, password: string, name: string) => Promise<void>;
//   logout: () => Promise<void>;
//   loading: boolean;
//   authInitialized: boolean;
// };

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [authInitialized, setAuthInitialized] = useState(false);

//   // Handle auth state changes
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
//       if (firebaseUser) {
//         setUser({
//           id: firebaseUser.uid,
//           name: firebaseUser.displayName || '',
//           email: firebaseUser.email || ''
//         });
//       } else {
//         setUser(null);
//       }
//       setAuthInitialized(true);
//     });

//     return () => unsubscribe();
//   }, []);

//   const login = async (email: string, password: string) => {
//     setLoading(true);
//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//     } catch (error: any) {
//       let errorMessage = 'Login failed. Please try again.';
//       switch (error.code) {
//         case 'auth/user-not-found':
//           errorMessage = 'User not found. Please register.';
//           break;
//         case 'auth/wrong-password':
//           errorMessage = 'Incorrect password.';
//           break;
//         case 'auth/invalid-email':
//           errorMessage = 'Invalid email format.';
//           break;
//       }
//       throw new Error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (email: string, password: string, name: string) => {
//     setLoading(true);
//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       await updateProfile(userCredential.user, { displayName: name });
//       setUser({
//         id: userCredential.user.uid,
//         name,
//         email
//       });
//     } catch (error: any) {
//       let errorMessage = 'Registration failed. Please try again.';
//       switch (error.code) {
//         case 'auth/email-already-in-use':
//           errorMessage = 'Email already in use.';
//           break;
//         case 'auth/weak-password':
//           errorMessage = 'Password should be at least 6 characters.';
//           break;
//         case 'auth/invalid-email':
//           errorMessage = 'Invalid email format.';
//           break;
//       }
//       throw new Error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     setLoading(true);
//     try {
//       await signOut(auth);
//       setUser(null);
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw new Error('Logout failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         login,
//         register,
//         logout,
//         loading,
//         authInitialized
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
import {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	User as FirebaseUser,
	updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

type User = {
	id: string;
	name: string;
	email: string;
};

type AuthContextType = {
	user: User | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, name: string) => Promise<void>;
	logout: () => Promise<void>;
	loading: boolean;
	authInitialized: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);
	const [authInitialized, setAuthInitialized] = useState(false);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(
			auth,
			async (firebaseUser: FirebaseUser | null) => {
				if (firebaseUser) {
					const currentUser: User = {
						id: firebaseUser.uid,
						name: firebaseUser.displayName || '',
						email: firebaseUser.email || '',
					};
					setUser(currentUser);
					await AsyncStorage.setItem('user', JSON.stringify(currentUser));
				} else {
					setUser(null);
					await AsyncStorage.removeItem('user');
				}
				setAuthInitialized(true);
			}
		);

		const loadUserFromStorage = async () => {
			const storedUser = await AsyncStorage.getItem('user');
			if (storedUser) {
				setUser(JSON.parse(storedUser));
			}
			setAuthInitialized(true);
		};

		loadUserFromStorage();
		return () => unsubscribe();
	}, []);

	const login = async (email: string, password: string) => {
		setLoading(true);
		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			const { user } = userCredential;
			const loggedInUser: User = {
				id: user.uid,
				name: user.displayName || '',
				email: user.email || '',
			};
			setUser(loggedInUser);
			await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
		} catch (error: any) {
			let errorMessage = 'Login failed. Please try again.';
			switch (error.code) {
				case 'auth/user-not-found':
					errorMessage = 'User not found. Please register.';
					break;
				case 'auth/wrong-password':
					errorMessage = 'Incorrect password.';
					break;
				case 'auth/invalid-email':
					errorMessage = 'Invalid email format.';
					break;
			}
			throw new Error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const register = async (email: string, password: string, name: string) => {
		setLoading(true);
		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			await updateProfile(userCredential.user, { displayName: name });
			const newUser: User = {
				id: userCredential.user.uid,
				name,
				email,
			};
			setUser(newUser);
			await AsyncStorage.setItem('user', JSON.stringify(newUser));
		} catch (error: any) {
			let errorMessage = 'Registration failed. Please try again.';
			switch (error.code) {
				case 'auth/email-already-in-use':
					errorMessage = 'Email already in use.';
					break;
				case 'auth/weak-password':
					errorMessage = 'Password should be at least 6 characters.';
					break;
				case 'auth/invalid-email':
					errorMessage = 'Invalid email format.';
					break;
			}
			throw new Error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		setLoading(true);
		try {
			await signOut(auth);
			await AsyncStorage.removeItem('user');
			setUser(null);
		} catch (error) {
			console.error('Logout error:', error);
			throw new Error('Logout failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{ user, login, register, logout, loading, authInitialized }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
