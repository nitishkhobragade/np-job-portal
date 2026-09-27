import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export async function GET() {
  try {
    const tombstoneRef = doc(db, 'settings', 'tombstones');
    const snap = await getDoc(tombstoneRef);
    if (snap.exists()) {
      const data = snap.data();
      return NextResponse.json({ deletedIds: data?.deletedIds || [] });
    }
    return NextResponse.json({ deletedIds: [] });
  } catch {
    return NextResponse.json({ deletedIds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, slug } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required for deletion' },
        { status: 400 }
      );
    }

    const idsToDelete = new Set<string>();
    idsToDelete.add(id);
    if (slug) idsToDelete.add(slug);

    // Delete direct doc references
    for (const docId of idsToDelete) {
      try {
        const docRef = doc(db, 'posts', docId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn(`Could not delete doc direct ID ${docId}:`, err);
      }
    }

    // Query collection to delete any docs with matching slug or id
    try {
      const postsCol = collection(db, 'posts');
      const qSlug = query(postsCol, where('slug', '==', id));
      const snapSlug = await getDocs(qSlug);
      for (const d of snapSlug.docs) {
        await deleteDoc(d.ref);
      }

      if (slug && slug !== id) {
        const qSlug2 = query(postsCol, where('slug', '==', slug));
        const snapSlug2 = await getDocs(qSlug2);
        for (const d of snapSlug2.docs) {
          await deleteDoc(d.ref);
        }
      }
    } catch (queryErr) {
      console.warn('Error querying matching docs to delete:', queryErr);
    }

    // Write persistent tombstone so deleted posts can never be resurrected
    try {
      const tombstoneRef = doc(db, 'settings', 'tombstones');
      const tombstonePayload: Record<string, unknown> = {
        deletedIds: arrayUnion(id, ...(slug ? [slug] : [])),
        updatedAt: Date.now()
      };
      await setDoc(tombstoneRef, tombstonePayload, { merge: true });
    } catch (tombErr) {
      console.warn('Error recording tombstone in Firestore:', tombErr);
    }

    return NextResponse.json({
      success: true,
      message: `Post ${id} permanently deleted from database.`,
      deletedId: id
    });
  } catch (error: unknown) {
    console.error('Delete job API error:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
