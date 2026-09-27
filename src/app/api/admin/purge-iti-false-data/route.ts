import { NextResponse } from 'next/server';
import { collection, getDocs, doc, deleteDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export async function GET() {
  return handlePurge();
}

export async function POST() {
  return handlePurge();
}

async function handlePurge() {
  try {
    const deletedDocs: string[] = [];
    const postsCol = collection(db, 'posts');
    const snap = await getDocs(postsCol);

    for (const d of snap.docs) {
      const data = d.data();
      const isItiDoc = 
        d.id.includes('iti') ||
        d.id.includes('training-officer') ||
        data.slug?.includes('iti') ||
        (data.title && (data.title.toLowerCase().includes('iti training officer') || data.title.includes('ट्रेनिंग ऑफिसर')));

      if (isItiDoc) {
        await deleteDoc(d.ref);
        deletedDocs.push(d.id);
      }
    }

    // Direct deletion of known IDs
    const knownIds = [
      'mp-iti-training-officer-to-2026',
      'mp-iti-training-officer-to',
      'job-5'
    ];

    for (const kId of knownIds) {
      try {
        await deleteDoc(doc(db, 'posts', kId));
        if (!deletedDocs.includes(kId)) deletedDocs.push(kId);
      } catch {}
    }

    // Write persistent tombstones
    const tombstoneRef = doc(db, 'settings', 'tombstones');
    await setDoc(
      tombstoneRef,
      {
        deletedIds: arrayUnion(...deletedDocs, ...knownIds),
        updatedAt: Date.now()
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully purged ${deletedDocs.length} false ITI post(s) from database.`,
      purgedCount: deletedDocs.length,
      deletedDocs
    });
  } catch (err: unknown) {
    console.error('Purge error:', err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
