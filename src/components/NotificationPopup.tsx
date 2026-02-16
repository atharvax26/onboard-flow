import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Bell, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: "team_added" | "team_removed" | "info";
  title: string;
  message: string;
  teamId?: string;
  teamName?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationPopup() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [showNewNotification, setShowNewNotification] = useState(false);

  useEffect(() => {
    if (!user || user.role === "admin") return;

    loadNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const data = await api.getNotifications(user.email);
      const previousUnreadCount = notifications.filter(n => !n.read).length;
      const newUnreadCount = data.filter((n: Notification) => !n.read).length;
      
      // Show popup if there are new unread notifications
      if (newUnreadCount > previousUnreadCount) {
        setShowNewNotification(true);
        setTimeout(() => setShowNewNotification(false), 5000);
      }
      
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await api.markNotificationRead(user.email, notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const clearAll = async () => {
    if (!user) return;
    
    try {
      await api.clearNotifications(user.email);
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user || user.role === "admin") return null;

  return (
    <>
      {/* Floating notification popup */}
      {showNewNotification && unreadCount > 0 && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">New Notification</p>
                <p className="text-xs opacity-90 mt-1">
                  {notifications.find(n => !n.read)?.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
                onClick={() => setShowNewNotification(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notification bell icon */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={clearAll}
              >
                Clear All
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {notification.type === "team_added" && (
                          <Users className="w-4 h-4 text-primary" />
                        )}
                        {notification.type === "team_removed" && (
                          <Users className="w-4 h-4 text-muted-foreground" />
                        )}
                        {notification.type === "info" && (
                          <Bell className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
