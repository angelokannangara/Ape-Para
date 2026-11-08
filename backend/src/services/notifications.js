/** Insert an in-app notification. Accepts a Pool or a transaction Client. */
export const notify = (db, userId, reportId, message) =>
  db.query('INSERT INTO notifications (user_id, report_id, message) VALUES ($1, $2, $3)', [userId, reportId, message]);
