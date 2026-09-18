import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export function CreatorInfo() {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="View creator info — Abhijithkumar N, UI/UX Designer and Design Engineer"
            className="rounded-full bg-background/50 backdrop-blur-md border-white/20 hover:bg-background/80 transition-all shadow-lg text-foreground w-12 h-12"
          >
            <User className="w-5 h-5" aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-background/90 backdrop-blur-xl border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Abhijithkumar N</DialogTitle>
            <DialogDescription className="text-foreground/80 font-medium">
              UI/UX Designer · Product Designer · Design Engineer
            </DialogDescription>
          </DialogHeader>

          <address className="flex flex-col gap-4 py-4 mt-2 not-italic">
            <div className="flex flex-col space-y-3">
              <a
                href="https://abhijithkumar3.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abhijithkumar N — Portfolio: abhijithkumar3.vercel.app"
                className="flex items-center gap-2 hover:text-primary transition-colors p-2 rounded-md hover:bg-white/5"
              >
                <span className="font-semibold w-24">Portfolio:</span>
                <span className="text-foreground/70">abhijithkumar3.vercel.app</span>
              </a>

              <a
                href="https://linkedin.com/in/abhijithkumar3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abhijithkumar N — LinkedIn profile"
                className="flex items-center gap-2 hover:text-primary transition-colors p-2 rounded-md hover:bg-white/5"
              >
                <span className="font-semibold w-24">LinkedIn:</span>
                <span className="text-foreground/70">linkedin.com/in/abhijithkumar3</span>
              </a>

              <a
                href="https://github.com/abhijithkumar3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abhijithkumar N — GitHub profile"
                className="flex items-center gap-2 hover:text-primary transition-colors p-2 rounded-md hover:bg-white/5"
              >
                <span className="font-semibold w-24">GitHub:</span>
                <span className="text-foreground/70">github.com/abhijithkumar3</span>
              </a>

              <a
                href="https://medium.com/@abhijithkumar3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abhijithkumar N — Medium profile"
                className="flex items-center gap-2 hover:text-primary transition-colors p-2 rounded-md hover:bg-white/5"
              >
                <span className="font-semibold w-24">Medium:</span>
                <span className="text-foreground/70">medium.com/@abhijithkumar3</span>
              </a>
            </div>
          </address>
        </DialogContent>
      </Dialog>
    </div>
  );
}
