import { useState, useEffect, useRef } from "react";
import { 
  collection, 
  query, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Real-time collection listener hook.
 * @param {string} path - Absolute path inside Firestore (e.g. 'properties/lewi_house_main/rooms')
 * @param {Array} queryConstraints - Array of query constraints: where(), orderBy(), limit()
 */
export function useFirestoreCollection(path, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const constraintsRef = useRef(queryConstraints);
  const serializedConstraints = JSON.stringify(queryConstraints.map(c => c?.type || String(c)));

  useEffect(() => {
    constraintsRef.current = queryConstraints;
  }, [serializedConstraints]);

  useEffect(() => {
    if (!path) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const targetRef = collection(db, path);
    const q = queryConstraints && queryConstraints.length > 0 
      ? query(targetRef, ...constraintsRef.current) 
      : targetRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          _hasPendingWrites: docSnap.metadata.hasPendingWrites,
        }));
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`[Firestore Subscription Error] ${path}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, serializedConstraints]);

  return { data, loading, error };
}

export default useFirestoreCollection;
