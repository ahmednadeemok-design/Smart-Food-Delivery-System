import { useState } from "react";

export default function useAsync(asyncFunction) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const execute = async (...args) => {
    setLoading(true);
    setError("");
    try {
      return await asyncFunction(...args);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
