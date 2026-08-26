import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ExamForgePackage, ForumPackageDocument, PackageReport, PackageComment, ReportReason } from '../types';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

const EXAM_PACKAGES_COLLECTION = 'exam_packages';
const PACKAGE_REPORTS_COLLECTION = 'package_reports';
const PACKAGE_COMMENTS_COLLECTION = 'package_comments';


/**
 * Real-time listener for all forum packages
 */
export function subscribeToExamPackages(
  onData: (packages: ForumPackageDocument[]) => void,
  onError: (error: Error) => void
) {
  try {
    const q = query(
      collection(db, EXAM_PACKAGES_COLLECTION),
      orderBy('postedAt', 'desc'),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const packages: ForumPackageDocument[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          packages.push({
            ...(data as any),
            id: docSnap.id,
            likeCount: data.likeCount ?? 0,
            downloadCount: data.downloadCount ?? 0,
            postedByUsername: data.postedByUsername || 'Anonymous',
            postedAt: data.postedAt || Date.now(),
          });
        });
        onData(packages);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        onError(error);
      }
    );
  } catch (err: any) {
    console.error('Firestore query setup error:', err);
    onError(err);
    return () => {};
  }
}

/**
 * Creates a new package document in Firestore
 */
export async function uploadPackageToFirestore(
  pkg: ExamForgePackage,
  username: string
): Promise<string> {
  const docId = pkg.packageId || `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, EXAM_PACKAGES_COLLECTION, docId);

  const forumDoc: Omit<ForumPackageDocument, 'id'> = {
    ...pkg,
    packageId: docId,
    likeCount: 0,
    downloadCount: 0,
    postedByUsername: username.trim() || 'Anonymous',
    postedAt: Date.now(),
  };

  await setDoc(docRef, forumDoc);
  return docId;
}

/**
 * Increments like count on a package
 */
export async function toggleLikeInFirestore(
  packageId: string,
  isLiked: boolean
): Promise<void> {
  const docRef = doc(db, EXAM_PACKAGES_COLLECTION, packageId);
  await updateDoc(docRef, {
    likeCount: increment(isLiked ? 1 : -1),
  });
}

/**
 * Increments download count on a package
 */
export async function trackDownloadInFirestore(packageId: string): Promise<void> {
  try {
    const docRef = doc(db, EXAM_PACKAGES_COLLECTION, packageId);
    await updateDoc(docRef, {
      downloadCount: increment(1),
    });
  } catch (err) {
    console.warn('Failed to increment download count in firestore:', err);
  }
}

/**
 * Deletes a package document from Firestore (Admin/User moderation)
 */
export async function deletePackageFromFirestore(packageId: string): Promise<void> {
  const docRef = doc(db, EXAM_PACKAGES_COLLECTION, packageId);
  await deleteDoc(docRef);
}

/**
 * Submits a report flagging inappropriate content or broken links on a package
 */
export async function submitPackageReport(
  reportData: Omit<PackageReport, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const docRef = doc(collection(db, PACKAGE_REPORTS_COLLECTION));
  const newReport: Omit<PackageReport, 'id'> = {
    ...reportData,
    createdAt: Date.now(),
    status: 'pending',
  };
  await setDoc(docRef, newReport);
  return docRef.id;
}

/**
 * Real-time listener for package reports (for Moderator Console)
 */
export function subscribeToPackageReports(
  onData: (reports: PackageReport[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(
      collection(db, PACKAGE_REPORTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const reports: PackageReport[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          reports.push({
            id: docSnap.id,
            packageId: data.packageId || '',
            packageTitle: data.packageTitle || 'Untitled Package',
            author: data.author || 'Unknown',
            category: data.category || 'General',
            reason: data.reason || 'other',
            reasonLabel: data.reasonLabel || 'Flagged',
            details: data.details || '',
            reportedBy: data.reportedBy || 'Anonymous',
            createdAt: data.createdAt || Date.now(),
            status: data.status || 'pending',
            resolvedAt: data.resolvedAt,
            resolvedBy: data.resolvedBy,
          });
        });
        onData(reports);
      },
      (error) => {
        console.error('Firestore reports subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error('Firestore reports query setup error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Updates a report status (e.g., dismissed, resolved)
 */
export async function updateReportStatus(
  reportId: string,
  status: 'pending' | 'resolved' | 'dismissed',
  moderatorUsername?: string
): Promise<void> {
  const docRef = doc(db, PACKAGE_REPORTS_COLLECTION, reportId);
  await updateDoc(docRef, {
    status,
    resolvedAt: Date.now(),
    resolvedBy: moderatorUsername || 'Moderator',
  });
}

/**
 * Deletes a report from Firestore
 */
export async function deletePackageReport(reportId: string): Promise<void> {
  const docRef = doc(db, PACKAGE_REPORTS_COLLECTION, reportId);
  await deleteDoc(docRef);
}

/**
 * Subscribes to real-time comments for a specific package
 */
export function subscribeToPackageComments(
  packageId: string,
  onData: (comments: PackageComment[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(
      collection(db, PACKAGE_COMMENTS_COLLECTION),
      where('packageId', '==', packageId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const comments: PackageComment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          comments.push({
            id: docSnap.id,
            packageId: data.packageId,
            username: data.username || 'Anonymous',
            content: data.content || '',
            createdAt: data.createdAt || Date.now(),
            likeCount: data.likeCount || 0,
          });
        });
        // Sort newest first client-side
        comments.sort((a, b) => b.createdAt - a.createdAt);
        onData(comments);
      },
      (error) => {
        console.error('Firestore comments subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error('Firestore comments query setup error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Adds a new comment to an exam package
 */
export async function addPackageComment(
  packageId: string,
  username: string,
  content: string
): Promise<string> {
  const docRef = doc(collection(db, PACKAGE_COMMENTS_COLLECTION));
  const newComment: Omit<PackageComment, 'id'> = {
    packageId,
    username: username.trim() || 'Anonymous',
    content: content.trim(),
    createdAt: Date.now(),
    likeCount: 0,
  };
  await setDoc(docRef, newComment);
  return docRef.id;
}

/**
 * Deletes a comment from Firestore
 */
export async function deletePackageComment(commentId: string): Promise<void> {
  const docRef = doc(db, PACKAGE_COMMENTS_COLLECTION, commentId);
  await deleteDoc(docRef);
}

/**
 * Toggles like on a comment
 */
export async function toggleCommentLike(commentId: string, isLiked: boolean): Promise<void> {
  const docRef = doc(db, PACKAGE_COMMENTS_COLLECTION, commentId);
  await updateDoc(docRef, {
    likeCount: increment(isLiked ? 1 : -1),
  });
}

/**
 * Purges every single package from Firestore to ensure a completely clean slate catalog.
 */
export async function purgeAllPackagesFromFirestore(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, EXAM_PACKAGES_COLLECTION));
    let deletedCount = 0;
    const deletePromises = snapshot.docs.map(async (docSnap) => {
      await deleteDoc(docSnap.ref);
      deletedCount++;
    });
    await Promise.all(deletePromises);
    console.log(`Successfully purged ${deletedCount} packages from Firestore.`);
    return deletedCount;
  } catch (err) {
    console.error('Failed to purge packages from Firestore:', err);
    throw err;
  }
}


