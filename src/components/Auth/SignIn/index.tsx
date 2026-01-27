"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/Common/Loader";

const Signin = () => {
  const router = useRouter();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const loginUser = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    signIn("credentials", { ...loginData, redirect: false })
      .then((callback) => {
        if (callback?.error) {
          toast.error(callback?.error);
          console.log(callback?.error);
          setLoading(false);
          return;
        }

        if (callback?.ok && !callback?.error) {
          toast.success("Login successful");
          setLoading(false);
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        setLoading(false);
        console.log(err.message);
        toast.error(err.message);
      });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Left Panel - Hidden on mobile */}
      <div className="relative hidden lg:flex h-screen w-full lg:w-1/2 flex-col bg-gradient-to-br from-zinc-900 via-slate-900 to-blue-900 p-10 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/90 via-slate-900/90 to-blue-900/90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIvPjxjaXJjbGUgY3g9IjIiIGN5PSIxOCIgcj0iMiIvPjxjaXJjbGUgY3g9IjIiIGN5PSIzNCIgcj0iMiIvPjxjaXJjbGUgY3g9IjIiIGN5PSI1MCIgcj0iMiIvPjxjaXJjbGUgY3g9IjE4IiBjeT0iMiIgcj0iMiIvPjxjaXJjbGUgY3g9IjE4IiBjeT0iMTgiIHI9IjIiLz48Y2lyY2xlIGN4PSIxOCIgY3k9IjM0IiByPSIyIi8+PGNpcmNsZSBjeD0iMTgiIGN5PSI1MCIgcj0iMiIvPjxjaXJjbGUgY3g9IjM0IiBjeT0iMiIgcj0iMiIvPjxjaXJjbGUgY3g9IjM0IiBjeT0iMTgiIHI9IjIiLz48Y2lyY2xlIGN4PSIzNCIgY3k9IjM0IiByPSIyIi8+PGNpcmNsZSBjeD0iMzQiIGN5PSI1MCIgcj0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMiIgcj0iMiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMTgiIHI9IjIiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM0IiByPSIyIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo/hydraalogo.jpg"
              alt="logo"
              width={140}
              height={30}
              className="mr-2 rounded-lg shadow-lg"
            />
          </Link>
        </div>
        
        <div className="relative z-20 mt-auto">
          <div className="relative">
            <div className="absolute -top-6 -left-6 text-6xl text-blue-300/30 font-serif">"</div>
            <blockquote className="space-y-4 relative">
              <p className="text-xl leading-relaxed font-light">
                This platform has revolutionized how we manage complaints and ensure accountability in our jurisdiction.
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">P</span>
                </div>
                <div>
                  <footer className="text-base font-medium text-white">Police Commissioner</footer>
                  <p className="text-sm text-blue-200">Law Enforcement Authority</p>
                </div>
              </div>
            </blockquote>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 min-h-screen w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md mx-auto flex flex-col justify-center space-y-8">
          {/* Mobile Logo - Show only on mobile */}
          <div className="flex lg:hidden justify-center mb-6">
            <Image
              src="/images/logo/hydraalogo.jpg"
              alt="logo"
              width={120}
              height={25}
              className="rounded-lg shadow-lg"
            />
          </div>
          
          <div className="flex flex-col space-y-3 text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Sign in to your account
            </h1>
            <p className="text-base text-gray-600">
              Enter your email and password below to sign in
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-bold">
                Sign in
              </CardTitle>
              <CardDescription className="text-center text-gray-600 text-base">
                Enter your email and password to sign in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              <form onSubmit={loginUser} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader />
                      <span className="ml-2">Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Sign In</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm mt-6">
                <Link
                  href="/forgot-password"
                  className="text-blue-600 hover:text-blue-800 underline underline-offset-4 hover:underline-offset-2 transition-all duration-200 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signin;
