import {
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    User,
    UserCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from './config'

// User data interface
export interface UserData {
    uid: string
    email: string | null
    displayName: string | null
    photoURL: string | null
    createdAt?: Date
    lastLogin?: Date
    subscription?: 'free' | 'premium'
}

// Local storage keys
const STORAGE_KEYS = {
    USER: 'gatemate_user',
    TOKEN: 'gatemate_token',
    DEVICES: 'gatemate_devices'
}

/**
 * Firebase Authentication Service
 * Handles all authentication operations with persistent storage
 */
export class AuthService {

    /**
     * Save user data to localStorage for persistence
     */
    private static saveUserToStorage(user: User, token?: string): void {
        const userData: UserData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        }
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))

        if (token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, token)
        }
    }

    /**
     * Get stored user from localStorage
     */
    static getStoredUser(): UserData | null {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.USER)
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    }

    /**
     * Clear all stored auth data
     */
    private static clearStorage(): void {
        localStorage.removeItem(STORAGE_KEYS.USER)
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.DEVICES)
    }

    /**
     * Save user profile to Firestore
     */
    private static async saveUserToFirestore(user: User): Promise<void> {
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
            // Update last login
            await setDoc(userRef, {
                lastLogin: serverTimestamp()
            }, { merge: true })
        } else {
            // Create new user document
            await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                subscription: 'free'
            })
        }
    }

    /**
     * Login with email and password
     */
    static async loginWithEmail(email: string, password: string): Promise<UserCredential> {
        const result = await signInWithEmailAndPassword(auth, email, password)
        const token = await result.user.getIdToken()

        this.saveUserToStorage(result.user, token)
        await this.saveUserToFirestore(result.user)

        return result
    }

    /**
     * Login with Google
     */
    static async loginWithGoogle(): Promise<UserCredential> {
        const result = await signInWithPopup(auth, googleProvider)
        const token = await result.user.getIdToken()

        this.saveUserToStorage(result.user, token)
        await this.saveUserToFirestore(result.user)

        return result
    }

    /**
     * Register new user with email and password
     */
    static async register(
        email: string,
        password: string,
        displayName: string
    ): Promise<UserCredential> {
        const result = await createUserWithEmailAndPassword(auth, email, password)

        // Update profile with display name
        await updateProfile(result.user, { displayName })

        const token = await result.user.getIdToken()
        this.saveUserToStorage(result.user, token)
        await this.saveUserToFirestore(result.user)

        return result
    }

    /**
     * Sign out current user
     */
    static async logout(): Promise<void> {
        await signOut(auth)
        this.clearStorage()
    }

    /**
     * Send password reset email
     */
    static async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email)
    }

    /**
     * Get current Firebase user
     */
    static getCurrentUser(): User | null {
        return auth.currentUser
    }

    /**
     * Listen for auth state changes
     */
    static onAuthChange(callback: (user: User | null) => void): () => void {
        return onAuthStateChanged(auth, (user) => {
            if (user) {
                user.getIdToken().then(token => {
                    this.saveUserToStorage(user, token)
                })
            } else {
                this.clearStorage()
            }
            callback(user)
        })
    }

    /**
     * Check if user is logged in (from localStorage first, then Firebase)
     */
    static async checkAuth(): Promise<boolean> {
        // First check localStorage for quick response
        const storedUser = this.getStoredUser()
        if (!storedUser) return false

        // Then verify with Firebase
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe()
                resolve(!!user)
            })
        })
    }

    /**
     * Refresh auth token
     */
    static async refreshToken(): Promise<string | null> {
        const user = auth.currentUser
        if (!user) return null

        const token = await user.getIdToken(true)
        localStorage.setItem(STORAGE_KEYS.TOKEN, token)
        return token
    }

    /**
     * Get stored auth token
     */
    static getStoredToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.TOKEN)
    }
}

export default AuthService
