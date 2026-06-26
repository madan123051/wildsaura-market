"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { collection, doc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  User,
  Mail,
  Globe,
  Camera,
  Save,
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProfileOrderItem {
  itemType?: "photo" | "equipment";
  title: string;
  thumbnailUrl?: string;
  priceNPR?: number;
  trackingStatus?: string;
}

interface ProfileOrder {
  id: string;
  items: ProfileOrderItem[];
  totalNPR: number;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  trackingStatus?: string;
  createdAt: Date;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setWebsite(profile.website || "");
      setInstagram(profile.socialLinks?.instagram || "");
      setTwitter(profile.socialLinks?.twitter || "");
      setFacebook(profile.socialLinks?.facebook || "");
      setAvatarPreview(profile.avatarUrl || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("buyerId", "==", user.uid),
          limit(5)
        );
        const snapshot = await getDocs(ordersQuery);
        const recentOrders = snapshot.docs
          .map((orderDoc) => {
            const data = orderDoc.data();
            return {
              id: orderDoc.id,
              items: Array.isArray(data.items) ? data.items : [],
              totalNPR: data.totalNPR || 0,
              status: data.status || "pending",
              paymentMethod: data.paymentMethod || "unknown",
              paymentStatus: data.paymentStatus,
              trackingStatus: data.trackingStatus,
              createdAt: data.createdAt?.toDate?.() || new Date(),
            } as ProfileOrder;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        if (active) setOrders(recentOrders);
      } catch (err) {
        console.error("Failed to load profile orders", err);
      } finally {
        if (active) setOrdersLoading(false);
      }
    };

    fetchOrders();
    return () => {
      active = false;
    };
  }, [user]);

  const orderStatus = (order: ProfileOrder) => {
    if (order.paymentStatus === "paid" || order.status === "completed") {
      return {
        label: order.trackingStatus === "delivered" ? "Delivered" : "Paid",
        icon: CheckCircle,
        className: "bg-emerald-50 text-emerald-700",
      };
    }

    if (order.paymentMethod === "cash_on_delivery") {
      return {
        label: "COD placed",
        icon: Clock,
        className: "bg-blue-50 text-blue-700",
      };
    }

    return {
      label: "Payment pending",
      icon: Clock,
      className: "bg-amber-50 text-amber-700",
    };
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    try {
      let avatarUrl = profile.avatarUrl;

      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, avatarFile);
        avatarUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName,
        bio,
        website,
        avatarUrl,
        socialLinks: { instagram, twitter, facebook },
      });

      await updateFirebaseProfile(user, { displayName, photoURL: avatarUrl });
      await refreshProfile();
      toast.success("Profile updated! 🎉");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="font-heading text-3xl font-bold text-brand-dark mb-2">
        Edit Profile
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Update your personal information and social links
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-brand-primary/10 flex-shrink-0">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar"
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-brand-primary/40" />
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <p className="font-medium text-brand-dark">{profile.displayName}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
            <p className="text-xs text-gray-400 mt-1">Max 2MB · JPG, PNG, WebP</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-brand-dark border-b border-surface-border pb-2">
            Basic Information
          </h2>
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            leftIcon={<User size={16} />}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about your photography…"
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 bg-surface-muted rounded-xl border border-surface-border text-sm text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/300</p>
          </div>
          <Input
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
            leftIcon={<Globe size={16} />}
          />
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-brand-dark border-b border-surface-border pb-2">
            Social Links
          </h2>
          <Input
            label="Instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@username"
          />
          <Input
            label="Twitter / X"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="@username"
          />
          <Input
            label="Facebook"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="facebook.com/username"
          />
        </div>

        {/* Account Info (read-only) */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-brand-dark border-b border-surface-border pb-2">
            Account Info
          </h2>
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-muted rounded-xl">
            <Mail size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-brand-dark">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-muted rounded-xl">
            <User size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm font-medium text-brand-dark capitalize">{profile.role}</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <h2 className="font-heading text-lg font-semibold text-brand-dark">
              Order Tracking
            </h2>
            <Link href="/dashboard?tab=purchases" className="text-sm font-medium text-brand-primary hover:underline">
              View all
            </Link>
          </div>

          {ordersLoading ? (
            <div className="flex items-center gap-3 rounded-xl bg-surface-muted px-4 py-4 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              Loading recent orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl bg-surface-muted px-4 py-5 text-sm text-gray-500">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-brand-primary" />
                <span>No orders yet. Bought equipment and photos will appear here.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const meta = orderStatus(order);
                const StatusIcon = meta.icon;
                const firstItem = order.items[0];

                return (
                  <Link
                    key={order.id}
                    href={`/dashboard?tab=purchases&order=${order.id}`}
                    className="flex items-center gap-4 rounded-xl border border-surface-border px-4 py-3 hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
                  >
                    <div className="relative h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                      {firstItem?.thumbnailUrl ? (
                        <Image
                          src={firstItem.thumbnailUrl}
                          alt={firstItem.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-dark">
                        {firstItem?.title || `Order #${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"} • Rs. {order.totalNPR}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            isLoading={saving}
            leftIcon={<Save size={16} />}
            size="lg"
            className="flex-1"
          >
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
