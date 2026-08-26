import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * جلب التقييمات والآراء
 */
export const fetchCourseReviews = async (limitCount = 12) => {
  const q = query(
    collection(db, "courseRatings"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  const reviews = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  let averageRating = "0";
  if (reviews.length > 0) {
    const sum = reviews.reduce(
      (acc, curr) => acc + (Number(curr.rating) || 0),
      0
    );
    averageRating = (sum / reviews.length).toFixed(1);
  }

  return {
    reviews,
    totalReviews: reviews.length,
    averageRating,
  };
};

/**
 * إرسال تقييم جديد
 */
export const submitCourseReview = async ({
  name,
  review,
  rating,
  courseId = "default",
}) => {
  await addDoc(collection(db, "courseRatings"), {
    courseId,
    name: (name || "").trim() || "مجهول",
    review: (review || "").trim(),
    rating: Number(rating) || 5,
    createdAt: serverTimestamp(),
  });
};
