"use client"

import { useState } from "react";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "register">("login");
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleSubmit() {
        setError("");

        if (mode === "register") {
            const res = await fetch("/api/register", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Something went wrong");
                return;
            }
        }

        const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            setError("Invalid email or password");
        } else {
            router.push("/");
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full space-y-6">
                <h1 className="text-2xl font-bold text-center">
                    {mode === "login" ? "Login" : "Register"}
                </h1>

                {error && <p className="text-red-500 text-center">{error}</p>}

                <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                />

                <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                    {mode === "login" ? "Login" : "Register"}
                </button>

                <button
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="w-full text-sm text-gray-600"
                >
                    {mode === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
                </button>
            </div>
        </main>
    );
}

