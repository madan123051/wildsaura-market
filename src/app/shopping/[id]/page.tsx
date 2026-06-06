"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Heart,
  Share2,
  MapPin,
  Phone,
  Mail,
  Tag,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
  X,
  Loader2,
  Lock,
  BadgeCheck,
  ShoppingBag,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { EquipmentListing } from "@/types";

interface EquipmentComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

function EquipmentDetailPage() {
  const params = useParams();
  const equipmentId = params.id as string;
  const { user, profile } = useAuth();

  const [listing, setListing] = useState<EquipmentListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);

  const [comments, setComments] = useState<EquipmentComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSubmitting, setMsgSubmitting] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, "equipmentListings", equipmentId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setListing({
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: snapshot.data().createdAt?.toDate() || new Date(),
            updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
          } as EquipmentListing);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };
    if (equipmentId) fetchListing();
  }, [equipmentId]);

  useEffect(() => {
    if (!equipmentId) return;
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const q = query(
          collection(db, "equipmentComments"),
          where("listingId", "==", equipmentId),
          orderBy("createdAt", "asc")
        );
        const snap = await getDocs(q);
        setComments(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<EquipmentComment, "id">),
            createdAt: d.data().createdAt?.toDate?.() || new Date(),
          }))
        );
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [equipmentId]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;
    setCommentSubmitting(true);
    try {
      const newComment = {
        listingId: equipmentId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || user.email || "User",
        userAvatar: profile?.avatarUrl || user.photoURL || "",
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "equipmentComments"), newComment);
      setComments((prev) => [...prev, { id: docRef.id, ...newComment, createdAt: new Date() }]);
      setCommentText("");
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSendPrivateMessage = async () => {
    if (!msgText.trim() || !user || !listing) return;
    setMsgSubmitting(true);
    try {
      await addDoc(collection(db, "equipmentMessages"), {
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName || user.email || "User",
        senderAvatar: profile?.avatarUrl || user.photoURL || "",
        receiverId: listing.sellerId,
        listingId: equipmentId,
        listingTitle: listing.title,
        text: msgText.trim(),
        read: false,
        createdAt: serverTimestamp(),
      });
      setMsgSent(true);
      setMsgText("");
      setTimeout(() => { setShowMsgModal(false); setMsgSent(false); }, 2500);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setMsgSubmitting(false);
    }
  };

  const formatCommentDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const formatPrice = (price: number) =>
    "₹" + price.toLocaleString("en-IN");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading listing…</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/shopping" className="flex items-center gap-2 text-violet-400 hover:text-violet-300 mb-8 text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to Shopping
          </Link>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Item not found</h1>
            <p className="text-white/50 mb-6">This equipment listing doesn&apos;t exist or has been removed.</p>
            <Link href="/shopping" className="inline-block px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
              Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = listing.imageUrls?.length ? listing.imageUrls : [listing.thumbnailUrl];

  const conditionConfig: Record<string, { label: string; classes: string }> = {
    new:        { label: "New",       classes: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" },
    "like-new": { label: "Like New",  classes: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" },
    used:       { label: "Used",      classes: "bg-blue-500/15 text-blue-400 border border-blue-500/30" },
    refurbished:{ label: "Refurbished", classes: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
    fair:       { label: "Fair",      classes: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
  };
  const cond = conditionConfig[listing.condition] ?? { label: listing.condition, classes: "bg-white/10 text-white/60 border border-white/20" };
  const isSeller = user?.uid === listing.sellerId;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Subtle top gradient bar */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link href="/shopping" className="inline-flex items-center gap-2 text-white/50 hover:text-violet-400 mb-8 text-sm transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Shopping
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          {/* ── Images ── */}
          <div>
            <div className="relative aspect-[4/3] bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-3">
              <Image
                src={images[currentImageIndex]}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(i => (i === 0 ? images.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur hover:bg-black/70 rounded-full transition-colors border border-white/10"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(i => (i === images.length - 1 ? 0 : i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur hover:bg-black/70 rounded-full transition-colors border border-white/10"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur rounded-full text-xs text-white/70">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex
                        ? "border-violet-500 ring-1 ring-violet-500/40"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="flex flex-col">
            {/* Condition badge */}
            <div className="mb-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cond.classes}`}>
                {cond.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{listing.title}</h1>
            {(listing.brand || listing.model) && (
              <p className="text-white/50 text-sm mb-5">
                {listing.brand}{listing.model && ` · ${listing.model}`}
              </p>
            )}

            {/* Price */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {formatPrice(listing.priceNPR)}
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">Description</h2>
              <p className="text-white/80 leading-relaxed text-sm">{listing.description}</p>
            </div>

            {/* Details card */}
            {(listing.yearPurchased || listing.location) && (
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Details</h2>
                <div className="space-y-2 text-sm">
                  {listing.yearPurchased && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Year Purchased</span>
                      <span className="font-medium text-white">{listing.yearPurchased}</span>
                    </div>
                  )}
                  {listing.location && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Location</span>
                      <span className="font-medium text-white">{listing.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-white/40 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto flex gap-3 mb-3">
              {!isSeller && (
                <button
                  onClick={() => { if (!user) { window.location.href = "/login"; return; } setShowMsgModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
                >
                  <Lock className="w-4 h-4" />Private Message
                </button>
              )}
              <button
                onClick={() => setLiked(!liked)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Heart className={`w-5 h-5 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-white/50"}`} />
              </button>
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <Share2 className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {(listing.sellerEmail || listing.sellerPhone) && (
              <div className="flex gap-4">
                {listing.sellerEmail && (
                  <a href={`mailto:${listing.sellerEmail}`} className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    <Mail className="w-4 h-4" />Email Seller
                  </a>
                )}
                {listing.sellerPhone && (
                  <a href={`tel:${listing.sellerPhone}`} className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    <Phone className="w-4 h-4" />Call Seller
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Seller Info ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Seller</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 flex-shrink-0 flex items-center justify-center text-white text-xl font-bold">
              {listing.sellerAvatar ? (
                <img src={listing.sellerAvatar} alt={listing.sellerName} className="w-full h-full object-cover" />
              ) : (
                listing.sellerName?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                {listing.sellerName}
                {listing.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3 h-3" />Verified
                  </span>
                )}
              </h3>
              {listing.salesCount > 0 && (
                <p className="text-sm text-white/40 flex items-center gap-1 mt-0.5">
                  <ShoppingBag className="w-3.5 h-3.5" />{listing.salesCount} successful sales
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Comments Section ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-violet-400" />
            Comments
            {comments.length > 0 && (
              <span className="ml-1 text-sm font-normal text-white/30">({comments.length})</span>
            )}
          </h2>
          <p className="text-sm text-white/30 mb-6">Ask questions about this listing — visible to everyone.</p>

          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl mb-5">
              <MessageCircle className="w-10 h-10 text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No comments yet. Be the first to ask!</p>
            </div>
          ) : (
            <div className="space-y-4 mb-5">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-semibold">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                    ) : (
                      comment.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{comment.userName}</span>
                      <span className="text-xs text-white/30">{formatCommentDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-white/70">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-semibold">
                {(profile?.avatarUrl || user.photoURL) ? (
                  <img src={profile?.avatarUrl || user.photoURL || ""} alt="You" className="w-full h-full object-cover" />
                ) : (
                  (profile?.displayName || user.email || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                  placeholder="Write a comment or ask a question…"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={commentSubmitting || !commentText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                  >
                    {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-white/40">
                <Link href="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">Log in</Link>{" "}to leave a comment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Private Message Modal ── */}
      {showMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6">
            {/* Top gradient line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent mb-6" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-400" />Private Message
                </h3>
                <p className="text-sm text-white/40 mt-0.5">
                  To: <span className="font-medium text-white/70">{listing.sellerName}</span>
                  {" · "}<span className="text-white/30 truncate">{listing.title}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowMsgModal(false); setMsgText(""); setMsgSent(false); }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {msgSent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="font-semibold text-white">Message Sent!</p>
                <p className="text-sm text-white/40 mt-1">{listing.sellerName} will be notified.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder={`Hi ${listing.sellerName}, I'm interested in your ${listing.title}…`}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowMsgModal(false); setMsgText(""); }}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendPrivateMessage}
                    disabled={msgSubmitting || !msgText.trim()}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                  >
                    {msgSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Message
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentDetailPage;
