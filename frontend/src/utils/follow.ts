import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  increment,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === 'guest' || followerId === 'demo-user-123' || followingId === 'demo-user-123') return false;
  try {
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) return;
  const q = query(
    collection(db, 'follows'),
    where('followerId', '==', followerId),
    where('followingId', '==', followingId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return;

  const followRef = doc(collection(db, 'follows'));
  await setDoc(followRef, {
    id: followRef.id,
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'users', followerId), {
    followingCount: increment(1),
  });
  await updateDoc(doc(db, 'users', followingId), {
    followersCount: increment(1),
  });
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const q = query(
    collection(db, 'follows'),
    where('followerId', '==', followerId),
    where('followingId', '==', followingId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }

  await updateDoc(doc(db, 'users', followerId), {
    followingCount: increment(-1),
  });
  await updateDoc(doc(db, 'users', followingId), {
    followersCount: increment(-1),
  });
}

export async function getFollowersCount(userId: string): Promise<number> {
  if (userId === 'demo-user-123') {
    const saved = localStorage.getItem('demo_followers_count');
    return saved ? Number(saved) : 0;
  }
  try {
    const q = query(collection(db, 'follows'), where('followingId', '==', userId));
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return (userDoc.data() as any).followersCount || 0;
    }
    return 0;
  }
}

export async function getFollowingCount(userId: string): Promise<number> {
  if (userId === 'demo-user-123') {
    const saved = localStorage.getItem('demo_following_count');
    return saved ? Number(saved) : 0;
  }
  try {
    const q = query(collection(db, 'follows'), where('followerId', '==', userId));
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return (userDoc.data() as any).followingCount || 0;
    }
    return 0;
  }
}
