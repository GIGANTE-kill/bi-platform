"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar";
import { useState } from "react";

export function Header() {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 md:px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center gap-2 md:gap-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-border/50">
                        <SidebarNav onClick={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
                <h2 className="text-lg font-semibold tracking-tight truncate">System Overview</h2>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <Button variant="outline" size="icon" className="relative group">
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                    </span>
                    <span className="sr-only">Notificações</span>
                </Button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border">
                    <span className="text-xs font-medium">MC</span>
                </div>
            </div>
        </header>
    );
}
