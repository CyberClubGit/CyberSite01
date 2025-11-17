"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { app } from "@/firebase/config";
import { User } from "lucide-react";

const provider = new GoogleAuthProvider();

export function AuthComponent() {
  const auth = getAuth(app);
  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <User className="mr-2 h-4 w-4" />
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to SheetSurfer</DialogTitle>
          <DialogDescription>
            Access your dashboard and manage your sheets.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={signIn}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
