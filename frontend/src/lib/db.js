import {
  collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query,
  serverTimestamp, where, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';

const toIso = (ts) => (ts?.toDate ? ts.toDate().toISOString() : new Date().toISOString());
const STATUS_LABEL = { submitted: 'Submitted', in_review: 'In review', in_progress: 'In progress', resolved: 'Resolved' };

const mapReport = (snap) => {
  const d = snap.data({ serverTimestamps: 'estimate' });
  return {
    id: snap.id, userId: d.userId, title: d.title, description: d.description,
    category: d.category, status: d.status, lat: d.lat, lng: d.lng,
    routingMethod: d.routingMethod, hasImage: Boolean(d.hasImage),
    department: d.assignedDepartmentId ? { id: d.assignedDepartmentId, name: d.assignedDepartmentName } : null,
    createdAt: toIso(d.createdAt), updatedAt: toIso(d.updatedAt),
  };
};
const newestFirst = (a, b) => (a.createdAt < b.createdAt ? 1 : -1);

const notificationDoc = (userId, reportId, message) => ({
  userId, reportId, message, read: false, createdAt: serverTimestamp(),
});

// ------------------------------------------------------------------ departments
export async function loadDepartments() {
  const snap = await getDocs(collection(db, 'departments'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function seedDepartments(list) {
  const batch = writeBatch(db);
  list.forEach(({ id, ...data }) => batch.set(doc(db, 'departments', id), data));
  await batch.commit();
}

// ---------------------------------------------------------------------- reports
/** Realtime list. Citizens: own reports; field workers: their department's; admins: latest 200. */
export function subscribeReports(user, onData, onError) {
  const col = collection(db, 'reports');
  let q;
  if (user.role === 'admin') q = query(col, orderBy('createdAt', 'desc'), limit(200));
  else if (user.role === 'field_worker') q = query(col, where('assignedDepartmentId', '==', user.departmentId));
  else q = query(col, where('userId', '==', user.id));
  return onSnapshot(q, (snap) => onData(snap.docs.map(mapReport).sort(newestFirst)), onError);
}

/** Writes report + (optional) photo + confirmation notification in one atomic batch. */
export async function createReport({ user, form, coords, routing, imageDataUrl }) {
  const reportRef = doc(collection(db, 'reports'));
  const dept = routing.department;
  const batch = writeBatch(db);
  batch.set(reportRef, {
    userId: user.id, title: form.title.trim(), description: form.description.trim(),
    category: form.category, status: 'submitted', lat: coords.lat, lng: coords.lng,
    assignedDepartmentId: dept?.id ?? null, assignedDepartmentName: dept?.name ?? null,
    routingMethod: routing.method, hasImage: Boolean(imageDataUrl),
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  if (imageDataUrl) {
    batch.set(doc(db, 'reportImages', reportRef.id), {
      userId: user.id, dataUrl: imageDataUrl, createdAt: serverTimestamp(),
    });
  }
  batch.set(doc(collection(db, 'notifications')), notificationDoc(user.id, reportRef.id,
    dept
      ? `Your report "${form.title.trim()}" was received and sent to ${dept.name}.`
      : `Your report "${form.title.trim()}" was received and is awaiting manual assignment.`));
  await batch.commit();
  return { id: reportRef.id, department: dept };
}

export async function updateStatus(report, status) {
  if (report.status === status) return;
  const batch = writeBatch(db);
  batch.update(doc(db, 'reports', report.id), { status, updatedAt: serverTimestamp() });
  batch.set(doc(collection(db, 'notifications')), notificationDoc(report.userId, report.id,
    `Your report "${report.title}" is now: ${STATUS_LABEL[status]}.`));
  await batch.commit();
}

export async function reassignReport(report, department) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'reports', report.id), {
    assignedDepartmentId: department.id, assignedDepartmentName: department.name,
    routingMethod: 'manual', updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(db, 'notifications')), notificationDoc(report.userId, report.id,
    `Your report "${report.title}" was reassigned to ${department.name}.`));
  await batch.commit();
}

/** Photos live in their own document so report lists stay small and fast. */
export async function loadReportImage(reportId) {
  const snap = await getDoc(doc(db, 'reportImages', reportId));
  const url = snap.exists() ? snap.data().dataUrl : null;
  return typeof url === 'string' && url.startsWith('data:image/jpeg;base64,') ? url : null;
}

// --------------------------------------------------------------- notifications
export function subscribeNotifications(userId, onData, onError) {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs
      .map((d) => {
        const n = d.data({ serverTimestamps: 'estimate' });
        return { id: d.id, reportId: n.reportId, message: n.message, read: n.read, createdAt: toIso(n.createdAt) };
      })
      .sort(newestFirst)
      .slice(0, 50);
    onData(items);
  }, onError);
}

export async function markNotificationsRead(items) {
  const unread = items.filter((n) => !n.read);
  if (!unread.length) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, 'notifications', n.id), { read: true }));
  await batch.commit();
}

// ----------------------------------------------------------------------- users
export async function findUserByEmail(email) {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase())));
  const d = snap.docs[0];
  return d ? { id: d.id, ...d.data() } : null;
}

export async function setUserRole(uid, role, departmentId) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), { role, departmentId: role === 'field_worker' ? departmentId : null });
  await batch.commit();
}
