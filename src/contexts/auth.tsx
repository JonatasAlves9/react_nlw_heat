import { createContext, useEffect, useState } from "react";
import { api } from "../services/api";

type AuthResponse = {
    token: string;
    user: {
        id: string,
        avatar_url: string,
        name: string,
        login: string,
    }
}

type User = {
    id: string;
    name: string;
    login: string;
    avatar_url: string;
}

type AuthContextData = {
    user: User | null;
    signInUrl: string;
    signOut: () => void;
}


type AuthProviderProps = {
    children: React.ReactNode
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);

    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=8f9d1ba952e2a751fb87`;

    async function signIn(githubCode: string) {
        const response = await api.post<AuthResponse>('/authenticate', {
            code: githubCode,
        })

        const { token, user } = response.data;

        localStorage.setItem('@dowhile:token', token);

        api.defaults.headers.common.authorization = `Bearer ${token}`;

        setUser(user);
    }

    function signOut() {
        setUser(null);
        localStorage.removeItem('@dowhile:token');
    }

    useEffect(() => {
        const token = localStorage.getItem('@dowhile:token');

        if (token) {
            api.defaults.headers.common.authorization = `Bearer ${token}`;

            const getProfile = async () => {
                await api.get<User>('profile').then(response => {
                    setUser(response.data);
                })
            }
            getProfile()

        }
    }, [])

    useEffect(() => {
        const url = window.location.href;
        const hasGithubCode = url.includes('?code=');

        if (hasGithubCode) {
            const [urlWithoutCode, githubCode] = url.split('?code=')

            window.history.pushState({}, '', urlWithoutCode);

            signIn(githubCode);
        }

    }, []);
    return (
        <AuthContext.Provider value={{ signInUrl, user, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

