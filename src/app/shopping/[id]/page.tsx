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
import { formatNPR } from "@/lib/utils";
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

  // Comments
  const [comments, setComments] = useState<EquipmentComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Private message
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-brand-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/shopping" className="flex items-center gap-2 text-brand-primary hover:underline mb-8">
            <ChevronLeft className="w-4 h-4" />Back to Shopping
          </Link>
          <div className="bg-white rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Item not found</h1>
            <p className="text-gray-600 mb-6">The equipment listing you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/shopping" className="inline-block px-6 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90">
              Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = listing.imageUrls?.length ? listing.imageUrls : [listing.thumbnailUrl];
  const conditionColor: Record<string, string> = {
    new: "bg-green-100 text-green-800",
    "like-new": "bg-blue-100 text-blue-800",
    used: "bg-yellow-100 text-yellow-800",
    refurbished: "bg-purple-100 text-purple-800",
  };
  const isSeller = user?.uid === listing.sellerId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/shopping" className="flex items-center gap-2 text-brand-primary hover:underline mb-6 text-sm">
          <ChevronLeft className="w-4 h-4" />Back to Shopping
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm mb-4">
              <Image src={images[currentImageIndex]} alt={listing.title} fill className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw" priority />
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur hover:bg-white rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur hover:bg-white rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${idx === currentImageIndex ? "border-brand-primary" : "border-gray-200"}`}>
                    <Image src={img} alt={`${listing.title} ${idx + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="inline-block mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${conditionColor[listing.condition] || "bg-gray-100 text-gray-800"}`}>
                {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            {(listing.brand || listing.model) && (
              <p className="text-gray-600 mb-6">{listing.brand}{listing.model && ` • ${listing.model}`}</p>
            )}
            <div className="mb-6 pb-6 border-b">
              <p className="text-4xl font-bold text-brand-primary">NPR {formatNPR(listing.priceNPR)}</p>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>
            {(listing.yearPurchased || listing.location) && (
              <div className="mb-6 p-4 bg-white rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
                <div className="space-y-2 text-sm">
                  {listing.yearPurchased && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year Purchased:</span>
                      <span className="font-medium text-gray-900">{listing.yearPurchased}</span>
                    </div>
                  )}
                  {listing.location && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" />Location:</span>
                      <span className="font-medium text-gray-900">{listing.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {listing.tags && listing.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2"><Tag className="w-4 h-4" />Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-3">
              {!isSeller && (
                <button
                  onClick={() => { if (!user) { window.location.href = "/login"; return; } setShowMsgModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-primary text-white py-3 rounded-lg font-semibold hover:bg-brand-primary/90 transition-colors"
                >
                  <Lock className="w-4 h-4" />Private Message
                </button>
              )}
              <button onClick={() => setLiked(!liked)} className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {(listing.sellerEmail || listing.sellerPhone) && (
              <div className="flex gap-4">
                {listing.sellerEmail && (
                  <a href={`mailto:${listing.sellerEmail}`} className="flex items-center gap-2 text-sm text-brand-primary hover:underline">
                    <Mail className="w-4 h-4" />Email Seller
                  </a>
                )}
                {listing.sellerPhone && (
                  <a href={`tel:${listing.sellerPhone}`} className="flex items-center gap-2 text-sm text-brand-primary hover:underline">
                    <Phone className="w-4 h-4" />Call Seller
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Seller Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h2>
          <div className="flex items-center gap-4">
            {listing.sellerAvatar && (
              <Image src={listing.sellerAvatar} alt={listing.sellerName} width={80} height={80}
                className="w-20 h-20 rounded-full object-cover" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {listing.sellerName}
                {listing.isVerified && <Check className="w-5 h-5 text-green-600" />}
              </h3>
              <p className="text-gray-600">{listing.salesCount} successful sales</p>
            </div>
          </div>
        </div>

        {/* ── Comments Section ── */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-brand-primary" />
            Comments
            {comments.length > 0 && (
              <span className="ml-1 text-sm font-normal text-gray-500">({comments.length})</span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mb-5">Ask questions about this listing — visible to everyone.</p>

          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl mb-5">
              <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No comments yet. Be the first to ask!</p>
            </div>
          ) : (
            <div className="space-y-4 mb-5">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-sm">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{comment.userName}</span>
                      <span className="text-xs text-gray-400">{formatCommentDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {(profile?.avatarUrl || user.photoURL) ? (
                  <img src={profile?.avatarUrl || user.photoURL || ""} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-sm">
                    {(profile?.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                  placeholder="Write a comment or ask a question…" rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none" />
                <div className="flex justify-end mt-2">
                  <button onClick={handleAddComment} disabled={commentSubmitting || !commentText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                    {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-500">
                <Link href="/login" className="text-brand-primary font-semibold hover:underline">Log in</Link>{" "}to leave a comment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Private Message Modal ── */}
      {showMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-primary" />Private Message
                </h3>
                <p className="text-sm text-gray-500">
                  To: <span className="font-medium text-gray-700">{listing.sellerName}</span>
                  {" · "}<span className="text-gray-400 truncate">{listing.title}</span>
                </p>
              </div>
              <button onClick={() => { setShowMsgModal(false); setMsgText(""); setMsgSent(false); }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {msgSent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">Message Sent!</p>
                <p className="text-sm text-gray-500 mt-1">{listing.sellerName} will be notified.</p>
              </div>
            ) : (
              <>
                <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)}
                  placeholder={`Hi ${listing.sellerName}, I'm interested in your ${listing.title}…`}
                  rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none mb-4" />
                <div className="flex gap-3">
                  <button onClick={() => { setShowMsgModal(false); setMsgText(""); }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSendPrivateMessage} disabled={msgSubmitting || !msgText.trim()}
                    className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
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
