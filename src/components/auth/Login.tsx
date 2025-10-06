"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🔐 [FRONTEND] Starting login process...');
    console.log('📧 [FRONTEND] Email:', email);
    console.log('🔑 [FRONTEND] Password:', password.replace(/./g, '*'));

    try {
      console.log('📡 [FRONTEND] Calling authService.login()...');
      const response = await authService.login({ email, password });
      console.log('✅ [FRONTEND] authService.login() returned:', response);

      if (response) {
        console.log('🎉 [FRONTEND] Login successful!');
        console.log('👤 [FRONTEND] User:', response.user);
        console.log('🔑 [FRONTEND] Access token received:', response.access_token.substring(0, 20) + '...');

        toast({
          title: "Login successful",
          description: `Welcome ${response.user.full_name}!`,
        });

        console.log('🔄 [FRONTEND] Redirecting to /curriculum-management...');
        // Redirect to curriculum management
        window.location.href = "/curriculum-management";
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Login failed:', error);
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 [FRONTEND] Login process completed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Login to EduSys AI</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the curriculum management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800 font-medium">Test Credentials:</p>
            <p className="text-xs text-blue-600">Email: test@example.com</p>
            <p className="text-xs text-blue-600">Password: password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;